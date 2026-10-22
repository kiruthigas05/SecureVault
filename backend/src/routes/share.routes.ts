import { Router, Request, Response, NextFunction } from 'express';
import { ShareController } from '../controllers/share.controller';
import { validateBody } from '../middleware/validate';
import { CreateShareSchema, RevealShareSchema } from '../validators';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

const router = Router();

// Optional authentication middleware: attaches user if valid token exists
const optionalAuth = (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.securevault_token) {
      token = req.cookies.securevault_token;
    }

    if (token) {
      const decoded = jwt.verify(token, ENV.JWT_SECRET) as any;
      if (decoded && decoded.id) {
        req.user = {
          id: decoded.id,
          sessionIdentifier: decoded.sessionIdentifier || '',
        };
      }
    }
  } catch {
    // If token invalid, proceed anonymously
  }
  next();
};

// 1. Create a one-time ephemeral secret
router.post('/', optionalAuth, validateBody(CreateShareSchema), ShareController.create);

// 2. Check metadata of a secret link (public)
router.get('/:id/meta', ShareController.getMeta);

// 3. Reveal and burn secret (public, 1-time execution)
router.post('/:id/reveal', validateBody(RevealShareSchema), ShareController.reveal);

export default router;
