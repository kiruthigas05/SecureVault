import { Router } from 'express';
import authRoutes from './auth.routes';
import credentialsRoutes from './credentials.routes';
import passwordRoutes from './password.routes';
import mfaRoutes from './mfa.routes';
import securityRoutes from './security.routes';
import activityRoutes from './activity.routes';
import sessionsRoutes from './sessions.routes';
import shareRoutes from './share.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/credentials', credentialsRoutes);
router.use('/password', passwordRoutes);
router.use('/mfa', mfaRoutes);
router.use('/security', securityRoutes);
router.use('/activity', activityRoutes);
router.use('/sessions', sessionsRoutes);
router.use('/share', shareRoutes);

export default router;

