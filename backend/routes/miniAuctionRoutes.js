import express from 'express';
import { continueGame, managerContinue, teamContinue, releasePlayer, getPlayerPool } from '../controllers/miniAuctionController.js';
import { createMiniTrade, respondToMiniTrade, sendTradeMessage, getMiniTrades } from '../controllers/tradeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All mini auction routes require authentication
router.use(protect);

// Mini Auction Management
router.post('/continue', continueGame); // Legacy unified endpoint (can keep or remove)
router.post('/manager-continue', managerContinue);
router.post('/team-continue', teamContinue);
router.post('/release-player', releasePlayer);
router.get('/:id/player-pool', getPlayerPool);

// Trading System
router.post('/trade/create', createMiniTrade);
router.post('/trade/:tradeId/respond', respondToMiniTrade);
router.post('/trade/:tradeId/message', sendTradeMessage);
router.get('/trades', getMiniTrades);

export default router;
