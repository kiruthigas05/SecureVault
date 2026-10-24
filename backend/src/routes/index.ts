import { Router, Request, Response, NextFunction } from 'express';
import { isDbConnected } from '../config/db';
import authRoutes from './auth.routes';
import credentialsRoutes from './credentials.routes';
import passwordRoutes from './password.routes';
import mfaRoutes from './mfa.routes';
import securityRoutes from './security.routes';
import activityRoutes from './activity.routes';
import sessionsRoutes from './sessions.routes';
import shareRoutes from './share.routes';

const router = Router();

// Password tools (generation and entropy analysis) work without database
router.use('/password', passwordRoutes);

// Guard all database-dependent API endpoints with a friendly status check
router.use((req: Request, res: Response, next: NextFunction) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently connecting or unreachable. Please verify MONGODB_URI in your Render Dashboard (Environment tab) and ensure IP 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access.',
    });
  }
  next();
});

router.use('/auth', authRoutes);
router.use('/credentials', credentialsRoutes);
router.use('/mfa', mfaRoutes);
router.use('/security', securityRoutes);
router.use('/activity', activityRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/share', shareRoutes);

export default router;

