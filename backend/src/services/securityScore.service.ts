import { User, Credential, Session } from '../models';
import { encryptionService } from './encryption.service';
import { PasswordAnalyzerService } from './passwordAnalyzer.service';

export interface PasswordReuseGroup {
  count: number;
  websites: string[];
  usernames: string[];
}

export interface SecurityScoreReport {
  overallScore: number;
  status: 'Critical' | 'Poor' | 'Moderate' | 'Good' | 'Strong';
  breakdown: {
    passwordStrength: number; // 0-100
    passwordReuse: number; // 0-100
    mfaProtection: number; // 0 or 100
    credentialHygiene: number; // 0-100
    accountSecurity: number; // 0-100
  };
  metrics: {
    totalCredentials: number;
    weakPasswordsCount: number;
    reusedPasswordsCount: number;
    mfaEnabled: boolean;
    activeSessionsCount: number;
    stalePasswordsCount: number;
    agingPasswordsCount: number;
    freshPasswordsCount: number;
    averageAgeDays: number;
  };
  reusedGroups: PasswordReuseGroup[];
  recommendations: {
    id: string;
    type: 'success' | 'warning' | 'danger';
    title: string;
    description: string;
    actionLabel?: string;
    actionRoute?: string;
  }[];
}

export class SecurityScoreService {
  public static async calculateUserScore(userId: string): Promise<SecurityScoreReport> {
    // 1. Fetch user MFA status
    const user = await User.findById(userId);
    const mfaEnabled = user ? Boolean(user.mfaEnabled) : false;

    // 2. Fetch all credentials for user
    const creds = await Credential.find({ userId });

    // 3. Fetch active sessions count
    const activeSessionsCount = await Session.countDocuments({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    });

    const totalCredentials = creds.length;
    let strengthTotal = 0;
    let weakPasswordsCount = 0;
    let freshPasswordsCount = 0;
    let agingPasswordsCount = 0;
    let stalePasswordsCount = 0;
    let totalAgeDays = 0;
    const now = Date.now();

    // Map plaintext password to list of websites for reuse detection
    const passwordGroups = new Map<string, { websites: string[]; usernames: string[] }>();

    for (const cred of creds) {
      const updatedAtMs = new Date(cred.updatedAt || cred.createdAt || now).getTime();
      const ageDays = Math.max(0, Math.floor((now - updatedAtMs) / (1000 * 60 * 60 * 24)));
      totalAgeDays += ageDays;

      if (ageDays > 90) {
        stalePasswordsCount++;
      } else if (ageDays >= 30) {
        agingPasswordsCount++;
      } else {
        freshPasswordsCount++;
      }

      try {
        const plain = encryptionService.decrypt(
          cred.encryptedPassword,
          cred.iv,
          cred.authTag
        );

        const analysis = PasswordAnalyzerService.analyze(plain);
        strengthTotal += analysis.score;
        if (analysis.score < 60) {
          weakPasswordsCount++;
        }

        // Group by plaintext for reuse detection
        const existing = passwordGroups.get(plain) || { websites: [], usernames: [] };
        existing.websites.push(cred.website);
        existing.usernames.push(cred.username);
        passwordGroups.set(plain, existing);
      } catch (err) {
        console.error('Error decrypting credential for scoring:', err);
      }
    }


    const averageAgeDays = totalCredentials > 0 ? Math.round(totalAgeDays / totalCredentials) : 0;


    // Identify reuse groups
    const reusedGroups: PasswordReuseGroup[] = [];
    let reusedPasswordsCount = 0;

    for (const group of passwordGroups.values()) {
      if (group.websites.length > 1) {
        reusedGroups.push({
          count: group.websites.length,
          websites: group.websites,
          usernames: group.usernames,
        });
        reusedPasswordsCount += group.websites.length;
      }
    }

    // Component calculations
    const passwordStrengthScore =
      totalCredentials > 0 ? Math.round(strengthTotal / totalCredentials) : 85;

    // Reuse score: 100 if no reuse, drops according to ratio of reused credentials
    let passwordReuseScore = 100;
    if (totalCredentials > 0) {
      const reuseRatio = reusedPasswordsCount / totalCredentials;
      passwordReuseScore = Math.max(0, Math.round(100 - reuseRatio * 75));
    }

    const mfaProtectionScore = mfaEnabled ? 100 : 0;

    // Credential hygiene: penalty for weak passwords
    let credentialHygiene = 100;
    if (totalCredentials > 0) {
      credentialHygiene = Math.max(0, Math.round(100 - (weakPasswordsCount / totalCredentials) * 60));
    }

    // Account security based on MFA and session count
    let accountSecurity = 80;
    if (mfaEnabled) accountSecurity += 15;
    if (activeSessionsCount <= 3) accountSecurity += 5;
    accountSecurity = Math.min(100, accountSecurity);

    // Weighted Overall Score
    // Weightings: Password Strength 25%, Password Reuse 25%, MFA 25%, Hygiene 15%, Account 10%
    const weightedScore = Math.round(
      passwordStrengthScore * 0.25 +
      passwordReuseScore * 0.25 +
      mfaProtectionScore * 0.25 +
      credentialHygiene * 0.15 +
      accountSecurity * 0.10
    );

    const overallScore = Math.max(10, Math.min(100, weightedScore));

    let status: 'Critical' | 'Poor' | 'Moderate' | 'Good' | 'Strong';
    if (overallScore >= 85) status = 'Strong';
    else if (overallScore >= 70) status = 'Good';
    else if (overallScore >= 50) status = 'Moderate';
    else if (overallScore >= 35) status = 'Poor';
    else status = 'Critical';

    // Build smart recommendations
    const recommendations: SecurityScoreReport['recommendations'] = [];

    if (mfaEnabled) {
      recommendations.push({
        id: 'mfa-ok',
        type: 'success',
        title: 'Two-Factor Authentication Active',
        description: 'Your account is fortified with Time-based One-Time Password (TOTP) verification.',
      });
    } else {
      recommendations.push({
        id: 'mfa-missing',
        type: 'danger',
        title: 'Enable Multi-Factor Authentication',
        description: 'Protect your vault against compromised passwords by enabling TOTP authentication.',
        actionLabel: 'Enable MFA',
        actionRoute: '/settings',
      });
    }

    if (reusedGroups.length > 0) {
      recommendations.push({
        id: 'reuse-warning',
        type: 'warning',
        title: `${reusedPasswordsCount} Accounts Share Reused Passwords`,
        description: 'Reusing passwords creates credential-stuffing vulnerability. Generate unique credentials.',
        actionLabel: 'View Vault',
        actionRoute: '/vault',
      });
    } else if (totalCredentials > 0) {
      recommendations.push({
        id: 'reuse-ok',
        type: 'success',
        title: 'Zero Password Reuse',
        description: 'All stored accounts have distinct, unique credentials.',
      });
    }

    if (weakPasswordsCount > 0) {
      recommendations.push({
        id: 'weak-warning',
        type: 'warning',
        title: `${weakPasswordsCount} Weak Passwords Found`,
        description: 'Update credentials with low entropy to prevent brute-force attacks.',
        actionLabel: 'Use Generator',
        actionRoute: '/password-generator',
      });
    }

    if (activeSessionsCount > 3) {
      recommendations.push({
        id: 'sessions-warning',
        type: 'warning',
        title: `${activeSessionsCount} Active Sessions Detected`,
        description: 'Multiple active devices or browser sessions. Review and revoke unfamiliar sessions.',
        actionLabel: 'Review Sessions',
        actionRoute: '/security',
      });
    } else {
      recommendations.push({
        id: 'sessions-ok',
        type: 'success',
        title: 'Healthy Session State',
        description: 'No dormant or excessive active browser sessions found.',
      });
    }

    if (stalePasswordsCount > 0) {
      recommendations.push({
        id: 'stale-warning',
        type: 'warning',
        title: `${stalePasswordsCount} Stale Passwords (>90 Days Old)`,
        description: 'Passwords unchanged for over 90 days increase breach exposure. Consider rotating them.',
        actionLabel: 'Rotate in Vault',
        actionRoute: '/vault',
      });
    } else if (totalCredentials > 0) {
      recommendations.push({
        id: 'rotation-ok',
        type: 'success',
        title: 'Credentials Fresh & Updated',
        description: 'All saved credentials adhere to the active 90-day password rotation policy.',
      });
    }

    return {
      overallScore,
      status,
      breakdown: {
        passwordStrength: passwordStrengthScore,
        passwordReuse: passwordReuseScore,
        mfaProtection: mfaProtectionScore,
        credentialHygiene,
        accountSecurity,
      },
      metrics: {
        totalCredentials,
        weakPasswordsCount,
        reusedPasswordsCount,
        mfaEnabled,
        activeSessionsCount,
        stalePasswordsCount,
        agingPasswordsCount,
        freshPasswordsCount,
        averageAgeDays,
      },
      reusedGroups,
      recommendations,
    };
  }
}

