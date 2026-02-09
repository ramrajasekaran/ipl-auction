import Auction from '../models/Auction.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import csv from 'csv-parser';
import fs from 'fs';
import * as XLSX from 'xlsx';
import Player from '../models/Player.js';
import RoomPlayer from '../models/RoomPlayer.js';
import { samplePlayers } from '../data/samplePlayers.js';

// Create a new Game/Auction Room
export const createGame = async (req, res) => {
    try {
        const { budget, password } = req.body;
        // req.user is guaranteed by 'protect' middleware
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const user = req.user;

        const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

        const auction = await Auction.create({
            name: `IPL Auction ${roomId}`,
            auctioneer: user._id,
            roomId,
            password,
            status: 'IDLE',
            settings: {
                initialPurse: budget || 100
            }
        });

        // DYNAMIC ROLE: Assign AUCTIONEER role if they are currently just a USER
        if (user.role === 'USER') {
            console.log('[CREATE] Updating user role to AUCTIONEER');
            await User.findByIdAndUpdate(user._id, { role: 'AUCTIONEER' });
        }

        res.status(201).json({
            success: true,
            roomId,
            auctionId: auction._id,
            budget: auction.settings.initialPurse,
            newRole: user.role === 'USER' ? 'AUCTIONEER' : user.role
        });

    } catch (error) {
        console.error('Create Game Error Detail:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// Join an existing Game
export const joinGame = async (req, res) => {
    try {
        const { roomId, teamName, password } = req.body;
        console.log(`Join Request: Room=${roomId}, Team=${teamName}`);

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const user = req.user;

        const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });
        if (!auction) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Check Max Teams Limit
        const maxTeams = auction.settings?.maxTeams || 10;
        if (auction.teams.length >= maxTeams) {
            return res.status(400).json({
                success: false,
                message: `Room is full (Max ${maxTeams} Teams). Please ask the manager to increase capacity or use the "Continue" tab.`
            });
        }

        // Prevent manager from joining their own room as a team
        if (auction.auctioneer.toString() === user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You cannot join this room as a team owner because you are the Manager/Auctioneer of this room.'
            });
        }

        // Check if this user already has a team in this room
        const existingTeamByUser = await Team.findOne({
            owner: user._id,
            auctionId: auction._id
        });

        if (existingTeamByUser) {
            return res.status(400).json({
                success: false,
                message: 'You have already registered a team in this room. Please use the "Continue" tab instead.'
            });
        }

        // Check if team name is already taken in this room
        const existingTeamByName = await Team.findOne({
            name: { $regex: new RegExp(`^${teamName}$`, 'i') },
            auctionId: auction._id
        });

        if (existingTeamByName) {
            return res.status(400).json({
                success: false,
                message: 'This team name is already taken in this room. Please choose another.'
            });
        }

        const newTeam = await Team.create({
            name: teamName,
            owner: user._id,
            password, // Store for re-entry validation
            initialPurse: auction.settings.initialPurse,
            currentPurse: auction.settings.initialPurse,
            auctionId: auction._id,
            players: []
        });

        // Add team to auction
        auction.teams.push(newTeam._id);
        await auction.save();

        // Broadcast updated state to all users in the room
        const updatedAuction = await Auction.findById(auction._id)
            .populate('currentPlayer')
            .populate('currentBid.team')
            .populate('currentBid.placedBy', 'name')
            .populate({
                path: 'teams',
                populate: {
                    path: 'players.player'
                }
            })
            .populate('players');

        console.log(`[joinGame] Broadcasting auction:state. Teams count: ${updatedAuction.teams?.length}`);
        const io = req.app.get('io');
        if (io) {
            io.to(`auction:${auction._id}`).emit('auction:state', { auction: updatedAuction });
        }

        // DYNAMIC ROLE: Assign TEAM_OWNER role if they are currently just a USER
        if (user.role === 'USER') {
            console.log('[JOIN] Updating user role to TEAM_OWNER');
            await User.findByIdAndUpdate(user._id, { role: 'TEAM_OWNER' });
        }

        res.status(200).json({
            success: true,
            teamId: newTeam._id,
            auctionId: auction._id,
            userId: user._id,
            purse: newTeam.currentPurse,
            newRole: user.role === 'USER' ? 'TEAM_OWNER' : user.role
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ success: false, message: 'Team Name already exists in this room' });
        }
        console.error('Join Game Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// Validate Manager Login to resume
export const resumeGame = async (req, res) => {
    try {
        let { roomId, password } = req.body;
        roomId = roomId ? roomId.toUpperCase() : '';

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const auction = await Auction.findOne({ roomId });

        if (!auction) {
            return res.status(404).json({ success: false, message: 'Room Code not found' });
        }

        // Per-Room Role Check: Only the original auctioneer of THIS room can resume it
        const isAuctioneer = auction.auctioneer.toString() === req.user._id.toString();
        if (!isAuctioneer) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied. You are not the Manager/Auctioneer of this room. Only the user who created this room can resume it.'
            });
        }

        // Password Verification: Always verify password when resuming
        if (!password) {
            return res.status(401).json({ success: false, message: 'Password required' });
        }

        const isMatch = await auction.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect Password. Please enter the password you created for this room.' });
        }

        // Password verified, proceed
        res.status(200).json({
            success: true,
            auctionId: auction._id,
            budget: auction.settings.initialPurse
        });

    } catch (error) {
        console.error('Resume Game Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Add Default Players to Auction
export const addDefaultPlayers = async (req, res) => {
    try {
        const { roomId } = req.body;
        console.log(`[addDefaultPlayers] Request received for room: ${roomId}`);

        const auction = await Auction.findOne({ roomId });
        if (!auction) {
            console.error(`[addDefaultPlayers] Room not found: ${roomId}`);
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Check if room already has players
        const existingCount = await RoomPlayer.countDocuments({ auctionId: auction._id });
        if (existingCount > 0) {
            console.log(`[addDefaultPlayers] Room ${roomId} already has ${existingCount} players. Skipping default load.`);
            return res.status(200).json({ success: true, message: 'Players already loaded', count: existingCount });
        }

        // Find template players (global players without auctionId)
        // Ensure we strictly look for the templates
        let templates = await Player.find({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        });

        console.log(`[addDefaultPlayers] Found ${templates.length} template/global players in database`);

        if (templates.length === 0) {
            console.log('[addDefaultPlayers] ⚠️ No global players found in DB. Attempting to Auto-seed default players into Global DB...');
            // Auto-Seed Logic
            try {
                // Must insert into GLOBAL Player collection, not RoomPlayer yet
                console.log(`[addDefaultPlayers] Sample players count: ${samplePlayers?.length}`);
                if (!samplePlayers || samplePlayers.length === 0) {
                    throw new Error("Sample players data is empty or undefined");
                }

                const seeded = await Player.insertMany(samplePlayers);
                console.log(`[addDefaultPlayers] ✅ Auto-seeded ${seeded.length} players into Global DB.`);
                templates = seeded; // Use the newly seeded players
            } catch (seedError) {
                console.error("[addDefaultPlayers] Auto-seed failed:", seedError);
                return res.status(500).json({ success: false, message: 'Failed to auto-seed default database: ' + seedError.message });
            }
        }

        // Map imported CSV fields to schema fields
        const newPlayers = templates.map((p, index) => {
            // Convert Mongoose document to plain object to access hyphenated fields
            const playerObj = p.toObject ? p.toObject() : p;

            if (index === 0) {
                console.log('[addDefaultPlayers] First template object keys:', Object.keys(playerObj));
            }

            // Handle different field name variations from imported CSV
            const name = playerObj['player-name'] || playerObj['Player Name'] || playerObj.Player || playerObj.name || 'Unknown';
            const country = playerObj.country || playerObj.Country || 'Unknown';
            const rawRole = (playerObj.position || playerObj.Position || playerObj.role || playerObj.Role || 'BATSMAN').toString().toUpperCase();

            // Map role variations to standard enums
            let role = 'BATSMAN';
            if (rawRole.includes('ALL') || rawRole.includes('ROUND')) role = 'ALL-ROUNDER';
            else if (rawRole.includes('BOWL')) role = 'BOWLER';
            else if (rawRole.includes('WICKET') || rawRole.includes('KEEPER') || rawRole.includes('WK')) role = 'WICKET-KEEPER';
            else if (rawRole.includes('BATTER') || rawRole.includes('BATSMAN') || rawRole.includes('BAT')) role = 'BATSMAN';

            // Parse Base Price (e.g., "2C" -> 200, "50L" -> 50)
            let rawPrice = (playerObj['base-price'] || playerObj['Base Price'] || playerObj.basePrice || playerObj.Price || playerObj.price || '20L').toString();
            let price = 20;
            let displayLabel = '20 Lakhs';

            const num = parseFloat(rawPrice);
            const upper = rawPrice.toUpperCase();

            if (upper.includes('C') || upper.includes('CR')) {
                price = num * 100;
            } else if (upper.includes('L')) {
                price = num;
            } else if (!isNaN(num)) {
                // Pure number - infer unit
                if (num < 15) {
                    price = num * 100;
                } else {
                    price = num;
                }
            }

            if (price >= 100) {
                displayLabel = `${(price / 100).toFixed(2)} Cr`;
            } else {
                displayLabel = `${price} Lakhs`;
            }

            return {
                name,
                country,
                role,
                basePrice: price,
                priceLabel: displayLabel,
                image: playerObj.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400&bold=true`,
                age: playerObj.age || 25,
                stats: playerObj.stats || {},
                auctionId: auction._id,
                status: 'AVAILABLE'
            };
        });

        console.log(`[addDefaultPlayers] Prepared ${newPlayers.length} players for room ${roomId} (ID: ${auction._id})`);

        if (newPlayers.length > 0) {
            const result = await RoomPlayer.insertMany(newPlayers);
            console.log(`[addDefaultPlayers] InsertMany result count: ${result.length}`);

            const createdPlayers = await RoomPlayer.find({ auctionId: auction._id });
            console.log(`[addDefaultPlayers] Found ${createdPlayers.length} players in DB RE-QUERY after seeding`);

            auction.players = createdPlayers.map(p => p._id);

            // Calculate and Set Max Teams (Total Players / 25)
            const calculatedMaxTeams = Math.floor(createdPlayers.length / 25);
            // Ensure at least 2 teams, default to current max if calculation is too low (though 361/25 = 14)
            auction.settings.maxTeams = Math.max(2, calculatedMaxTeams);
            console.log(`[addDefaultPlayers] Updated Max Teams to ${auction.settings.maxTeams}`);

            await auction.save();
            console.log('[addDefaultPlayers] Auction saved with new players');

            // Notify all users in the room
            const updatedAuction = await Auction.findById(auction._id)
                .populate('currentPlayer')
                .populate('teams')
                .populate('players');

            const io = req.app.get('io');
            if (io) {
                io.to(`auction:${auction._id}`).emit('auction:state', { auction: updatedAuction });
            }

            res.status(200).json({ success: true, count: newPlayers.length });
        } else {
            console.log('[addDefaultPlayers] No players were prepared from templates.');
            res.status(200).json({ success: false, message: 'No players found to load.', count: 0 });
        }

    } catch (error) {
        console.error("[addDefaultPlayers] CRITICAL ERROR:", error);
        res.status(500).json({ success: false, message: 'Server Error: ' + error.message });
    }
};

// Upload Custom Players via CSV
export const uploadPlayers = async (req, res) => {
    try {
        const { roomId } = req.body;
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        // Validate File Type (Strict CSV check)
        if (req.file.mimetype !== 'text/csv' && !req.file.originalname.toLowerCase().endsWith('.csv')) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
            return res.status(400).json({ success: false, message: 'Invalid file format. Only .csv files are allowed.' });
        }

        const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });
        if (!auction) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        const results = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    console.log(`CSV Upload for Room ${roomId}: Found ${results.length} rows`);
                    if (results.length === 0) {
                        try { fs.unlinkSync(req.file.path); } catch (e) { }
                        return res.status(400).json({ success: false, message: 'CSV file is empty or invalid.' });
                    }

                    // Dynamic Header Detection
                    const firstRow = results[0];
                    const keys = Object.keys(firstRow);
                    console.log('CSV Headers Found:', keys);

                    // Helper to fuzzy match column names
                    const findKey = (keywords) => {
                        return keys.find(k => {
                            const cleanKey = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                            return keywords.some(kw => cleanKey.includes(kw));
                        });
                    };

                    const nameKey = findKey(['name', 'player']);
                    const roleKey = findKey(['role', 'position', 'type']);
                    const priceKey = findKey(['price', 'cost', 'amount', 'value', 'base']);
                    const countryKey = findKey(['country', 'nation', 'team']);
                    const ageKey = findKey(['age']);
                    const imageKey = findKey(['image', 'img', 'photo', 'picture']);

                    console.log(`Mapped Keys: Name=${nameKey}, Role=${roleKey}, Price=${priceKey}`);

                    if (!nameKey || !roleKey || !priceKey) {
                        try { fs.unlinkSync(req.file.path); } catch (e) { }
                        return res.status(400).json({
                            success: false,
                            message: "Invalid CSV. The file must contain columns for Name, Role, and Price."
                        });
                    }

                    const validPlayers = results.map(row => {
                        const name = row[nameKey] ? row[nameKey].trim() : 'Unknown';
                        const country = row[countryKey] ? row[countryKey].trim() : 'India';

                        let rawRole = (row[roleKey] || 'BATSMAN').toString().toUpperCase().trim();
                        let role = 'BATSMAN';
                        if (rawRole.includes('BOWL')) role = 'BOWLER';
                        else if (rawRole.includes('ALL') || rawRole.includes('ROUND')) role = 'ALL-ROUNDER';
                        else if (rawRole.includes('WICKET') || rawRole.includes('KEEPER') || rawRole.includes('WK')) role = 'WICKET-KEEPER';
                        else role = 'BATSMAN';

                        // Parse Base Price
                        let rawPrice = (row[priceKey] || '').toString().trim();
                        // Fallback logic ONLY if empty
                        if (!rawPrice) rawPrice = '20';

                        let price = 20;
                        let displayLabel = '20 Lakhs';

                        const numVal = parseFloat(rawPrice);
                        const upperPrice = rawPrice.toUpperCase();

                        if (isNaN(numVal)) {
                            // If completely invalid, default to 20
                            price = 20;
                        } else if (upperPrice.includes('C')) { // Matches C, CR, Crores
                            price = numVal * 100;
                        } else if (upperPrice.includes('L')) { // Matches L, Lakhs
                            price = numVal;
                        } else {
                            // No unit specified
                            if (numVal < 15) {
                                // Heuristic: Small numbers (<15) without unit are likely Crores (e.g. "2", "2.5")
                                price = numVal * 100;
                            } else {
                                // Larger numbers are likely Lakhs (e.g. "20", "50", "200")
                                // OR raw full numbers (e.g. 2000000)
                                if (numVal > 10000) {
                                    // Assume raw rupees, convert to Lakhs
                                    price = numVal / 100000;
                                } else {
                                    price = numVal;
                                }
                            }
                        }

                        if (price >= 100) {
                            displayLabel = `${(price / 100).toFixed(2)} Cr`;
                        } else {
                            displayLabel = `${price} Lakhs`;
                        }

                        return {
                            name: name,
                            country: country,
                            role: role,
                            basePrice: price,
                            priceLabel: displayLabel,
                            age: row[ageKey] ? parseInt(row[ageKey]) : 25,
                            auctionId: auction._id, // SCOPED TO THIS ROOM
                            status: 'AVAILABLE',
                            image: row[imageKey] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
                        };
                    }).filter(p => p.name !== 'Unknown' && p.name && p.name.length > 1);

                    console.log(`Mapped ${validPlayers.length} valid players from CSV`);

                    if (validPlayers.length > 0) {
                        // CRITICAL: Cleanup previous players for THIS room only to avoid duplicates/mixing
                        await RoomPlayer.deleteMany({ auctionId: auction._id });
                        console.log(`Cleaned up previous players for room ${roomId}`);

                        await RoomPlayer.insertMany(validPlayers);
                        const createdPlayers = await RoomPlayer.find({ auctionId: auction._id });
                        console.log(`Successfully inserted ${createdPlayers.length} players for room ${roomId}`);

                        auction.players = createdPlayers.map(p => p._id);

                        // Calculate and Set Max Teams (Total Players / 25)
                        const calculatedMaxTeams = Math.floor(validPlayers.length / 25);
                        auction.settings.maxTeams = Math.max(2, calculatedMaxTeams);
                        console.log(`Updated Max Teams to ${auction.settings.maxTeams} based on ${validPlayers.length} uploaded players`);

                        await auction.save();

                        // Notify all users in the room to refresh their player list
                        const updatedAuction = await Auction.findById(auction._id)
                            .populate('currentPlayer')
                            .populate('teams')
                            .populate('players');

                        const io = req.app.get('io');
                        if (io) {
                            io.to(`auction:${auction._id}`).emit('auction:state', { auction: updatedAuction });
                        }
                    }

                    // Cleanup file
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (e) { console.error("File delete error", e); }

                    res.status(200).json({ success: true, count: validPlayers.length });

                } catch (processError) {
                    console.error("CSV Processing Error:", processError);
                    res.status(500).json({ success: false, message: 'Error processing CSV file' });
                }
            })
            .on('error', (err) => {
                console.error("CSV Read Stream Error:", err);
                res.status(500).json({ success: false, message: 'Failed to read CSV file' });
            });

    } catch (error) {
        console.error("Upload Error:", error);
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};
export const rejoinTeam = async (req, res) => {
    try {
        let { roomId, teamName, password } = req.body;
        roomId = roomId ? roomId.toUpperCase() : '';

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        // 1. Find Auction
        const auction = await Auction.findOne({ roomId });
        if (!auction) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // 2. Find Team in that Auction
        const team = await Team.findOne({
            name: teamName,
            auctionId: auction._id
        });

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found in this Room' });
        }

        // 3. Per-Room Role Check: Only the original owner of THIS team can rejoin it
        const isTeamOwner = team.owner.toString() === req.user._id.toString();
        if (!isTeamOwner) {
            return res.status(403).json({
                success: false,
                message: 'Access Denied. You are not the owner of this team. Only the user who originally created this team can rejoin it.'
            });
        }

        // 3. Password Verification: Always verify password when rejoining
        if (!password) {
            return res.status(401).json({ success: false, message: 'Password required' });
        }

        const isMatch = await team.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid Team Password. Please enter the password you created when joining.' });
        }

        // Password verified, allow access
        res.status(200).json({
            success: true,
            teamId: team._id,
            auctionId: auction._id,
            userId: team.owner,
            purse: team.currentPurse
        });

    } catch (error) {
        console.error('Rejoin Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server Error' });
    }
};

// Release Player (Mini Auction)
export const releasePlayer = async (req, res) => {
    try {
        const { roomId, playerId, teamId } = req.body;

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const team = await Team.findById(teamId);
        if (!team) return res.status(404).json({ success: false, message: 'Team not found' });

        // Ownership Check: Ensure the user is the owner of this team
        if (team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not the owner of this team' });
        }

        const player = await RoomPlayer.findById(playerId);
        if (!player) return res.status(404).json({ success: false, message: 'Player not found' });

        // Verify player belongs to team
        if (player.soldTo?.toString() !== teamId) {
            return res.status(403).json({ success: false, message: 'Player does not belong to this team' });
        }

        // Refund Logic
        const refundAmount = player.soldPrice || 0;
        team.currentPurse += refundAmount;

        // Remove from players list
        team.players = team.players.filter(p => (p.player?.toString() || p.toString()) !== playerId);
        // Update Player Status
        player.status = 'AVAILABLE';
        player.soldTo = null;
        player.soldPrice = null;
        await player.save();

        res.status(200).json({
            success: true,
            teamPurse: team.currentPurse,
            releasedPlayerId: playerId,
            message: `Released ${player.name} and refunded ${refundAmount} Cr`
        });

    } catch (error) {
        console.error("Release Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Team Details (Validated)
export const getTeamDetails = async (req, res) => {
    try {
        const { teamId } = req.params;

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const team = await Team.findById(teamId).populate('players.player');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Security: Ensure user is owner OR manager of the auction
        const auction = await Auction.findById(team.auctionId);
        const isManager = auction && auction.auctioneer.toString() === req.user._id.toString();
        const isOwner = team.owner.toString() === req.user._id.toString();

        if (!isManager && !isOwner) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({
            success: true,
            team: team
        });

    } catch (error) {
        console.error('Get Team Details Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Reset Manager Password
export const resetManagerPassword = async (req, res) => {
    try {
        const { roomId, newPassword } = req.body;

        if (!roomId || !newPassword) {
            return res.status(400).json({ success: false, message: 'Room ID and new password are required' });
        }

        const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });

        if (!auction) {
            return res.status(404).json({ success: false, message: 'Room not found. Please verify the room code.' });
        }

        // Ownership Check: Only the auctioneer can reset the room password
        if (auction.auctioneer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not the manager of this room' });
        }

        // Update password (in production, should hash with bcrypt)
        auction.password = newPassword;
        await auction.save();

        res.status(200).json({
            success: true,
            message: 'Manager password reset successfully'
        });

    } catch (error) {
        console.error("Reset Manager Password Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Reset Team Password
export const resetTeamPassword = async (req, res) => {
    try {
        const { roomId, teamName, newPassword } = req.body;

        if (!roomId || !teamName || !newPassword) {
            return res.status(400).json({ success: false, message: 'Room ID, team name, and new password are required' });
        }

        // Find the auction first
        const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });

        if (!auction) {
            return res.status(404).json({ success: false, message: 'Room not found. Please verify the room code.' });
        }

        // Find the team
        const team = await Team.findOne({
            auctionId: auction._id,
            name: { $regex: new RegExp(`^${teamName}$`, 'i') } // Case-insensitive match
        });

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found in this room. Please verify the team name.' });
        }

        // Ownership Check: Only the team owner can reset their team's password
        if (team.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You are not the owner of this team' });
        }

        // Update password (in production, should hash with bcrypt)
        team.password = newPassword;
        await team.save();

        res.status(200).json({
            success: true,
            message: 'Team password reset successfully'
        });

    } catch (error) {
        console.error("Reset Team Password Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Upload Global/Default Players via CSV (Admin Only)
export const uploadGlobalPlayers = async (req, res) => {
    try {
        // ideally add an admin secret check here via headers or body
        if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

        const results = [];

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', async () => {
                try {
                    console.log(`Global CSV Upload: Found ${results.length} rows`);

                    if (results.length === 0) {
                        return res.status(400).json({ success: false, message: 'CSV file is empty' });
                    }

                    // Dynamic Header Detection
                    const firstRow = results[0];
                    const keys = Object.keys(firstRow);
                    console.log('CSV Headers Found:', keys);

                    // Helper to fuzzy match column names
                    const findKey = (keywords) => {
                        return keys.find(k => {
                            const cleanKey = k.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
                            return keywords.some(kw => cleanKey.includes(kw));
                        });
                    };

                    const nameKey = findKey(['name', 'player', 'fullname']);
                    const countryKey = findKey(['country', 'nation', 'team', 'nationality']);
                    const roleKey = findKey(['role', 'position', 'type', 'category']);
                    const priceKey = findKey(['price', 'cost', 'amount', 'value', 'base']);
                    const ageKey = findKey(['age']);
                    const imageKey = findKey(['image', 'img', 'photo', 'picture']);

                    console.log('Mapped Keys:', { nameKey, countryKey, roleKey, priceKey });

                    if (!nameKey || !roleKey || !priceKey) {
                        return res.status(400).json({
                            success: false,
                            message: "Invalid CSV format. Missing required columns (Name, Role, Price)."
                        });
                    }

                    const validPlayers = results.map(row => {
                        const name = row[nameKey] ? row[nameKey].trim() : 'Unknown';
                        const country = row[countryKey] ? row[countryKey].trim() : 'India';

                        let rawRole = (row[roleKey] || 'BATSMAN').toString().toUpperCase().trim();
                        let role = 'BATSMAN';
                        if (rawRole.includes('BOWL')) role = 'BOWLER';
                        else if (rawRole.includes('ALL') || rawRole.includes('ROUND')) role = 'ALL-ROUNDER';
                        else if (rawRole.includes('WICKET') || rawRole.includes('KEEPER') || rawRole.includes('WK')) role = 'WICKET-KEEPER';
                        else role = 'BATSMAN';

                        // Parse Base Price
                        let rawPrice = (row[priceKey] || '20').toString().trim();
                        let price = 20;
                        let displayLabel = '20 Lakhs';

                        const numVal = parseFloat(rawPrice.replace(/[^0-9.]/g, ''));
                        const upperPrice = rawPrice.toUpperCase();

                        if (upperPrice.includes('C') || upperPrice.includes('CR')) {
                            price = numVal * 100;
                        } else if (upperPrice.includes('L')) {
                            price = numVal;
                        } else {
                            if (numVal < 15) { // Heuristic: if a number without unit is small (e.g. 2.0), assume it's Cr
                                price = numVal * 100;
                            } else { // Otherwise, assume it's Lakhs (e.g. 20, 50)
                                price = numVal;
                            }
                        }

                        if (price >= 100) {
                            displayLabel = `${(price / 100).toFixed(2)} Cr`;
                        } else {
                            displayLabel = `${price} Lakhs`;
                        }

                        // Fallback: If price is NaN or 0, default to 20L
                        if (isNaN(price) || price === 0) {
                            price = 20;
                            displayLabel = '20 Lakhs';
                        }

                        return {
                            name: name,
                            country: country,
                            role: role,
                            basePrice: price,
                            priceLabel: displayLabel,
                            age: row[ageKey] ? parseInt(row[ageKey]) : 25,
                            auctionId: null, // GLOBAL PLAYER
                            status: 'AVAILABLE',
                            image: row[imageKey] || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&size=400&bold=true`
                        };
                    }).filter(p => p.name !== 'Unknown' && p.name && p.name.length > 1);

                    console.log(`Mapped ${validPlayers.length} valid GLOBAL players`);

                    if (validPlayers.length > 0) {
                        await Player.insertMany(validPlayers);
                        console.log(`Successfully inserted ${validPlayers.length} global players`);
                    }

                    // Cleanup file
                    try {
                        fs.unlinkSync(req.file.path);
                    } catch (e) { console.error("File delete error", e); }

                    res.status(200).json({ success: true, count: validPlayers.length });

                } catch (processError) {
                    console.error("CSV Processing Error:", processError);
                    res.status(500).json({ success: false, message: 'Error processing CSV file' });
                }
            })
            .on('error', (err) => {
                console.error("CSV Read Stream Error:", err);
                res.status(500).json({ success: false, message: 'Failed to read CSV file' });
            });

    } catch (error) {
        console.error("Global Upload Error:", error);
        if (req.file) {
            try { fs.unlinkSync(req.file.path); } catch (e) { }
        }
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Get Global Players (Admin Only)
export const getGlobalPlayers = async (req, res) => {
    try {
        const players = await Player.find({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        }).sort({ name: 1 });

        res.status(200).json({ success: true, count: players.length, players });
    } catch (error) {
        console.error("Get Global Players Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Clear Global Players (Admin Only)
export const clearGlobalPlayers = async (req, res) => {
    try {
        const result = await Player.deleteMany({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        });

        res.status(200).json({ success: true, message: `Deleted ${result.deletedCount} global players` });
    } catch (error) {
        console.error("Clear Global Players Error:", error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Seed Default Players (Admin Only)
export const seedGlobalPlayers = async (req, res) => {
    try {
        console.log('[SEED] Starting global player seeding...');

        // Ensure samplePlayers exists
        if (!samplePlayers || samplePlayers.length === 0) {
            return res.status(500).json({ success: false, message: 'Sample player data not found' });
        }

        // Format sample players for global collection
        const formatted = samplePlayers.map(p => ({
            ...p,
            auctionId: null,
            status: 'AVAILABLE',
            priceLabel: p.basePrice >= 100 ? `${(p.basePrice / 100).toFixed(2)} Cr` : `${p.basePrice} Lakhs`,
            image: p.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random&size=400&bold=true`
        }));

        // Insert
        await Player.insertMany(formatted);
        console.log(`[SEED] Successfully seeded ${formatted.length} global players`);

        res.status(200).json({ success: true, count: formatted.length });
    } catch (error) {
        console.error("Seed Global Players Error:", error);
        res.status(500).json({ success: false, message: 'Seeding failed: ' + error.message });
    }
};

// Get Team Details (Validated)
const getTeamDetails_Ignored = async (req, res) => {
    try {
        const { teamId } = req.params;

        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }

        const team = await Team.findById(teamId).populate('players.player');

        if (!team) {
            return res.status(404).json({ success: false, message: 'Team not found' });
        }

        // Security: Ensure user is owner OR manager of the auction
        const auction = await Auction.findById(team.auctionId);
        const isManager = auction && auction.auctioneer.toString() === req.user._id.toString();
        const isOwner = team.owner.toString() === req.user._id.toString();

        if (!isManager && !isOwner) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.status(200).json({
            success: true,
            team: team
        });

    } catch (error) {
        console.error('Get Team Details Error:', error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Export all together
export default {
    createGame,
    joinGame,
    resumeGame,
    rejoinTeam,
    addDefaultPlayers,
    uploadPlayers,
    uploadGlobalPlayers,
    getGlobalPlayers,
    clearGlobalPlayers,
    releasePlayer,
    resetManagerPassword,
    resetTeamPassword,
    getTeamDetails
};
