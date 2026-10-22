import { AuditLog } from '../models';

export interface AuditLogEntry {
  userId?: string | null;
  action: string;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export class AuditLoggerService {
  /**
   * Records an immutable security audit event.
   * Redacts any potential secrets in metadata to strictly prevent leakages.
   */
  public static async log(entry: AuditLogEntry): Promise<void> {
    const sanitizedMetadata = this.sanitizeMetadata(entry.metadata || {});

    try {
      await AuditLog.create({
        userId: entry.userId || null,
        action: entry.action,
        ipAddress: entry.ipAddress || 'unknown',
        userAgent: entry.userAgent ? entry.userAgent.slice(0, 500) : 'unknown',
        metadata: sanitizedMetadata,
      });
    } catch (err: any) {
      console.error('AuditLogger error writing to DB:', err.message);
    }
  }

  /**
   * Sanitizes metadata to strip sensitive fields.
   */
  private static sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
    const forbiddenKeys = [
      'password',
      'password_hash',
      'secret',
      'token',
      'recovery_code',
      'key',
      'auth_tag',
      'iv',
      'otp',
    ];

    const clean: Record<string, any> = {};
    for (const [key, value] of Object.entries(metadata)) {
      if (forbiddenKeys.some((f) => key.toLowerCase().includes(f))) {
        clean[key] = '[REDACTED_SECURITY_DATA]';
      } else if (typeof value === 'object' && value !== null) {
        clean[key] = this.sanitizeMetadata(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  }
}
