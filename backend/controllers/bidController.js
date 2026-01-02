import Bid from '../models/Bid.js';
import Auction from '../models/Auction.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

// @desc    Place a bid
// @route   POST /api/auction/:id/bid
// @access  Private (Team Owners only)
export const placeBid = async (req, res) => {
    try {
        const { amount } = req.body;
        const auctionId = req.params.id;

        // Get auction
        const auction = await Auction.findById(auctionId);

        if (!auction) {
            return res.status(404).json({
                success: false,
                message: 'Auction not found'
            });
        }

        // Check if auction is active
        if (auction.status !== 'ACTIVE') {
            return res.status(400).json({
                success: false,
                message: 'Auction is not active'
            });
        }

        // Check if there's a current player
        if (!auction.currentPlayer) {
            return res.status(400).json({
                success: false,
                message: 'No player is currently up for bidding'
            });
        }

        // Get team
        const team = await Team.findOne({ owner: req.user.id });

        if (!team) {
            return res.status(404).json({
                success: false,
                message: 'Team not found'
            });
        }

        // Validate bid amount
        const currentBid = auction.currentBid.amount;
        const minBidIncrement = auction.settings.minBidIncrement;

        if (amount <= currentBid) {
            return res.status(400).json({
                success: false,
                message: `Bid must be higher than current bid of ₹${currentBid} CR`
            });
        }

        if (amount - currentBid < minBidIncrement) {
            return res.status(400).json({
                success: false,
                message: `Bid increment must be at least ₹${minBidIncrement} CR`
            });
        }

        // Check if team has enough purse
        if (amount > team.currentPurse) {
            return res.status(400).json({
                success: false,
                message: `Insufficient purse balance. You have ₹${team.currentPurse} CR`
            });
        }

        // Update auction current bid
        auction.currentBid = {
            amount,
            team: team._id,
            placedBy: req.user.id
        };

        // Reset timer when bid is placed
        await auction.extendTimer(0); // This resets the startedAt time

        await auction.save();

        // Record bid in history
        await Bid.create({
            auction: auctionId,
            player: auction.currentPlayer,
            team: team._id,
            bidder: req.user.id,
            amount
        });

        const populatedAuction = await Auction.findById(auctionId)
            .populate('currentPlayer')
            .populate('currentBid.team')
            .populate('currentBid.placedBy', 'name');

        res.status(200).json({
            success: true,
            auction: populatedAuction,
            bid: {
                amount,
                team: team.name,
                teamId: team._id
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get bid history for a player
// @route   GET /api/auction/:id/bids/:playerId
// @access  Private
export const getBidHistory = async (req, res) => {
    try {
        const { playerId } = req.params;

        const bids = await Bid.find({
            auction: req.params.id,
            player: playerId
        })
            .populate('team', 'name')
            .populate('bidder', 'name')
            .sort({ timestamp: -1 });

        res.status(200).json({
            success: true,
            bids
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get all bids for current auction
// @route   GET /api/auction/:id/bids
// @access  Private
export const getAllBids = async (req, res) => {
    try {
        const bids = await Bid.find({ auction: req.params.id })
            .populate('player', 'name')
            .populate('team', 'name')
            .populate('bidder', 'name')
            .sort({ timestamp: -1 })
            .limit(50);

        res.status(200).json({
            success: true,
            bids
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};
