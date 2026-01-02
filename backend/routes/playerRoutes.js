import express from 'express';
import {
    getPlayers,
    getPlayer,
    createPlayer,
    updatePlayer,
    deletePlayer,
    bulkCreatePlayers,
    searchGlobalPlayers,
    activateGlobalPlayer
} from '../controllers/playerController.js';
import { protect, requireAuctioneer } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/global-search', protect, searchGlobalPlayers);
router.post('/activate', protect, requireAuctioneer, activateGlobalPlayer);
router.get('/', protect, getPlayers);
router.get('/:id', protect, getPlayer);
router.post('/', protect, requireAuctioneer, createPlayer);
router.post('/bulk', protect, requireAuctioneer, bulkCreatePlayers);
router.put('/:id', protect, requireAuctioneer, updatePlayer);
router.delete('/:id', protect, requireAuctioneer, deletePlayer);

export default router;
