import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

// Configure authenticator options
authenticator.options = {
  window: 1, // Allow 1 step (30s) drift backward/forward
};

export interface MfaSetupData {
  secret: string;
  qrCodeUrl: string;
  otpauthUrl: string;
  backupCodes: string[];
}

export class MfaService {
  /**
   * Generates a new TOTP secret, backup codes, and QR code data URL.
   */
  public static async generateMfaSetup(email: string): Promise<MfaSetupData> {
    const secret = authenticator.generateSecret();
    const serviceName = 'SecureVault';
    const otpauthUrl = authenticator.keyuri(email, serviceName, secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauthUrl, {
      margin: 1,
      width: 240,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    // Generate 6 random alphanumeric 8-character backup codes
    const backupCodes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8 characters
      backupCodes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
    }

    return {
      secret,
      qrCodeUrl,
      otpauthUrl,
      backupCodes,
    };
  }

  /**
   * Verifies a 6-digit TOTP token against the secret.
   */
  public static verifyToken(token: string, secret: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  /**
   * Hashes backup codes for secure storage.
   */
  public static async hashBackupCodes(codes: string[]): Promise<string[]> {
    return Promise.all(codes.map((c) => bcrypt.hash(c.replace('-', ''), 10)));
  }

  /**
   * Verifies and burns a backup code.
   */
  public static async verifyBackupCode(providedCode: string, hashedCodes: string[]): Promise<{ valid: boolean; matchedIndex: number }> {
    const cleanCode = providedCode.replace('-', '').trim();
    for (let i = 0; i < hashedCodes.length; i++) {
      const match = await bcrypt.compare(cleanCode, hashedCodes[i]);
      if (match) {
        return { valid: true, matchedIndex: i };
      }
    }
    return { valid: false, matchedIndex: -1 };
  }
}
