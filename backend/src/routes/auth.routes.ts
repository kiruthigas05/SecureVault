import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateBody } from '../middleware/validate';
import { authGuard } from '../middleware/authGuard';
import { authLimiter } from '../middleware/rateLimiter';
import {
  RegisterSchema,
  LoginSchema,
  MfaLoginSchema,
  ForgotPasswordSchema,
  VerifyResetTokenSchema,
  ResetPasswordSchema,
} from '../validators';

const router = Router();

router.post('/register', authLimiter, validateBody(RegisterSchema), AuthController.register);
router.post('/login', authLimiter, validateBody(LoginSchema), AuthController.login);
router.post('/mfa-login', authLimiter, validateBody(MfaLoginSchema), AuthController.mfaLogin);
router.post('/logout', authGuard, AuthController.logout);
router.get('/me', authGuard, AuthController.me);

router.post(
  '/forgot-password',
  authLimiter,
  validateBody(ForgotPasswordSchema),
  AuthController.forgotPassword
);
router.post(
  '/verify-reset',
  validateBody(VerifyResetTokenSchema),
  AuthController.verifyResetToken
);
router.post(
  '/reset-password',
  authLimiter,
  validateBody(ResetPasswordSchema),
  AuthController.resetPassword
);

export default router;
