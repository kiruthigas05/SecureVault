import { Request, Response } from 'express';
import crypto from 'crypto';
import { redis } from '../config/redis';
import { User, MfaSetting } from '../models';
import { HashingService } from '../services/hashing.service';
import { SessionService } from '../services/session.service';
import { AuditLoggerService } from '../services/auditLogger.service';
import { MfaService } from '../services/mfa.service';
import { PasswordAnalyzerService } from '../services/passwordAnalyzer.service';
import { ENV } from '../config/env';

export class AuthController {
  /**
   * Register a new user
   */
  public static async register(req: Request, res: Response): Promise<void> {
    const { name, email, password } = req.body;
    const lowerEmail = email.toLowerCase().trim();

    // Validate password strength minimum
    const analysis = PasswordAnalyzerService.analyze(password);
    if (analysis.score < 25) {
      res.status(400).json({
        success: false,
        message: 'Password is too weak. Please choose a stronger password.',
        warnings: analysis.warnings,
      });
      return;
    }

    // Check duplicate email
    const existing = await User.findOne({ email: lowerEmail });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Hash password
    const passwordHash = await HashingService.hashPassword(password);

    // Insert user into MongoDB
    const user = await User.create({
      name: name.trim(),
      email: lowerEmail,
      passwordHash,
      mfaEnabled: false,
    });

    // Create session
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    const session = await SessionService.createSession(user.id, userAgent, ipAddress);

    // Log audit event
    await AuditLoggerService.log({
      userId: user.id,
      action: 'USER_REGISTERED',
      ipAddress,
      userAgent,
      metadata: { email: user.email },
    });

    res.cookie('securevault_token', session.token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mfaEnabled: user.mfaEnabled,
        },
        token: session.token,
      },
    });
  }

  /**
   * Login user
   */
  public static async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const lowerEmail = email.toLowerCase().trim();
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    // Find user in MongoDB
    const user = await User.findOne({ email: lowerEmail });

    if (!user) {
      await AuditLoggerService.log({
        action: 'FAILED_LOGIN_ATTEMPT',
        ipAddress,
        userAgent,
        metadata: { emailAttempt: lowerEmail },
      });

      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Verify master password hash
    const isPasswordValid = await HashingService.comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      await AuditLoggerService.log({
        userId: user.id,
        action: 'FAILED_LOGIN_ATTEMPT',
        ipAddress,
        userAgent,
        metadata: { reason: 'Invalid password' },
      });

      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Check if MFA is required
    if (user.mfaEnabled) {
      const mfaTempToken = crypto.randomBytes(32).toString('hex');

      // Store temp challenge token in Redis for 5 minutes
      await redis.set(
        `mfa_temp:${mfaTempToken}`,
        JSON.stringify({ userId: user.id, email: user.email }),
        'EX',
        300
      );

      await AuditLoggerService.log({
        userId: user.id,
        action: 'MFA_CHALLENGE_ISSUED',
        ipAddress,
        userAgent,
      });

      res.status(200).json({
        success: true,
        mfaRequired: true,
        message: 'Multi-factor authentication required. Please enter your 6-digit TOTP code.',
        data: {
          mfaTempToken,
        },
      });
      return;
    }

    // Standard login without MFA - Create session
    const session = await SessionService.createSession(user.id, userAgent, ipAddress);

    await AuditLoggerService.log({
      userId: user.id,
      action: 'USER_LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      metadata: { sessionId: session.sessionIdentifier },
    });

    res.cookie('securevault_token', session.token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mfaEnabled: user.mfaEnabled,
        },
        token: session.token,
      },
    });
  }

  /**
   * Complete MFA login with TOTP code or backup code
   */
  public static async mfaLogin(req: Request, res: Response): Promise<void> {
    const { mfaTempToken, code, isBackupCode } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];

    const cached = await redis.get(`mfa_temp:${mfaTempToken}`);
    if (!cached) {
      res.status(401).json({
        success: false,
        message: 'MFA verification session expired. Please log in again.',
      });
      return;
    }

    const { userId } = JSON.parse(cached);

    // Fetch MFA settings from MongoDB
    const mfaSettings = await MfaSetting.findOne({ userId });

    if (!mfaSettings) {
      res.status(400).json({
        success: false,
        message: 'MFA settings not configured for this account.',
      });
      return;
    }

    const { secret, backupCodes } = mfaSettings;
    let isCodeValid = false;

    if (isBackupCode) {
      // Verify against hashed backup codes
      const { valid, matchedIndex } = await MfaService.verifyBackupCode(code, backupCodes);
      if (valid) {
        isCodeValid = true;
        // Burn used backup code
        backupCodes.splice(matchedIndex, 1);
        await MfaSetting.updateOne({ userId }, { backupCodes });
        await AuditLoggerService.log({
          userId,
          action: 'MFA_BACKUP_CODE_USED',
          ipAddress,
          userAgent,
        });
      }
    } else {
      isCodeValid = MfaService.verifyToken(code, secret);
    }

    if (!isCodeValid) {
      await AuditLoggerService.log({
        userId,
        action: 'MFA_VERIFICATION_FAILED',
        ipAddress,
        userAgent,
      });

      res.status(401).json({
        success: false,
        message: 'Invalid two-factor authentication code.',
      });
      return;
    }

    // Invalidate temporary token
    await redis.del(`mfa_temp:${mfaTempToken}`);

    // Fetch user details from MongoDB
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Create session
    const session = await SessionService.createSession(user.id, userAgent, ipAddress);

    await AuditLoggerService.log({
      userId: user.id,
      action: 'USER_MFA_LOGIN_SUCCESS',
      ipAddress,
      userAgent,
      metadata: { sessionId: session.sessionIdentifier, usedBackupCode: Boolean(isBackupCode) },
    });

    res.cookie('securevault_token', session.token, {
      httpOnly: true,
      secure: ENV.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    res.status(200).json({
      success: true,
      message: 'Two-factor verification successful. Logged in.',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mfaEnabled: user.mfaEnabled,
        },
        token: session.token,
      },
    });
  }

  /**
   * Get current authenticated user
   */
  public static async me(req: Request, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          mfaEnabled: user.mfaEnabled,
          createdAt: user.createdAt,
        },
      },
    });
  }

  /**
   * Logout user
   */
  public static async logout(req: Request, res: Response): Promise<void> {
    if (req.user) {
      await SessionService.revokeSession(req.user.sessionIdentifier, req.user.id);
      await AuditLoggerService.log({
        userId: req.user.id,
        action: 'USER_LOGOUT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
    }

    res.clearCookie('securevault_token');
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  }

  /**
   * Request password reset token (Forgot Password)
   */
  public static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const lowerEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: lowerEmail });

    // Constant-time behavior: always return positive message to avoid email enumeration
    if (!user) {
      res.status(200).json({
        success: true,
        message: 'If an account exists with that email, a password recovery link has been prepared.',
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');

    // Store in Redis for 15 minutes
    await redis.set(
      `pwd_reset:${resetToken}`,
      JSON.stringify({ userId: user.id, email: user.email }),
      'EX',
      15 * 60
    );

    await AuditLoggerService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUESTED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    // In development mode, return simulated token so student can test directly
    res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a password recovery link has been prepared.',
      devMode: ENV.ENABLE_EMAIL_SIMULATION,
      devNotice: 'Development Mode Active: Recovery token generated with 15-minute expiration.',
      devResetToken: ENV.ENABLE_EMAIL_SIMULATION ? resetToken : undefined,
    });
  }

  /**
   * Verify password reset token
   */
  public static async verifyResetToken(req: Request, res: Response): Promise<void> {
    const { token } = req.body;
    const cached = await redis.get(`pwd_reset:${token}`);

    if (!cached) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
      return;
    }

    const data = JSON.parse(cached);
    res.status(200).json({
      success: true,
      message: 'Token is valid.',
      email: data.email,
    });
  }

  /**
   * Complete password reset with new password
   */
  public static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, password } = req.body;
    const cached = await redis.get(`pwd_reset:${token}`);

    if (!cached) {
      res.status(400).json({
        success: false,
        message: 'Password reset token is invalid or has expired.',
      });
      return;
    }

    const { userId } = JSON.parse(cached);

    // Validate strength
    const analysis = PasswordAnalyzerService.analyze(password);
    if (analysis.score < 25) {
      res.status(400).json({
        success: false,
        message: 'Password is too weak. Please choose a stronger password.',
        warnings: analysis.warnings,
      });
      return;
    }

    // Hash new password
    const newHash = await HashingService.hashPassword(password);

    // Update user in MongoDB
    await User.findByIdAndUpdate(userId, {
      passwordHash: newHash,
      updatedAt: new Date(),
    });

    // Delete token
    await redis.del(`pwd_reset:${token}`);

    // Revoke all existing sessions for this user for security
    await SessionService.revokeAllUserSessions(userId);

    await AuditLoggerService.log({
      userId,
      action: 'PASSWORD_RESET_COMPLETED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { note: 'All active sessions invalidated' },
    });

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. All active sessions have been invalidated. Please log in with your new password.',
    });
  }
}
