import { Router } from 'express';
import { SecurityController } from '../controllers/security.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.get('/score', SecurityController.getScore);
router.get('/recommendations', SecurityController.getRecommendations);

export default router;
