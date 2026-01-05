import MiniAuction from '../models/MiniAuction.js';
import Auction from '../models/Auction.js';
import Team from '../models/Team.js';
import RoomPlayer from '../models/RoomPlayer.js';
import PlayerRelease from '../models/PlayerRelease.js';
import Trade from '../models/Trade.js';

// Continue Game - Validate and create/join mini auction
export const continueGame = async (req, res) => {
    try {
        const { roomId, teamName, password, budget } = req.body;
        const normalizedRoomId = roomId ? roomId.toUpperCase() : '';

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Find the mega auction
        const megaAuction = await Auction.findOne({ roomId: normalizedRoomId });

        if (!megaAuction) {
            return res.status(404).json({ success: false, message: 'Mega auction room not found' });
        }

        // Check if mega auction is completed
        if (megaAuction.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Mega auction must be completed before starting mini auction'
            });
        }

        // Find the team
        const team = await Team.findOne({
            auctionId: megaAuction._id,
            name: teamName
        }).populate('players.player');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found in this auction' });
        }

        // Verify password
        const isMatch = await team.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect password' });
        }

        // Check player count (15-25 players)
        const playerCount = team.players.length;
        if (playerCount < 15 || playerCount > 25) {
            return res.status(400).json({
                success: false,
                message: `Team must have 15-25 players. Current count: ${playerCount}`,
                playerCount
            });
        }

        // Validate budget if provided (max 25 Cr)
        const miniBudget = budget ? Math.min(Math.max(budget, 1), 25) : 25;

        // Find or create mini auction
        let miniAuction = await MiniAuction.findOne({
            megaAuctionId: megaAuction._id
        });

        if (!miniAuction) {
            // Create new mini auction (only manager/auctioneer can set budget)
            const isAuctioneer = megaAuction.auctioneer.toString() === req.user._id.toString();

            miniAuction = new MiniAuction({
                megaAuctionId: megaAuction._id,
                roomId: normalizedRoomId,
                status: 'PLAYER_RELEASE',
                teams: [team._id],
                budget: isAuctioneer ? miniBudget : 25 // Only auctioneer can set custom budget
            });
            await miniAuction.save();
        } else {
            // Add team if not already in mini auction
            if (!miniAuction.teams.includes(team._id)) {
                miniAuction.teams.push(team._id);
                await miniAuction.save();
            }
        }

        // Set mini auction budget for team
        team.miniAuctionBudget = miniAuction.budget;
        await team.save();

        res.status(200).json({
            success: true,
            miniAuctionId: miniAuction._id,
            teamId: team._id,
            playerCount,
            eligible: true,
            megaAuctionCompleted: true,
            status: miniAuction.status,
            budget: miniAuction.budget
        });

    } catch (error) {
        console.error('Continue Game Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Release Player
export const releasePlayer = async (req, res) => {
    try {
        const { miniAuctionId, teamId, playerId } = req.body;

        const miniAuction = await MiniAuction.findById(miniAuctionId);
        if (!miniAuction) {
            return res.status(404).json({ success: false, message: 'Mini auction not found' });
        }

        const team = await Team.findById(teamId).populate('players.player');
        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Find player in team
        const playerIndex = team.players.findIndex(p => p.player._id.toString() === playerId);
        if (playerIndex === -1) {
            return res.status(404).json({ success: false, message: 'Player not in team' });
        }

        const playerData = team.players[playerIndex];
        const originalBidAmount = playerData.boughtPrice;

        // Remove player from team and credit purse
        team.players.splice(playerIndex, 1);
        team.currentPurse = (team.currentPurse || 0) + originalBidAmount;
        await team.save();

        // Add to player pool
        if (!miniAuction.playerPool.includes(playerId)) {
            miniAuction.playerPool.push(playerId);
            await miniAuction.save();
        }

        // Record release
        const release = new PlayerRelease({
            miniAuctionId,
            teamId,
            playerId,
            originalBidAmount
        });
        await release.save();

        // Update player status
        await RoomPlayer.findByIdAndUpdate(playerId, { status: 'RELEASED' });

        // Add to Mini Auction player pool
        await MiniAuction.findByIdAndUpdate(miniAuctionId, {
            $addToSet: { playerPool: playerId }
        });

        // Trigger socket toast
        const io = req.app.get('io');
        if (io) {
            io.to(`auction:${miniAuction.roomId}`).emit('auction:toast', {
                message: `${playerData.player.name.toUpperCase()} released by ${team.name}`
            });
            io.to(`auction:${miniAuction.roomId}`).emit('auction:refresh-request');
        }

        res.status(200).json({
            success: true,
            releasedPlayer: playerData.player,
            remainingPlayers: team.players.length,
            updatedBudget: team.miniAuctionBudget
        });

    } catch (error) {
        console.error('Release Player Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Player Pool
export const getPlayerPool = async (req, res) => {
    try {
        const { id } = req.params;

        const miniAuction = await MiniAuction.findById(id)
            .populate('playerPool')
            .populate('megaAuctionId');

        if (!miniAuction) {
            return res.status(404).json({ success: false, message: 'Mini auction not found' });
        }

        // Get unsold players from mega auction
        const megaAuction = miniAuction.megaAuctionId;
        const unsoldPlayers = await RoomPlayer.find({
            auctionId: megaAuction._id,
            status: 'UNSOLD'
        });

        // Get released players
        const releases = await PlayerRelease.find({ miniAuctionId: id })
            .populate('playerId')
            .populate('teamId', 'name');

        const releasedPlayers = releases.map(r => ({
            ...r.playerId.toObject(),
            releasedBy: r.teamId.name,
            source: 'released'
        }));

        // Combine player pools
        const playerPool = [
            ...unsoldPlayers.map(p => ({ ...p.toObject(), source: 'unsold' })),
            ...releasedPlayers
        ];

        res.status(200).json({
            success: true,
            players: playerPool
        });

    } catch (error) {
        console.error('Get Player Pool Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
// Manager Continue - Start mini auction as manager
export const managerContinue = async (req, res) => {
    try {
        const { roomId, password, budget } = req.body;
        console.log('[MiniAuction] Manager Login Request Body:', JSON.stringify(req.body, null, 2));

        const normalizedRoomId = roomId ? roomId.trim().toUpperCase() : '';
        console.log(`[MiniAuction] Normalized Room ID: "${normalizedRoomId}"`);

        if (!req.user) {
            console.log('[MiniAuction] No user in request');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Find the mega auction
        const megaAuction = await Auction.findOne({ roomId: normalizedRoomId });

        if (!megaAuction) {
            // DEBUG: List all available IDs to see what's going on
            const allAuctions = await Auction.find({}, 'roomId');
            const availableIds = allAuctions.map(a => `"${a.roomId}"`).join(', ');
            console.log(`[MiniAuction] Room "${normalizedRoomId}" NOT FOUND. Available IDs in DB: [${availableIds}]`);

            return res.status(404).json({
                success: false,
                message: `Mega auction room "${normalizedRoomId}" not found. Available: ${availableIds}`
            });
        }

        // Verify user is the auctioneer (manager)
        if (megaAuction.auctioneer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Only the manager who created this room can continue as manager'
            });
        }

        // Verify room password
        const isMatch = await megaAuction.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect room password' });
        }

        // Check if mega auction is completed - Auto-complete if manager is logging in
        if (megaAuction.status !== 'COMPLETED') {
            console.log(`[MiniAuction] Manager force-completing auction ${normalizedRoomId}`);
            megaAuction.status = 'COMPLETED';
            megaAuction.completedAt = new Date();
            await megaAuction.save();
        }

        // Validate budget (max 25 Cr)
        const miniBudget = budget ? Math.min(Math.max(budget, 1), 25) : 25;

        // Find or create mini auction
        let miniAuction = await MiniAuction.findOne({
            megaAuctionId: megaAuction._id
        });

        // Find UNSOLD and AVAILABLE players from Mega Auction to populate pool
        const unsoldPlayers = await RoomPlayer.find({
            auctionId: megaAuction._id,
            status: { $in: ['UNSOLD', 'AVAILABLE'] }
        });
        const unsoldIds = unsoldPlayers.map(p => p._id);

        if (!miniAuction) {
            // Create new mini auction
            miniAuction = new MiniAuction({
                megaAuctionId: megaAuction._id,
                roomId: normalizedRoomId,
                status: 'PLAYER_RELEASE',
                teams: [],
                budget: miniBudget,
                playerPool: unsoldIds // Initialize with Unsold players
            });
            await miniAuction.save();
        } else {
            // Update budget if manager is reconfiguring
            miniAuction.budget = miniBudget;

            // Repair/Sync: Ensure all unsold players are in the pool
            const existingPoolStrs = miniAuction.playerPool.map(id => id.toString());
            const newUnsoldIds = unsoldIds.filter(id => !existingPoolStrs.includes(id.toString()));

            if (newUnsoldIds.length > 0) {
                console.log(`[MiniAuction] Adding ${newUnsoldIds.length} missing unsold players to pool`);
                miniAuction.playerPool.push(...newUnsoldIds);
            }
            await miniAuction.save();
        }

        // Update all teams with the new budget
        await Team.updateMany(
            { auctionId: megaAuction._id },
            { miniAuctionBudget: miniBudget, currentPurse: miniBudget }
        );

        res.status(200).json({
            success: true,
            miniAuctionId: miniAuction._id,
            roomId: normalizedRoomId,
            status: miniAuction.status,
            budget: miniAuction.budget,
            isManager: true
        });

    } catch (error) {
        console.error('Manager Continue Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Team Continue - Join mini auction as team owner
export const teamContinue = async (req, res) => {
    try {
        const { roomId, teamName, password } = req.body;
        const normalizedRoomId = roomId ? roomId.toUpperCase().trim() : '';
        console.log(`[MiniAuction] Team Login Attempt: Room=${normalizedRoomId}, Team=${teamName}`);

        if (!req.user) {
            console.log('[MiniAuction] Team Login: No user found in request');
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // Find the mega auction
        const megaAuction = await Auction.findOne({ roomId: normalizedRoomId });
        console.log(`[MiniAuction] Team Login: Mega Auction found? ${!!megaAuction}`);

        if (!megaAuction) {
            return res.status(404).json({ success: false, message: 'Mega auction room not found' });
        }

        // Check if mega auction is completed
        if (megaAuction.status !== 'COMPLETED') {
            return res.status(400).json({
                success: false,
                message: 'Mega auction must be completed before starting mini auction'
            });
        }

        // Find the team
        const team = await Team.findOne({
            auctionId: megaAuction._id,
            name: { $regex: new RegExp(`^${teamName}$`, 'i') }
        }).populate('players.player');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found in this auction' });
        }

        // Verify team password
        const isMatch = await team.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect team password' });
        }

        // Check player count (15-25 players)
        const playerCount = team.players.length;
        if (playerCount < 15 || playerCount > 25) {
            return res.status(400).json({
                success: false,
                message: `Team must have 15-25 players. Current count: ${playerCount}`,
                playerCount
            });
        }

        // Find mini auction (manager must have created it first)
        let miniAuction = await MiniAuction.findOne({
            megaAuctionId: megaAuction._id
        });

        if (!miniAuction) {
            return res.status(400).json({
                success: false,
                message: 'Mini auction has not been started by the manager yet. Please wait for the manager to start the mini auction.'
            });
        }

        // Add team to mini auction if not already
        if (!miniAuction.teams.some(t => t.toString() === team._id.toString())) {
            miniAuction.teams.push(team._id);
            await miniAuction.save();
        }

        // Set mini auction budget for team AND reset current purse for bidding
        team.miniAuctionBudget = miniAuction.budget;
        team.currentPurse = miniAuction.budget;
        await team.save();

        res.status(200).json({
            success: true,
            miniAuctionId: miniAuction._id,
            teamId: team._id,
            teamName: team.name,
            playerCount,
            status: miniAuction.status,
            budget: miniAuction.budget,
            isManager: false
        });

    } catch (error) {
        console.error('Team Continue Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

export default {
    continueGame,
    managerContinue,
    teamContinue,
    releasePlayer,
    getPlayerPool
};
