import { Request, Response } from 'express';
import { SessionService } from '../services/session.service';
import { AuditLoggerService } from '../services/auditLogger.service';

export class SessionsController {
  public static async list(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const currentIdentifier = req.user!.sessionIdentifier;

    const sessions = await SessionService.listUserSessions(userId, currentIdentifier);

    res.status(200).json({
      success: true,
      data: {
        sessions,
      },
    });
  }

  public static async revoke(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const sessionId = req.params.id;

    const success = await SessionService.revokeSession(sessionId, userId);
    if (!success) {
      res.status(404).json({
        success: false,
        message: 'Session not found or already revoked.',
      });
      return;
    }

    await AuditLoggerService.log({
      userId,
      action: 'SESSION_REVOKED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { revokedSessionId: sessionId },
    });

    res.status(200).json({
      success: true,
      message: 'Session successfully revoked.',
    });
  }

  public static async revokeOthers(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const currentIdentifier = req.user!.sessionIdentifier;

    const revokedCount = await SessionService.revokeAllOtherSessions(userId, currentIdentifier);

    await AuditLoggerService.log({
      userId,
      action: 'ALL_OTHER_SESSIONS_REVOKED',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: { count: revokedCount },
    });

    res.status(200).json({
      success: true,
      message: `Revoked ${revokedCount} other active session(s).`,
      data: {
        revokedCount,
      },
    });
  }
}
