import { Router } from 'express';
import {
  signup,
  signin,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
} from '../controllers/auth.controller';

const router = Router();

router.post('/signup', signup);
router.post('/signin', signin);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

export default router;
