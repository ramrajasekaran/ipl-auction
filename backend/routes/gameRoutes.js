import express from 'express';
import { createGame, joinGame, resumeGame, rejoinTeam, addDefaultPlayers, uploadPlayers, uploadGlobalPlayers, getGlobalPlayers, clearGlobalPlayers, seedGlobalPlayers, releasePlayer, resetManagerPassword, resetTeamPassword, getTeamDetails } from '../controllers/gameController.js';
import multer from 'multer';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

// All game routes require protection
router.use(protect);

router.post('/create', createGame);
router.post('/join', joinGame);
router.post('/resume', resumeGame);
router.post('/rejoin', rejoinTeam);
router.post('/players/default', addDefaultPlayers);
router.post('/players/upload', upload.single('file'), uploadPlayers); // Missing Route Added
router.post('/players/admin/upload', upload.single('file'), requireAdmin, uploadGlobalPlayers); // NEW ADMIN ROUTE
router.post('/players/admin/seed', requireAdmin, seedGlobalPlayers); // NEW SEED ROUTE
router.get('/players/admin/global', requireAdmin, getGlobalPlayers); // NEW VIEW ROUTE
router.delete('/players/admin/global', requireAdmin, clearGlobalPlayers); // NEW DELETE ROUTE
router.post('/players/release', releasePlayer);
router.get('/team/:teamId', getTeamDetails); // Validate team and get squad

// Password Reset Routes
router.post('/reset-manager-password', resetManagerPassword);
router.post('/reset-team-password', resetTeamPassword);

export default router;
