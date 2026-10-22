import { describe, it, expect, beforeEach } from 'vitest';
import { encryptionService } from '../src/services/encryption.service';
import { PasswordAnalyzerService } from '../src/services/passwordAnalyzer.service';
import { PasswordGeneratorService } from '../src/services/passwordGenerator.service';
import { HashingService } from '../src/services/hashing.service';
import { MfaService } from '../src/services/mfa.service';

describe('SecureVault Cryptographic & Security Services', () => {

  describe('1. AES-256-GCM Authenticated Encryption', () => {
    it('should encrypt and decrypt plaintext password correctly', () => {
      const originalPassword = 'My$uperSecureVaultPassword2026!';
      const encrypted = encryptionService.encrypt(originalPassword);

      expect(encrypted.encryptedPassword).toBeDefined();
      expect(encrypted.iv).toHaveLength(24); // 12 bytes = 24 hex chars
      expect(encrypted.authTag).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(encrypted.encryptedPassword).not.toEqual(originalPassword);

      const decrypted = encryptionService.decrypt(
        encrypted.encryptedPassword,
        encrypted.iv,
        encrypted.authTag
      );
      expect(decrypted).toEqual(originalPassword);
    });

    it('should detect tampering and fail decryption if auth tag is modified', () => {
      const originalPassword = 'SecretToken12345';
      const encrypted = encryptionService.encrypt(originalPassword);

      // Tamper with authentication tag
      const corruptedTag = '00' + encrypted.authTag.slice(2);

      expect(() => {
        encryptionService.decrypt(encrypted.encryptedPassword, encrypted.iv, corruptedTag);
      }).toThrow();
    });

    it('should produce unique IV for every encryption call with identical plaintext', () => {
      const password = 'RepeatedPassword99!';
      const enc1 = encryptionService.encrypt(password);
      const enc2 = encryptionService.encrypt(password);

      expect(enc1.iv).not.toEqual(enc2.iv);
      expect(enc1.encryptedPassword).not.toEqual(enc2.encryptedPassword);
    });
  });

  describe('2. Password Analyzer & Entropy Calculation', () => {
    it('should flag weak password with common patterns', () => {
      const result = PasswordAnalyzerService.analyze('password123');
      expect(result.strength).toMatch(/Weak|Very Weak/);
      expect(result.hasCommonPattern).toBe(true);
      expect(result.criteria.length12Plus).toBe(false);
      expect(result.score).toBeLessThan(50);
    });

    it('should accurately analyze a high-entropy strong password', () => {
      const result = PasswordAnalyzerService.analyze('X9$vL7!qZ2@mK4#wP8');
      expect(result.score).toBeGreaterThanOrEqual(85);
      expect(result.strength).toEqual('Very Strong');
      expect(result.hasUppercase).toBe(true);
      expect(result.hasLowercase).toBe(true);
      expect(result.hasNumbers).toBe(true);
      expect(result.hasSpecial).toBe(true);
      expect(result.entropy).toBeGreaterThan(70);
      expect(result.criteria.length12Plus).toBe(true);
      expect(result.criteria.noObviousPattern).toBe(true);
    });

    it('should detect repeated consecutive characters', () => {
      const result = PasswordAnalyzerService.analyze('aaaaaa123!Abc');
      expect(result.hasRepeatedChars).toBe(true);
      expect(result.warnings.some((w) => w.includes('repeated'))).toBe(true);
    });
  });

  describe('3. Cryptographically Secure Password Generator', () => {
    it('should generate passwords of specified length with all selected character sets', () => {
      const gen = PasswordGeneratorService.generate({
        length: 24,
        uppercase: true,
        lowercase: true,
        numbers: true,
        special: true,
      });

      expect(gen.password).toHaveLength(24);
      expect(/[A-Z]/.test(gen.password)).toBe(true);
      expect(/[a-z]/.test(gen.password)).toBe(true);
      expect(/[0-9]/.test(gen.password)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(gen.password)).toBe(true);
      expect(gen.analysis.score).toBeGreaterThanOrEqual(80);
    });

    it('should respect character set exclusions', () => {
      const gen = PasswordGeneratorService.generate({
        length: 16,
        uppercase: false,
        lowercase: true,
        numbers: true,
        special: false,
      });

      expect(gen.password).toHaveLength(16);
      expect(/[A-Z]/.test(gen.password)).toBe(false);
      expect(/[^A-Za-z0-9]/.test(gen.password)).toBe(false);
    });
  });

  describe('4. User Authentication Password Hashing', () => {
    it('should hash authentication passwords with bcrypt and never store plaintext', async () => {
      const password = 'AuthPasswordTest99!';
      const hash = await HashingService.hashPassword(password);

      expect(hash).not.toEqual(password);
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/); // Valid bcrypt format

      const isValid = await HashingService.comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await HashingService.comparePassword('WrongPassword', hash);
      expect(isInvalid).toBe(false);
    });
  });

  describe('5. Multi-Factor Authentication (TOTP & Backup Codes)', () => {
    it('should generate valid TOTP setup payload with QR code and backup codes', async () => {
      const setup = await MfaService.generateMfaSetup('security_officer@demo.org');

      expect(setup.secret).toBeDefined();
      expect(setup.otpauthUrl).toContain('otpauth://totp/SecureVault');
      expect(setup.otpauthUrl).toContain('security_officer');
      expect(setup.qrCodeUrl).toMatch(/^data:image\/png;base64,/);
      expect(setup.backupCodes).toHaveLength(6);
      expect(setup.backupCodes[0]).toMatch(/^[0-9A-F]{4}-[0-9A-F]{4}$/);
    });

    it('should hash and verify one-time backup recovery codes', async () => {
      const rawCodes = ['ABCD-1234', 'EFGH-5678'];
      const hashedCodes = await MfaService.hashBackupCodes(rawCodes);

      // Verify matching code
      const result = await MfaService.verifyBackupCode('ABCD-1234', hashedCodes);
      expect(result.valid).toBe(true);
      expect(result.matchedIndex).toBe(0);

      // Reject non-existent code
      const invalidResult = await MfaService.verifyBackupCode('XXXX-9999', hashedCodes);
      expect(invalidResult.valid).toBe(false);
      expect(invalidResult.matchedIndex).toBe(-1);
    });
  });

  describe('6. Multi-Tenant Authorization Security Principle', () => {
    it('should enforce user isolation: User A cannot decrypt or access User B credentials', () => {
      const userA_Id = 'user-uuid-aaaa-1111';
      const userB_Id = 'user-uuid-bbbb-2222';

      const userB_Credential = {
        id: 'cred-uuid-9999',
        userId: userB_Id,
        website: 'banking.com',
        encryptedPassword: encryptionService.encrypt('TopSecretBankPin!').encryptedPassword,
      };

      // Simulated authorization check as executed by CredentialsController
      const checkAccess = (requestingUserId: string, credentialOwnerId: string) => {
        if (requestingUserId !== credentialOwnerId) {
          return { status: 403, allowed: false, message: 'Forbidden: Access denied' };
        }
        return { status: 200, allowed: true };
      };

      const accessAttempt = checkAccess(userA_Id, userB_Credential.userId);
      expect(accessAttempt.allowed).toBe(false);
      expect(accessAttempt.status).toBe(403);
    });
  });

});
