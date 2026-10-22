import { Router } from 'express';
import { PasswordToolsController } from '../controllers/passwordTools.controller';
import { validateBody } from '../middleware/validate';
import { AnalyzePasswordSchema, GeneratePasswordSchema } from '../validators';

const router = Router();

router.post('/analyze', validateBody(AnalyzePasswordSchema), PasswordToolsController.analyze);
router.post('/generate', validateBody(GeneratePasswordSchema), PasswordToolsController.generate);

export default router;
