import Trade from '../models/Trade.js';
import Team from '../models/Team.js';
import Player from '../models/Player.js';

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

        res.status(201).json({ success: true, trade });

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
