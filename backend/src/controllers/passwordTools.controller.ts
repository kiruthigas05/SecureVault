import { Request, Response } from 'express';
import { PasswordAnalyzerService } from '../services/passwordAnalyzer.service';
import { PasswordGeneratorService } from '../services/passwordGenerator.service';

export class PasswordToolsController {
  public static analyze(req: Request, res: Response): void {
    const { password } = req.body;
    const result = PasswordAnalyzerService.analyze(password || '');

    res.status(200).json({
      success: true,
      data: result,
    });
  }

  public static generate(req: Request, res: Response): void {
    const { length, uppercase, lowercase, numbers, special } = req.body;
    const result = PasswordGeneratorService.generate({
      length: length ? parseInt(length, 10) : 16,
      uppercase,
      lowercase,
      numbers,
      special,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  }
}
