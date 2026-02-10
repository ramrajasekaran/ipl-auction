import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected routes to ensure only logged-in users can pay (optional, but good practice)
router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

export default router;
