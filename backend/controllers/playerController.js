import Player from '../models/Player.js';

// @desc    Get all players
// @route   GET /api/players
// @access  Private
export const getPlayers = async (req, res) => {
    try {
        const { status, role } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (role) filter.role = role;

        const players = await Player.find(filter).sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: players.length,
            players
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Get single player
// @route   GET /api/players/:id
// @access  Private
export const getPlayer = async (req, res) => {
    try {
        const player = await Player.findById(req.params.id).populate('soldTo', 'name');

        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'Player not found'
            });
        }

        res.status(200).json({
            success: true,
            player
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Create player
// @route   POST /api/players
// @access  Private (Auctioneer only)
export const createPlayer = async (req, res) => {
    try {
        const player = await Player.create(req.body);

        res.status(201).json({
            success: true,
            player
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Update player
// @route   PUT /api/players/:id
// @access  Private (Auctioneer only)
export const updatePlayer = async (req, res) => {
    try {
        const player = await Player.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'Player not found'
            });
        }

        res.status(200).json({
            success: true,
            player
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Delete player
// @route   DELETE /api/players/:id
// @access  Private (Auctioneer only)
export const deletePlayer = async (req, res) => {
    try {
        const player = await Player.findByIdAndDelete(req.params.id);

        if (!player) {
            return res.status(404).json({
                success: false,
                message: 'Player not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Player deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Bulk create players
// @route   POST /api/players/bulk
// @access  Private (Auctioneer only)
export const bulkCreatePlayers = async (req, res) => {
    try {
        const { players } = req.body;

        if (!Array.isArray(players) || players.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an array of players'
            });
        }

        const createdPlayers = await Player.insertMany(players);

        res.status(201).json({
            success: true,
            count: createdPlayers.length,
            players: createdPlayers
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Search players in the global pool (uploaded via Compass)
// @route   GET /api/players/global-search
// @access  Private
export const searchGlobalPlayers = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.status(200).json({ success: true, players: [] });

        // Use raw collection to find players that were imported via Compass (no auctionId or different naming)
        // We look for name in 'Player' or 'name' field
        const queryWords = q.trim().split(/\s+/).filter(w => w.length > 0);
        const query = {
            $and: [
                ...queryWords.map(word => ({
                    $or: [
                        { Player: { $regex: word, $options: 'i' } },
                        { name: { $regex: word, $options: 'i' } }
                    ]
                })),
                {
                    $or: [
                        { auctionId: null },
                        { auctionId: { $exists: false } }
                    ]
                }
            ]
        };

        console.log(`Searching for: "${q}" with query:`, JSON.stringify(query));
        const rawPlayers = await Player.collection.find(query).limit(20).toArray();
        console.log(`Found ${rawPlayers.length} results for "${q}"`);
        console.log(`Found ${rawPlayers.length} results for "${q}"`);

        // Map them to a consistent format for the frontend
        const players = rawPlayers.map(p => {
            const name = p['Player Name'] || p.Player || p.name || 'Unknown';
            const country = p.Country || p.country || 'Unknown';
            const rawRole = (p.Position || p.role || p.Role || 'BATSMAN').toString().toUpperCase();

            // Map variations to enum: ['BATSMAN', 'BOWLER', 'ALL-ROUNDER', 'WICKET-KEEPER']
            let role = 'BATSMAN';
            if (rawRole.includes('ALL') || rawRole.includes('ROUND')) role = 'ALL-ROUNDER';
            else if (rawRole.includes('BOWL')) role = 'BOWLER';
            else if (rawRole.includes('WICKET') || rawRole.includes('KEEPER') || rawRole.includes('WK')) role = 'WICKET-KEEPER';
            else if (rawRole.includes('BATTER') || rawRole.includes('BATSMAN')) role = 'BATSMAN';

            // Parse Base Price (e.g., "2C" -> 200, "50L" -> 50)
            let rawPrice = (p['Base Price'] || p.basePrice || p.Price || p.price || '20L').toString();
            let price = 20;
            let displayLabel = '20 Lakhs';

            const num = parseFloat(rawPrice);
            const upper = rawPrice.toUpperCase();

            if (upper.includes('C') || upper.includes('CR')) {
                price = num * 100;
                displayLabel = `${num.toFixed(2)} Cr`;
            } else if (upper.includes('L')) {
                price = num;
                displayLabel = `${num} Lakhs`;
            } else {
                // If pure number, infer unit based on IPL standards (e.g. 2.0 -> 2 Cr, 50 -> 50 L)
                if (num < 15) {
                    price = num * 100;
                    displayLabel = `${num.toFixed(2)} Cr`;
                } else {
                    price = num;
                    displayLabel = `${num} Lakhs`;
                }
            }

            return {
                _id: p._id,
                name,
                country,
                role,
                basePrice: price,
                priceLabel: displayLabel,
                isGlobal: !p.auctionId
            };
        });

        res.status(200).json({
            success: true,
            players
        });
    } catch (error) {
        console.error("Global Search Error:", error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// @desc    Activate a global player for a specific room (clones if global)
// @route   POST /api/players/activate
// @access  Private (Auctioneer only)
export const activateGlobalPlayer = async (req, res) => {
    try {
        const { playerId, auctionId } = req.body;

        if (!playerId || !auctionId) {
            return res.status(400).json({ success: false, message: 'Missing playerId or auctionId' });
        }

        const mongoose = await import('mongoose');
        const Auction = mongoose.default.model('Auction');
        const Player = mongoose.default.model('Player'); // Global templates
        const RoomPlayer = mongoose.default.model('RoomPlayer'); // Active room players

        // Check if player is already active in this room (by checking globalPlayerId)
        let player = await RoomPlayer.findOne({ globalPlayerId: playerId, auctionId });
        if (player) {
            return res.status(200).json({ success: true, player });
        }

        // Find global player
        // Note: Using raw collection to handle Compass-imported fields
        const rawGlobal = await Player.collection.findOne({ _id: new mongoose.default.Types.ObjectId(playerId) });
        if (!rawGlobal) {
            return res.status(404).json({ success: false, message: 'Global player not found' });
        }

        // Map fields to our schema
        const name = rawGlobal['Player Name'] || rawGlobal.Player || rawGlobal.name || 'Unknown';
        const country = rawGlobal.Country || rawGlobal.country || 'Unknown';
        const rawRole = (rawGlobal.Position || rawGlobal.role || rawGlobal.Role || 'BATSMAN').toString().toUpperCase();

        let role = 'BATSMAN';
        if (rawRole.includes('ALL') || rawRole.includes('ROUND')) role = 'ALL-ROUNDER';
        else if (rawRole.includes('BOWL')) role = 'BOWLER';
        else if (rawRole.includes('WICKET') || rawRole.includes('KEEPER') || rawRole.includes('WK')) role = 'WICKET-KEEPER';
        else if (rawRole.includes('BATTER') || rawRole.includes('BATSMAN')) role = 'BATSMAN';

        let rawPrice = (rawGlobal['Base Price'] || rawGlobal.basePrice || rawGlobal.Price || rawGlobal.price || '20L').toString();
        let price = 20;
        let displayLabel = '20 Lakhs';

        const numVal = parseFloat(rawPrice);
        const upperPrice = rawPrice.toUpperCase();

        if (upperPrice.includes('C') || upperPrice.includes('CR')) {
            price = numVal * 100;
            displayLabel = `${numVal.toFixed(2)} Cr`;
        } else if (upperPrice.includes('L')) {
            price = numVal;
            displayLabel = `${numVal} Lakhs`;
        } else {
            if (numVal < 15) {
                price = numVal * 100;
                displayLabel = `${numVal.toFixed(2)} Cr`;
            } else {
                price = numVal;
                displayLabel = `${numVal} Lakhs`;
            }
        }

        // Create room-specific player
        const newPlayer = await RoomPlayer.create({
            name,
            country,
            role,
            basePrice: price,
            priceLabel: displayLabel,
            auctionId,
            status: 'AVAILABLE',
            globalPlayerId: playerId // Link back to global template
        });

        // Add to Auction's player list
        await Auction.findByIdAndUpdate(auctionId, {
            $addToSet: { players: newPlayer._id }
        });

        res.status(201).json({
            success: true,
            player: newPlayer
        });
    } catch (error) {
        console.error("Activate Player Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
