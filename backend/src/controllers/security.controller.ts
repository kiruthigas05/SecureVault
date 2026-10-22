import { Request, Response } from 'express';
import { SecurityScoreService } from '../services/securityScore.service';

export class SecurityController {
  public static async getScore(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const report = await SecurityScoreService.calculateUserScore(userId);

    res.status(200).json({
      success: true,
      data: report,
    });
  }

  public static async getRecommendations(req: Request, res: Response): Promise<void> {
    const userId = req.user!.id;
    const report = await SecurityScoreService.calculateUserScore(userId);

    res.status(200).json({
      success: true,
      data: {
        recommendations: report.recommendations,
        reusedGroups: report.reusedGroups,
      },
    });
  }
}
