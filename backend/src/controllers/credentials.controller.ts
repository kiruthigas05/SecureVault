import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Credential } from '../models';
import { encryptionService } from '../services/encryption.service';
import { AuditLoggerService } from '../services/auditLogger.service';

export class CredentialsController {
  /**
   * List all credentials for current user.
   * NEVER returns decrypted passwords in list view.
   */
  public static async list(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const search = (req.query.search as string) || '';

    const filter: any = { userId };
    if (search.trim()) {
      filter.$or = [
        { website: { $regex: search.trim(), $options: 'i' } },
        { username: { $regex: search.trim(), $options: 'i' } },
      ];
    }

    const items = await Credential.find(filter).sort({ updatedAt: -1 });
    const now = Date.now();

    res.status(200).json({
      success: true,
      data: {
        credentials: items.map((row) => {
          const updatedTime = new Date(row.updatedAt || row.createdAt || now).getTime();
          const ageDays = Math.max(0, Math.floor((now - updatedTime) / (1000 * 60 * 60 * 24)));
          let ageStatus: 'fresh' | 'aging' | 'stale' = 'fresh';
          if (ageDays > 90) ageStatus = 'stale';
          else if (ageDays >= 30) ageStatus = 'aging';

          return {
            id: row.id,
            website: row.website,
            username: row.username,
            createdAt: row.createdAt,
            updatedAt: row.updatedAt,
            ageDays,
            ageStatus,
          };
        }),
        total: items.length,
      },
    });
  }

  /**
   * Create new credential in vault.
   * Encrypts with AES-256-GCM authenticated encryption.
   */
  public static async create(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const { website, username, password } = req.body;

    // Encrypt password using AES-256-GCM
    const { encryptedPassword, iv, authTag } = encryptionService.encrypt(password);

    const newCred = await Credential.create({
      userId,
      website: website.trim(),
      username: username.trim(),
      encryptedPassword,
      iv,
      authTag,
    });

    await AuditLoggerService.log({
      userId,
      action: 'CREDENTIAL_CREATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { website: newCred.website, username: newCred.username },
    });

    res.status(201).json({
      success: true,
      message: 'Credential securely encrypted and stored.',
      data: {
        credential: {
          id: newCred.id,
          website: newCred.website,
          username: newCred.username,
          createdAt: newCred.createdAt,
          updatedAt: newCred.updatedAt,
        },
      },
    });
  }

  /**
   * Get single credential with decrypted password (Reveal).
   * Strict user isolation: 403 / 404 if not owned by caller.
   */
  public static async getOne(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const credentialId = req.params.id;

    if (!mongoose.isValidObjectId(credentialId)) {
      res.status(404).json({
        success: false,
        message: 'Credential not found.',
      });
      return;
    }

    const row = await Credential.findById(credentialId);

    if (!row) {
      res.status(404).json({
        success: false,
        message: 'Credential not found.',
      });
      return;
    }

    // Multi-tenant check
    if (row.userId !== userId) {
      await AuditLoggerService.log({
        userId,
        action: 'UNAUTHORIZED_CREDENTIAL_ACCESS_ATTEMPT',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { attemptedCredentialId: credentialId },
      });

      res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this credential.',
      });
      return;
    }

    // Decrypt password with authenticated tag verification
    let decryptedPassword = '';
    try {
      decryptedPassword = encryptionService.decrypt(
        row.encryptedPassword,
        row.iv,
        row.authTag
      );
    } catch (e: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to verify credential integrity. Decryption failed.',
      });
      return;
    }

    await AuditLoggerService.log({
      userId,
      action: 'CREDENTIAL_REVEALED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { website: row.website },
    });

    res.status(200).json({
      success: true,
      data: {
        credential: {
          id: row.id,
          website: row.website,
          username: row.username,
          password: decryptedPassword,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        },
      },
    });
  }

  /**
   * Update credential.
   */
  public static async update(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const credentialId = req.params.id;
    const { website, username, password } = req.body;

    if (!mongoose.isValidObjectId(credentialId)) {
      res.status(404).json({ success: false, message: 'Credential not found.' });
      return;
    }

    const existing = await Credential.findById(credentialId);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Credential not found.' });
      return;
    }

    if (existing.userId !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden: You do not have access.' });
      return;
    }

    let encryptedPassword = existing.encryptedPassword;
    let iv = existing.iv;
    let authTag = existing.authTag;

    if (password && password.trim()) {
      const encrypted = encryptionService.encrypt(password);
      encryptedPassword = encrypted.encryptedPassword;
      iv = encrypted.iv;
      authTag = encrypted.authTag;
    }

    const updatedWebsite = website ? website.trim() : existing.website;
    const updatedUsername = username ? username.trim() : existing.username;

    existing.website = updatedWebsite;
    existing.username = updatedUsername;
    existing.encryptedPassword = encryptedPassword;
    existing.iv = iv;
    existing.authTag = authTag;
    await existing.save();

    await AuditLoggerService.log({
      userId,
      action: 'CREDENTIAL_UPDATED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { website: updatedWebsite, username: updatedUsername },
    });

    res.status(200).json({
      success: true,
      message: 'Credential updated successfully.',
      data: {
        credential: {
          id: existing.id,
          website: existing.website,
          username: existing.username,
          createdAt: existing.createdAt,
          updatedAt: existing.updatedAt,
        },
      },
    });
  }

  /**
   * Delete credential.
   */
  public static async delete(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const credentialId = req.params.id;

    if (!mongoose.isValidObjectId(credentialId)) {
      res.status(404).json({ success: false, message: 'Credential not found.' });
      return;
    }

    const existing = await Credential.findById(credentialId);

    if (!existing) {
      res.status(404).json({ success: false, message: 'Credential not found.' });
      return;
    }

    if (existing.userId !== userId) {
      res.status(403).json({ success: false, message: 'Forbidden.' });
      return;
    }

    await Credential.findByIdAndDelete(credentialId);

    await AuditLoggerService.log({
      userId,
      action: 'CREDENTIAL_DELETED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { website: existing.website },
    });

    res.status(200).json({
      success: true,
      message: 'Credential permanently removed from vault.',
    });
  }
}
