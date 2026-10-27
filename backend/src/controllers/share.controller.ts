import { Request, Response } from 'express';
import crypto from 'crypto';
import { redis } from '../config/redis';
import { encryptionService } from '../services/encryption.service';
import { HashingService } from '../services/hashing.service';
import { AuditLoggerService } from '../services/auditLogger.service';

export class ShareController {
  /**
   * Create an ephemeral, self-destructing secret link.
   * Encrypts using AES-256-GCM and stores in Redis with TTL.
   */
  public static async create(req: Request, res: Response): Promise<void> {
    try {
      const { secret, expirationMinutes = 60, passphrase, label } = req.body;

      if (!secret || typeof secret !== 'string') {
        res.status(400).json({ success: false, message: 'Secret content is required.' });
        return;
      }

      // Generate unique 128-bit cryptographic share token
      const shareId = crypto.randomBytes(16).toString('hex');

      // Authenticated encryption of the secret
      const encrypted = encryptionService.encrypt(secret);

      // Optional passphrase protection
      let passphraseHash: string | undefined;
      if (passphrase && passphrase.trim().length > 0) {
        passphraseHash = await HashingService.hashPassword(passphrase.trim());
      }

      // Calculate TTL in seconds (supports 2s, 5s ultra-fast up to 7 days)
      let ttlSeconds = 3600;
      if (req.body.expirationSeconds !== undefined) {
        ttlSeconds = Math.max(2, Math.min(Number(req.body.expirationSeconds) || 60, 604800));
      } else if (expirationMinutes !== undefined) {
        ttlSeconds = Math.max(2, Math.min(Math.round(Number(expirationMinutes) * 60) || 3600, 604800));
      }
      const now = Date.now();
      const expiresAt = now + ttlSeconds * 1000;

      const payload = {
        encryptedSecret: encrypted.encryptedPassword,
        iv: encrypted.iv,
        authTag: encrypted.authTag,
        createdAt: now,
        expiresAt,
        hasPassphrase: Boolean(passphraseHash),
        passphraseHash,
        label: label ? String(label).slice(0, 100) : 'Confidential Secret',
        viewsRemaining: 1,
        createdBy: req.user?.id || null,
      };

      // Store in Redis with TTL
      await redis.set(`share:${shareId}`, JSON.stringify(payload), 'EX', ttlSeconds);

      if (req.user?.id) {
        await AuditLoggerService.log({
          userId: req.user.id,
          action: 'EPHEMERAL_SECRET_CREATED',
          metadata: { shareId, expiresAt: new Date(expiresAt).toISOString(), hasPassphrase: Boolean(passphraseHash) },
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      res.status(201).json({
        success: true,
        message: 'Ephemeral secret generated successfully.',
        data: {
          shareId,
          expiresAt: new Date(expiresAt).toISOString(),
          ttlSeconds,
          hasPassphrase: Boolean(passphraseHash),
          label: payload.label,
        },
      });
    } catch (error) {
      console.error('Error creating ephemeral secret share:', error);
      res.status(500).json({ success: false, message: 'Failed to create ephemeral secret.' });
    }
  }

  /**
   * Check if secret exists and get metadata without revealing ciphertext.
   */
  public static async getMeta(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const raw = await redis.get(`share:${id}`);

      if (!raw) {
        res.status(404).json({
          success: false,
          burned: true,
          message: 'This secret does not exist, has expired, or was already burned after being viewed.',
        });
        return;
      }

      const payload = JSON.parse(raw);

      res.status(200).json({
        success: true,
        data: {
          shareId: id,
          label: payload.label,
          hasPassphrase: payload.hasPassphrase,
          createdAt: new Date(payload.createdAt).toISOString(),
          expiresAt: new Date(payload.expiresAt).toISOString(),
          viewsRemaining: payload.viewsRemaining,
        },
      });
    } catch (error) {
      console.error('Error fetching share metadata:', error);
      res.status(500).json({ success: false, message: 'Failed to retrieve secret metadata.' });
    }
  }

  /**
   * Reveal the secret once and immediately destroy it from Redis (Burn-on-Read).
   */
  public static async reveal(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { passphrase } = req.body || {};

      const raw = await redis.get(`share:${id}`);

      if (!raw) {
        res.status(404).json({
          success: false,
          burned: true,
          message: 'This secret has already been burned or has expired. It cannot be recovered.',
        });
        return;
      }

      const payload = JSON.parse(raw);

      // Verify passphrase if configured
      if (payload.hasPassphrase && payload.passphraseHash) {
        if (!passphrase) {
          res.status(401).json({
            success: false,
            requiresPassphrase: true,
            message: 'A passphrase is required to decrypt this secret.',
          });
          return;
        }

        const matches = await HashingService.comparePassword(passphrase, payload.passphraseHash);
        if (!matches) {
          res.status(401).json({
            success: false,
            message: 'Incorrect passphrase. The secret remains protected.',
          });
          return;
        }
      }

      // Decrypt using AES-256-GCM
      const decryptedSecret = encryptionService.decrypt(
        payload.encryptedSecret,
        payload.iv,
        payload.authTag
      );

      // IMMEDIATELY BURN AND ERASE FROM CACHE (Zero-Retention)
      await redis.del(`share:${id}`);

      if (payload.createdBy) {
        await AuditLoggerService.log({
          userId: payload.createdBy,
          action: 'EPHEMERAL_SECRET_BURNED',
          metadata: { shareId: id, burnedAt: new Date().toISOString() },
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.headers['user-agent'],
        });
      }

      res.status(200).json({
        success: true,
        message: 'Secret decrypted successfully. It has now been permanently burned from the system.',
        data: {
          secret: decryptedSecret,
          label: payload.label,
          burnedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error('Error revealing ephemeral secret:', error);
      res.status(500).json({ success: false, message: 'Failed to decrypt secret or secret was corrupted.' });
    }
  }
}
