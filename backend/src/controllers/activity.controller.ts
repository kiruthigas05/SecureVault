import { Request, Response } from 'express';
import { AuditLog } from '../models';

export class ActivityController {
  public static async list(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const limit = Math.min(50, parseInt(req.query.limit as string, 10) || 20);
    const offset = Math.max(0, parseInt(req.query.offset as string, 10) || 0);

    const logs = await AuditLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(limit);

    const total = await AuditLog.countDocuments({ userId });

    res.status(200).json({
      success: true,
      data: {
        logs: logs.map((row) => ({
          id: row.id,
          action: row.action,
          ipAddress: row.ipAddress,
          userAgent: row.userAgent,
          metadata: row.metadata,
          createdAt: row.createdAt,
        })),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      },
    });
  }
}
