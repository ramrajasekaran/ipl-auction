import Trade from '../models/Trade.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';
import MiniAuction from '../models/MiniAuction.js';
import RoomPlayer from '../models/RoomPlayer.js';

// Propose a Trade
export const proposeTrade = async (req, res) => {
    try {
        const { roomId, initiatorTeamId, targetTeamId, playerInId, playerOutId, message } = req.body;

        // Validation: Check if teams own the players
        const p1 = await Player.findById(playerInId);
        const p2 = await Player.findById(playerOutId);

        if (p1.soldTo.toString() !== initiatorTeamId) return res.status(400).json({ success: false, message: 'You do not own the player you are offering' });
        if (p2.soldTo.toString() !== targetTeamId) return res.status(400).json({ success: false, message: 'Target team does not own the requested player' });

        const trade = await Trade.create({
            roomId,
            initiatorTeam: initiatorTeamId,
            targetTeam: targetTeamId,
            playerIn: playerInId,
            playerOut: playerOutId,
            message,
            status: 'PENDING'
        });

        res.status(201).json({ success: false, trade });

    } catch (error) {
        console.error('Propose Trade Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Trades for a Team
export const getMyTrades = async (req, res) => {
    try {
        const { teamId } = req.params;
        const trades = await Trade.find({
            $or: [{ initiatorTeam: teamId }, { targetTeam: teamId }],
            status: 'PENDING'
        })
            .populate('initiatorTeam', 'name')
            .populate('targetTeam', 'name')
            .populate('playerIn', 'name role soldPrice')
            .populate('playerOut', 'name role soldPrice');

        res.status(200).json({ success: true, trades });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Respond to Trade
export const respondToTrade = async (req, res) => {
    try {
        const { tradeId, status } = req.body; // 'ACCEPTED' or 'REJECTED'

        const trade = await Trade.findById(tradeId);
        if (!trade) return res.status(404).json({ success: false, message: 'Trade not found' });
        if (trade.status !== 'PENDING') return res.status(400).json({ success: false, message: 'Trade already processed' });

        if (status === 'REJECTED') {
            trade.status = 'REJECTED';
            await trade.save();
            return res.status(200).json({ success: true, message: 'Trade Rejected', trade });
        }

        if (status === 'ACCEPTED') {
            // EXECUTE SWAP
            const t1 = await Team.findById(trade.initiatorTeam).populate('players.player');
            const t2 = await Team.findById(trade.targetTeam).populate('players.player');
            const p1 = await Player.findById(trade.playerIn); // Owned by T1
            const p2 = await Player.findById(trade.playerOut); // Owned by T2

            if (!t1 || !t2 || !p1 || !p2) return res.status(404).json({ success: false, message: 'Entities not found' });

            // Verify ownership again to be safe
            if (p1.soldTo?.toString() !== t1._id.toString() || p2.soldTo?.toString() !== t2._id.toString()) {
                trade.status = 'CANCELLED';
                await trade.save();
                return res.status(400).json({ success: false, message: 'Ownership changed, trade cancelled' });
            }

            // 1. Swap Owners in Player model
            const p1PrevPrice = p1.soldPrice;
            const p2PrevPrice = p2.soldPrice;

            p1.soldTo = t2._id;
            p2.soldTo = t1._id;
            await p1.save();
            await p2.save();

            // 2. Swap in Team players arrays
            // Remove P1 from T1 and give to T2
            const p1Entry = t1.players.find(entry => entry.player._id.toString() === p1._id.toString());
            t1.players = t1.players.filter(entry => entry.player._id.toString() !== p1._id.toString());

            // Remove P2 from T2 and give to T1
            const p2Entry = t2.players.find(entry => entry.player._id.toString() === p2._id.toString());
            t2.players = t2.players.filter(entry => entry.player._id.toString() !== p2._id.toString());

            // Cross-add
            if (p1Entry) t2.players.push({ player: p1._id, boughtPrice: p1Entry.boughtPrice });
            else t2.players.push({ player: p1._id, boughtPrice: p1.soldPrice });

            if (p2Entry) t1.players.push({ player: p2._id, boughtPrice: p2Entry.boughtPrice });
            else t1.players.push({ player: p2._id, boughtPrice: p2.soldPrice });

            await t1.save();
            await t2.save();

            trade.status = 'ACCEPTED';
            await trade.save();

            // Trigger socket refresh for all in room
            const io = req.app.get('io');
            if (io) {
                io.to(`auction:${trade.roomId}`).emit('auction:toast', {
                    message: `TRADE EXECUTED! ${p1.name} and ${p2.name} have swapped teams.`
                });
                // Force state refresh
                io.to(`auction:${trade.roomId}`).emit('auction:refresh-request');
            }

            return res.status(200).json({ success: true, message: 'Trade Executed Successfully', trade });
        }

    } catch (error) {
        console.error('Respond Trade Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// ============ MINI AUCTION TRADE FUNCTIONS ============

// Create Mini Auction Trade Offer
export const createMiniTrade = async (req, res) => {
    try {
        const { miniAuctionId, offeringTeamId, receivingTeamId, offeredPlayerId, wantedPlayerId } = req.body;

        const miniAuction = await MiniAuction.findById(miniAuctionId);
        if (!miniAuction) {
            return res.status(404).json({ success: false, message: 'Mini auction not found' });
        }

        const offeringTeam = await Team.findById(offeringTeamId).populate('players.player');
        const receivingTeam = await Team.findById(receivingTeamId).populate('players.player');

        if (!offeringTeam || !receivingTeam) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Find offered player in offering team
        const offeredPlayerData = offeringTeam.players.find(
            p => p.player._id.toString() === offeredPlayerId
        );
        if (!offeredPlayerData) {
            return res.status(400).json({ success: false, message: 'Offered player not in your team' });
        }

        // Find wanted player in receiving team
        const wantedPlayerData = receivingTeam.players.find(
            p => p.player._id.toString() === wantedPlayerId
        );
        if (!wantedPlayerData) {
            return res.status(400).json({ success: false, message: 'Wanted player not in target team' });
        }

        // Create trade
        const trade = new Trade({
            miniAuctionId,
            roomId: miniAuction.roomId,
            offeringTeam: offeringTeamId,
            receivingTeam: receivingTeamId,
            offeredPlayer: {
                playerId: offeredPlayerId,
                originalBidAmount: offeredPlayerData.boughtPrice
            },
            wantedPlayer: {
                playerId: wantedPlayerId,
                originalBidAmount: wantedPlayerData.boughtPrice
            },
            status: 'PENDING'
        });

        await trade.save();

        res.status(201).json({
            success: true,
            trade: await trade.populate([
                { path: 'offeredPlayer.playerId' },
                { path: 'wantedPlayer.playerId' },
                { path: 'offeringTeam', select: 'name' },
                { path: 'receivingTeam', select: 'name' }
            ])
        });

    } catch (error) {
        console.error('Create Mini Trade Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Respond to Mini Auction Trade
export const respondToMiniTrade = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { action, teamId } = req.body; // action: 'ACCEPT' or 'REJECT'

        const trade = await Trade.findById(tradeId)
            .populate('offeredPlayer.playerId')
            .populate('wantedPlayer.playerId')
            .populate('offeringTeam')
            .populate('receivingTeam');

        if (!trade) {
            return res.status(404).json({ success: false, message: 'Trade not found' });
        }

        // Verify the responding team is the receiving team
        if (trade.receivingTeam._id.toString() !== teamId) {
            return res.status(403).json({ success: false, message: 'Only receiving team can respond' });
        }

        if (trade.status !== 'PENDING') {
            return res.status(400).json({ success: false, message: 'Trade already processed' });
        }

        if (action === 'ACCEPT') {
            // Perform player swap
            const offeringTeam = await Team.findById(trade.offeringTeam._id);
            const receivingTeam = await Team.findById(trade.receivingTeam._id);

            // Remove players from original teams
            offeringTeam.players = offeringTeam.players.filter(
                p => p.player.toString() !== trade.offeredPlayer.playerId._id.toString()
            );
            receivingTeam.players = receivingTeam.players.filter(
                p => p.player.toString() !== trade.wantedPlayer.playerId._id.toString()
            );

            // Add players to new teams (with original bid amounts)
            offeringTeam.players.push({
                player: trade.wantedPlayer.playerId._id,
                boughtPrice: trade.wantedPlayer.originalBidAmount
            });
            receivingTeam.players.push({
                player: trade.offeredPlayer.playerId._id,
                boughtPrice: trade.offeredPlayer.originalBidAmount
            });

            // Save teams
            await offeringTeam.save();
            await receivingTeam.save();

            trade.status = 'ACCEPTED';
            trade.respondedAt = new Date();
            await trade.save();

            // Trigger socket refresh for all in room
            const io = req.app.get('io');
            if (io) {
                io.to(`auction:${trade.roomId}`).emit('auction:toast', {
                    message: `TRADE EXECUTED! Players swapped between ${offeringTeam.name} and ${receivingTeam.name}.`
                });
                // Force state refresh
                io.to(`auction:${trade.roomId}`).emit('auction:refresh-request');
            }

            res.status(200).json({
                success: true,
                message: 'Trade accepted and players swapped',
                trade
            });

        } else if (action === 'REJECT') {
            trade.status = 'REJECTED';
            trade.respondedAt = new Date();
            await trade.save();

            res.status(200).json({
                success: true,
                message: 'Trade rejected',
                trade
            });
        } else {
            return res.status(400).json({ success: false, message: 'Invalid action' });
        }

    } catch (error) {
        console.error('Respond to Mini Trade Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Send Trade Chat Message
export const sendTradeMessage = async (req, res) => {
    try {
        const { tradeId } = req.params;
        const { teamId, message } = req.body;

        const trade = await Trade.findById(tradeId);
        if (!trade) {
            return res.status(404).json({ success: false, message: 'Trade not found' });
        }

        // Verify team is part of this trade
        if (trade.offeringTeam.toString() !== teamId && trade.receivingTeam.toString() !== teamId) {
            return res.status(403).json({ success: false, message: 'Not part of this trade' });
        }

        const team = await Team.findById(teamId);

        trade.chatMessages.push({
            teamId,
            teamName: team.name,
            message,
            timestamp: new Date()
        });

        await trade.save();

        res.status(200).json({
            success: true,
            chatMessages: trade.chatMessages
        });

    } catch (error) {
        console.error('Send Trade Message Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Trades for Mini Auction Team
export const getMiniTrades = async (req, res) => {
    try {
        const { miniAuctionId, teamId } = req.query;

        const trades = await Trade.find({
            miniAuctionId,
            $or: [
                { offeringTeam: teamId },
                { receivingTeam: teamId }
            ]
        })
            .populate('offeredPlayer.playerId')
            .populate('wantedPlayer.playerId')
            .populate('offeringTeam', 'name')
            .populate('receivingTeam', 'name')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            trades
        });

    } catch (error) {
        console.error('Get Mini Trades Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
