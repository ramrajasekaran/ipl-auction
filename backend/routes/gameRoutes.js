import express from 'express';
import { createGame, joinGame, resumeGame, rejoinTeam, addDefaultPlayers, uploadPlayers, uploadGlobalPlayers, getGlobalPlayers, clearGlobalPlayers, releasePlayer, resetManagerPassword, resetTeamPassword } from '../controllers/gameController.js';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';

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
router.post('/players/admin/upload', upload.single('file'), uploadGlobalPlayers); // NEW ADMIN ROUTE
router.get('/players/admin/global', getGlobalPlayers); // NEW VIEW ROUTE
router.delete('/players/admin/global', clearGlobalPlayers); // NEW DELETE ROUTE
router.post('/players/release', releasePlayer);

// Password Reset Routes
router.post('/reset-manager-password', resetManagerPassword);
router.post('/reset-team-password', resetTeamPassword);

export default router;
