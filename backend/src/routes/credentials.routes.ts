import { Router } from 'express';
import { CredentialsController } from '../controllers/credentials.controller';
import { authGuard } from '../middleware/authGuard';
import { validateBody } from '../middleware/validate';
import { CreateCredentialSchema, UpdateCredentialSchema } from '../validators';

const router = Router();

// Protect all credential routes
router.use(authGuard);

router.get('/', CredentialsController.list);
router.post('/', validateBody(CreateCredentialSchema), CredentialsController.create);
router.get('/:id', CredentialsController.getOne); // Decrypts & reveals
router.put('/:id', validateBody(UpdateCredentialSchema), CredentialsController.update);
router.delete('/:id', CredentialsController.delete);

export default router;
