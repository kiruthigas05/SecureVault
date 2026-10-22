import { Router } from 'express';
import { SessionsController } from '../controllers/sessions.controller';
import { authGuard } from '../middleware/authGuard';

const router = Router();

router.use(authGuard);

router.get('/', SessionsController.list);
router.delete('/:id', SessionsController.revoke);
router.post('/revoke-others', SessionsController.revokeOthers);

export default router;
