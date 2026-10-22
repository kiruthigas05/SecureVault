import { Request, Response } from 'express';
import { User, MfaSetting } from '../models';
import { MfaService } from '../services/mfa.service';
import { HashingService } from '../services/hashing.service';
import { AuditLoggerService } from '../services/auditLogger.service';

export class MfaController {
  /**
   * Initialize MFA Setup: returns QR code and backup codes
   */
  public static async setup(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;

    // Get user email
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Generate setup credentials
    const setupData = await MfaService.generateMfaSetup(user.email);

    res.status(200).json({
      success: true,
      data: {
        mfaEnabled: user.mfaEnabled,
        secret: setupData.secret,
        qrCodeUrl: setupData.qrCodeUrl,
        otpauthUrl: setupData.otpauthUrl,
        backupCodes: setupData.backupCodes,
      },
    });
  }

  /**
   * Verify TOTP code and finalize enabling MFA
   */
  public static async verifyAndEnable(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { token, secret, backupCodes } = req.body;

    // Verify token with secret
    const isValid = MfaService.verifyToken(token, secret);
    if (!isValid) {
      res.status(400).json({
        success: false,
        message: 'Invalid 6-digit verification code. Please make sure your authenticator clock is synced.',
      });
      return;
    }

    // Hash backup codes before storing
    const hashedBackupCodes = await MfaService.hashBackupCodes(backupCodes);

    // Save to MfaSetting (upsert)
    await MfaSetting.findOneAndUpdate(
      { userId },
      { secret, backupCodes: hashedBackupCodes, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Update user mfaEnabled = true
    await User.findByIdAndUpdate(userId, { mfaEnabled: true, updatedAt: new Date() });

    await AuditLoggerService.log({
      userId,
      action: 'MFA_ENABLED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { method: 'TOTP' },
    });

    res.status(200).json({
      success: true,
      message: 'Multi-Factor Authentication (TOTP) successfully activated!',
      data: {
        mfaEnabled: true,
      },
    });
  }

  /**
   * Disable MFA (requires password confirmation)
   */
  public static async disable(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    const isMatch = await HashingService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Incorrect password. Cannot disable Multi-Factor Authentication.',
      });
      return;
    }

    // Delete mfa_settings and set mfa_enabled = false
    await MfaSetting.deleteOne({ userId });
    await User.findByIdAndUpdate(userId, { mfaEnabled: false, updatedAt: new Date() });

    await AuditLoggerService.log({
      userId,
      action: 'MFA_DISABLED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.status(200).json({
      success: true,
      message: 'Multi-Factor Authentication has been disabled.',
      data: {
        mfaEnabled: false,
      },
    });
  }

  /**
   * Get MFA status
   */
  public static async getStatus(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const user = await User.findById(userId);

    const mfaEnabled = user ? Boolean(user.mfaEnabled) : false;

    let remainingBackupCodes = 0;
    if (mfaEnabled) {
      const settings = await MfaSetting.findOne({ userId });
      if (settings && Array.isArray(settings.backupCodes)) {
        remainingBackupCodes = settings.backupCodes.length;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        mfaEnabled,
        remainingBackupCodes,
      },
    });
  }
}
