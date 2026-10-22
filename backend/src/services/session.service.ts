import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { Session } from '../models';
import { redis } from '../config/redis';
import { ENV } from '../config/env';

export interface SessionInfo {
  id: string;
  userId: string;
  sessionIdentifier: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date | null;
  isCurrent?: boolean;
}

export class SessionService {
  private static readonly SESSION_DURATION_HOURS = 24 * 7; // 7 days

  /**
   * Creates a new session in DB and caches it in Redis.
   */
  public static async createSession(
    userId: string,
    userAgent?: string,
    ipAddress?: string
  ): Promise<{ token: string; sessionIdentifier: string; expiresAt: Date }> {
    const sessionIdentifier = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.SESSION_DURATION_HOURS * 3600 * 1000);

    await Session.create({
      userId,
      sessionIdentifier,
      userAgent: userAgent || 'Unknown Device',
      ipAddress: ipAddress || '127.0.0.1',
      expiresAt,
    });

    // Cache in Redis for quick lookup
    const cacheKey = `session:${sessionIdentifier}`;
    const ttlSeconds = this.SESSION_DURATION_HOURS * 3600;
    await redis.set(
      cacheKey,
      JSON.stringify({ userId, sessionIdentifier, active: true }),
      'EX',
      ttlSeconds
    );

    // Generate JWT token containing userId and sessionIdentifier
    const token = jwt.sign(
      { userId, sessionIdentifier },
      ENV.JWT_SECRET,
      { expiresIn: `${this.SESSION_DURATION_HOURS}h` }
    );

    return { token, sessionIdentifier, expiresAt };
  }

  /**
   * Validates if a session is currently active and unrevoked.
   */
  public static async validateSession(
    sessionIdentifier: string
  ): Promise<{ valid: boolean; userId?: string }> {
    // 1. Check Redis cache first
    const cached = await redis.get(`session:${sessionIdentifier}`);
    if (cached) {
      const data = JSON.parse(cached);
      if (data && data.active && data.userId) {
        return { valid: true, userId: data.userId };
      }
    }

    // 2. Query MongoDB
    const doc = await Session.findOne({ sessionIdentifier });

    if (!doc) {
      return { valid: false };
    }

    const isExpired = new Date(doc.expiresAt).getTime() < Date.now();
    const isRevoked = doc.revokedAt !== null && doc.revokedAt !== undefined;

    if (isExpired || isRevoked) {
      await redis.del(`session:${sessionIdentifier}`);
      return { valid: false };
    }

    // Refresh cache
    await redis.set(
      `session:${sessionIdentifier}`,
      JSON.stringify({ userId: doc.userId, sessionIdentifier, active: true }),
      'EX',
      3600 * 24
    );

    return { valid: true, userId: doc.userId };
  }

  /**
   * Lists active sessions for a user.
   */
  public static async listUserSessions(
    userId: string,
    currentSessionIdentifier?: string
  ): Promise<SessionInfo[]> {
    const items = await Session.find({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() },
    }).sort({ createdAt: -1 });

    return items.map((row) => ({
      id: row.id,
      userId: row.userId,
      sessionIdentifier: row.sessionIdentifier,
      userAgent: row.userAgent,
      ipAddress: row.ipAddress,
      createdAt: row.createdAt,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      isCurrent: row.sessionIdentifier === currentSessionIdentifier,
    }));
  }

  /**
   * Revokes a specific session (by MongoDB _id or 64-char sessionIdentifier).
   */
  public static async revokeSession(sessionIdOrIdentifier: string, userId: string): Promise<boolean> {
    const isObjectId = mongoose.isValidObjectId(sessionIdOrIdentifier);
    const filter = isObjectId
      ? { $or: [{ _id: sessionIdOrIdentifier }, { sessionIdentifier: sessionIdOrIdentifier }], userId }
      : { sessionIdentifier: sessionIdOrIdentifier, userId };

    const doc = await Session.findOne(filter);

    if (doc) {
      doc.revokedAt = new Date();
      await doc.save();
      await redis.del(`session:${doc.sessionIdentifier}`);
      return true;
    }
    return false;
  }

  /**
   * Revokes all other sessions for a user except the current one.
   */
  public static async revokeAllOtherSessions(
    userId: string,
    currentSessionIdentifier: string
  ): Promise<number> {
    const others = await Session.find({
      userId,
      sessionIdentifier: { $ne: currentSessionIdentifier },
      revokedAt: null,
    });

    await Session.updateMany(
      {
        userId,
        sessionIdentifier: { $ne: currentSessionIdentifier },
        revokedAt: null,
      },
      { revokedAt: new Date() }
    );

    for (const row of others) {
      await redis.del(`session:${row.sessionIdentifier}`);
    }

    return others.length;
  }

  /**
   * Invalidate all sessions for a user (e.g., after password reset).
   */
  public static async revokeAllUserSessions(userId: string): Promise<void> {
    const all = await Session.find({ userId, revokedAt: null });

    await Session.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() }
    );

    for (const row of all) {
      await redis.del(`session:${row.sessionIdentifier}`);
    }
  }
}
