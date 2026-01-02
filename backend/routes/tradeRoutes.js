import express from 'express';
import { proposeTrade, getMyTrades, respondToTrade } from '../controllers/tradeController.js';

const router = express.Router();

router.post('/propose', proposeTrade);
router.post('/respond', respondToTrade);
router.get('/my/:teamId', getMyTrades);

export default router;
