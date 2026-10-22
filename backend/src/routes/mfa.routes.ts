import { Router } from 'express';
import { MfaController } from '../controllers/mfa.controller';
import { authGuard } from '../middleware/authGuard';
import { validateBody } from '../middleware/validate';
import { VerifyMfaSetupSchema, DisableMfaSchema } from '../validators';

const router = Router();

router.use(authGuard);

router.get('/status', MfaController.getStatus);
router.post('/setup', MfaController.setup);
router.post('/verify', validateBody(VerifyMfaSetupSchema), MfaController.verifyAndEnable);
router.post('/disable', validateBody(DisableMfaSchema), MfaController.disable);

export default router;
