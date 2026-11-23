import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPassword,
  googleAuth,
  handleResetPassword,
  login,
  register,
} from '../controllers/authController.js';
import { normalizeEmail } from '../services/authService.js';

export { MIN_PASSWORD_LENGTH } from '../services/authService.js';

const router = Router();

const forgotPasswordIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Muitas solicitações de recuperação de senha. Tente novamente em alguns minutos.',
  },
});

const forgotPasswordEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => normalizeEmail(req.body?.email) || 'missing-email',
  validate: { keyGeneratorIpFallback: false },
  message: { error: 'Muitas solicitações para este e-mail. Tente novamente mais tarde.' },
});

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/google', googleAuth);
router.post(
  '/auth/forgot-password',
  forgotPasswordIpLimiter,
  forgotPasswordEmailLimiter,
  forgotPassword
);
router.post('/auth/reset-password', handleResetPassword);

export default router;