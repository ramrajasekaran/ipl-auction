import Auction from '../models/Auction.js';
import Player from '../models/Player.js';
import RoomPlayer from '../models/RoomPlayer.js';
import Team from '../models/Team.js';
import Bid from '../models/Bid.js';

// @desc    Create a new auction
// @route   POST /api/auction/create
// @access  Private (Auctioneer only)
export const createAuction = async (req, res) => {
    try {
        const { name, initialPurse, minBidIncrement, timerDuration } = req.body;

        const auction = await Auction.create({
            name,
            auctioneer: req.user.id,
            settings: {
                initialPurse: initialPurse || 100,
                minBidIncrement: minBidIncrement || 0.5,
                timerDuration: timerDuration || 60
            }
        });

        res.status(201).json({
            success: true,
            auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get auction details
// @route   GET /api/auction/:id
// @access  Private
export const getAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id)
            .populate('currentPlayer')
            .populate('currentBid.team')
            .populate('teams')
            .populate('players');

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        res.status(200).json({
            success: true,
            auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get latest auction
// @route   GET /api/auction/latest
// @access  Private
export const getLatestAuction = async (req, res) => {
    try {
        // Find the most recently created auction
        const auction = await Auction.findOne().sort({ createdAt: -1 })
            .populate('currentPlayer')
            .populate('currentBid.team')
            .populate('teams')
            .populate('players');

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'No active auction found'
            });
        }

        res.status(200).json({
            success: true,
            auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Select player for bidding
// @route   POST /api/auction/:id/select-player
// @access  Private (Auctioneer only)
export const selectPlayer = async (req, res) => {
    try {
        const { playerId } = req.body;

        const auction = await Auction.findById(req.params.id);
        const player = await RoomPlayer.findById(playerId);

        if (!auction || !player) {
            return res.status(404).json({
                success: false,
                message: 'Auction or player not found'
            });
        }

        // Check if player is available
        if (player.status !== 'AVAILABLE') {
            return res.status(400).json({
                success: false,
                message: 'Player is not available'
            });
        }

        // Reset auction state for new player
        auction.currentPlayer = playerId;
        auction.currentBid = {
            amount: player.basePrice,
            team: null,
            placedBy: null
        };
        auction.status = 'IDLE';
        await auction.resetTimer();

        await auction.save();

        const populatedAuction = await Auction.findById(auction._id)
            .populate('currentPlayer')
            .populate('teams');

        res.status(200).json({
            success: true,
            auction: populatedAuction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Start auction timer
// @route   POST /api/auction/:id/start-timer
// @access  Private (Auctioneer only)
export const startTimer = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        if (!auction.currentPlayer) {
            return res.status(400).json({
                success: false,
                message: 'No player selected'
            });
        }

        auction.status = 'ACTIVE';
        await auction.startTimer();

        res.status(200).json({
            success: true,
            auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Pause auction timer
// @route   POST /api/auction/:id/pause-timer
// @access  Private (Auctioneer only)
export const pauseTimer = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        auction.status = 'PAUSED';
        await auction.pauseTimer();

        res.status(200).json({
            success: true,
            auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Extend auction timer
// @route   POST /api/auction/:id/extend-timer
// @access  Private (Auctioneer only)
export const extendTimer = async (req, res) => {
    try {
        const { seconds } = req.body;
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        await auction.extendTimer(seconds || 10);

        res.status(200).json({
            success: true,
            auction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark player as SOLD
// @route   POST /api/auction/:id/mark-sold
// @access  Private (Auctioneer only)
export const markPlayerSold = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction || !auction.currentPlayer || !auction.currentBid.team) {
            return res.status(400).json({
                success: false,
                message: 'No valid bid to mark as sold'
            });
        }

        const player = await Player.findById(auction.currentPlayer);
        const team = await Team.findById(auction.currentBid.team);

        // Update player
        player.status = 'SOLD';
        player.soldTo = team._id;
        player.soldPrice = auction.currentBid.amount;
        await player.save();

        // Update team
        team.players.push({
            player: player._id,
            boughtPrice: auction.currentBid.amount
        });
        team.currentPurse -= auction.currentBid.amount;
        await team.save();

        // Reset auction state
        auction.currentPlayer = null;
        auction.currentBid = { amount: 0, team: null, placedBy: null };
        auction.status = 'IDLE';
        await auction.resetTimer();
        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Player marked as sold',
            player,
            team
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Mark player as UNSOLD
// @route   POST /api/auction/:id/mark-unsold
// @access  Private (Auctioneer only)
export const markPlayerUnsold = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction || !auction.currentPlayer) {
            return res.status(400).json({
                success: false,
                message: 'No player to mark as unsold'
            });
        }

        // Verify player in DB matches (using RoomPlayer)
        const player = await RoomPlayer.findById(auction.currentPlayer);
        // The original snippet had `if (player.basePrice > amount) {= 'UNSOLD';` which is syntactically incorrect and out of context.
        // Assuming the intent was to update the player status to UNSOLD using RoomPlayer.
        if (player) { // Ensure player exists before updating
            player.status = 'UNSOLD';
            await player.save();
        }


        // Reset auction state
        auction.currentPlayer = null;
        auction.currentBid = { amount: 0, team: null, placedBy: null };
        auction.status = 'IDLE';
        await auction.resetTimer();
        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Player marked as unsold',
            player
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Set team purse
// @route   POST /api/auction/:id/set-purse
// @access  Private (Auctioneer only)
export const setTeamPurse = async (req, res) => {
    try {
        const { teamId, purse } = req.body;

        const team = await Team.findById(teamId);

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        team.currentPurse = purse;
        team.initialPurse = purse;
        await team.save();

        res.status(200).json({
            success: true,
            team
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Reset auction
// @route   POST /api/auction/:id/reset
// @access  Private (Auctioneer only)
export const resetAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // 1. Reset all players related to this auction
        // Update Player Status (RoomPlayer)
        await RoomPlayer.updateMany( // Changed from Player.updateMany to RoomPlayer.updateMany
            { auctionId: auction._id },
            {
                status: 'AVAILABLE',
                soldTo: null,
                soldPrice: null
            }
        );

        // 2. Reset all teams related to this auction
        const teams = await Team.find({ auctionId: auction._id });
        for (let team of teams) {
            team.currentPurse = team.initialPurse;
            team.players = [];
            await team.save();
        }

        // 3. Reset auction state
        auction.currentPlayer = null;
        auction.currentBid = { amount: 0, team: null, placedBy: null };
        auction.status = 'IDLE';
        if (auction.resetTimer) await auction.resetTimer();
        else auction.timer = { isRunning: false, remaining: 0, startedAt: null };

        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Auction fully reset. Purses restored and players released.',
            auction
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all teams
// @route   GET /api/auction/:id/teams
// @access  Private
export const getTeams = async (req, res) => {
    try {
        const teams = await Team.find({ auctionId: req.params.id })
            .populate('owner', 'name email')
            .populate('players.player');

        res.status(200).json({
            success: true,
            teams
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
