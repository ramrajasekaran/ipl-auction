import express from 'express';
import { register, login, logout, getMe, sendPasswordResetOTP, verifyOTPOnly, verifyOTPAndResetPassword, verifyEmail, resendVerification } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

// Email Verification Routes
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// OTP Password Reset Routes
router.post('/send-reset-otp', sendPasswordResetOTP);
router.post('/verify-otp', verifyOTPOnly);
router.post('/verify-reset-otp', verifyOTPAndResetPassword);

export default router;
