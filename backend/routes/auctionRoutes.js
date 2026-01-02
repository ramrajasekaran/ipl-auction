import express from 'express';
import {
    createAuction,
    getAuction,
    selectPlayer,
    startTimer,
    pauseTimer,
    extendTimer,
    markPlayerSold,
    markPlayerUnsold,
    setTeamPurse,
    resetAuction,
    getTeams,
    getLatestAuction
} from '../controllers/auctionController.js';
import { placeBid, getBidHistory, getAllBids } from '../controllers/bidController.js';
import { protect, requireAuctioneer, requireTeamOwner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Auction management routes (Auctioneer only)
router.post('/create', protect, requireAuctioneer, createAuction);
router.post('/:id/select-player', protect, requireAuctioneer, selectPlayer);
router.post('/:id/start-timer', protect, requireAuctioneer, startTimer);
router.post('/:id/pause-timer', protect, requireAuctioneer, pauseTimer);
router.post('/:id/extend-timer', protect, requireAuctioneer, extendTimer);
router.post('/:id/mark-sold', protect, requireAuctioneer, markPlayerSold);
router.post('/:id/mark-unsold', protect, requireAuctioneer, markPlayerUnsold);
router.post('/:id/set-purse', protect, requireAuctioneer, setTeamPurse);
router.post('/:id/reset', protect, requireAuctioneer, resetAuction);

// Bidding routes (Team Owners only)
router.post('/:id/bid', protect, requireTeamOwner, placeBid);

// General routes (All authenticated users)
router.get('/latest', protect, getLatestAuction);
router.get('/:id', protect, getAuction);
router.get('/:id/teams', protect, getTeams);
router.get('/:id/bids', protect, getAllBids);
router.get('/:id/bids/:playerId', protect, getBidHistory);

export default router;
