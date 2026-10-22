import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.get('/', ActivityController.list);

export default router;
