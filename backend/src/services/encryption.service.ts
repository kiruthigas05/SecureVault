import crypto from 'crypto';
import { ENV } from '../config/env';

export interface EncryptedPayload {
  encryptedPassword: string;
  iv: string;
  authTag: string;
}

class EncryptionService {
  private key: Buffer;

  constructor() {
    // Ensure key is exactly 32 bytes (256 bits)
    if (ENV.ENCRYPTION_KEY.length === 64 && /^[0-9a-fA-F]+$/.test(ENV.ENCRYPTION_KEY)) {
      this.key = Buffer.from(ENV.ENCRYPTION_KEY, 'hex');
    } else {
      // Deterministically derive 32 bytes using scrypt
      this.key = crypto.scryptSync(ENV.ENCRYPTION_KEY, 'securevault_salt_v1', 32);
    }
  }

  /**
   * Encrypts plaintext using AES-256-GCM authenticated encryption.
   * Produces ciphertext, unique 12-byte IV, and 16-byte authentication tag.
   */
  public encrypt(plaintext: string): EncryptedPayload {
    const iv = crypto.randomBytes(12); // Standard 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', this.key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encryptedPassword: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
    };
  }

  /**
   * Decrypts ciphertext using AES-256-GCM and verifies authenticity tag.
   * Throws error if ciphertext or auth tag has been tampered with.
   */
  public decrypt(encryptedPassword: string, ivHex: string, authTagHex: string): string {
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedPassword, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

export const encryptionService = new EncryptionService();
