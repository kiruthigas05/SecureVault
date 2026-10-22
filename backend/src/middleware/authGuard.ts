import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { SessionService } from '../services/session.service';

export interface AuthenticatedUser {
  id: string;
  sessionIdentifier: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authGuard = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.securevault_token) {
      token = req.cookies.securevault_token;
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Authentication required. No session token provided.',
      });
      return;
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, ENV.JWT_SECRET);
    } catch (jwtErr) {
      res.status(401).json({
        success: false,
        message: 'Your session has expired or is invalid. Please log in again.',
      });
      return;
    }

    const { userId, sessionIdentifier } = decoded;
    if (!userId || !sessionIdentifier) {
      res.status(401).json({
        success: false,
        message: 'Malformed session credentials.',
      });
      return;
    }

    // Validate active session in Redis/DB
    const { valid } = await SessionService.validateSession(sessionIdentifier);
    if (!valid) {
      res.status(401).json({
        success: false,
        message: 'This session has been revoked or has expired. Please log in again.',
      });
      return;
    }

    req.user = {
      id: userId,
      sessionIdentifier,
    };

    next();
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Authentication verification failure.',
    });
  }
};
