import Auction from '../models/Auction.js';
import MiniAuction from '../models/MiniAuction.js';

import RoomPlayer from '../models/RoomPlayer.js';
import Team from '../models/Team.js';
import Bid from '../models/Bid.js';

let timerIntervals = {}; // Store timer intervals for each auction

const getPopulatedAuction = async (auctionId) => {
    // Try Standard Auction
    let auction = await Auction.findById(auctionId)
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

    if (auction) return auction;

    // Try Mini Auction
    const mini = await MiniAuction.findById(auctionId)
        .populate('currentPlayer')
        .populate('currentBid.team')
        .populate('currentBid.placedBy', 'name')
        .populate({
            path: 'teams',
            populate: {
                path: 'players.player'
            }
        })
        .populate('playerPool'); // Use playerPool instead of players

    if (mini) {
        // Dynamic Player Fetch: Ignore stored pool, fetch all eligible players directly from DB
        // This ensures UNSOLD, AVAILABLE, and RELEASED players are always visible
        const players = await RoomPlayer.find({
            auctionId: mini.megaAuctionId,
            status: { $in: ['UNSOLD', 'AVAILABLE', 'RELEASED'] }
        });

        // Manual construction to ensure all fields are present and strings
        return {
            _id: mini._id,
            roomId: mini.roomId,
            status: mini.status,
            budget: mini.budget,
            settings: mini.settings || { initialPurse: mini.budget }, // Polyfill settings for frontend safety
            teams: mini.teams || [],
            players: players || [], // Use dynamic list
            currentPlayer: mini.currentPlayer,
            currentBid: mini.currentBid,
            timer: mini.timer,
            megaAuctionId: mini.megaAuctionId
        };
    }

    return null;
};

export const setupSocketHandlers = (io) => {
    const str = (val) => val?.toString();

    // Helper to find any auction doc
    const findAnyAuction = async (id) => {
        return (await Auction.findById(id)) || (await MiniAuction.findById(id));
    };

    // Helper to update any auction
    const updateAnyAuction = async (id, update, options = {}) => {
        const a = await Auction.findByIdAndUpdate(id, update, options);
        if (a) return a;
        return await MiniAuction.findByIdAndUpdate(id, update, options);
    };

    // Helper for Sold logic
    const handleSold = async (auctionId, playerId, teamId, price) => {
        const aId = str(auctionId);
        console.log(`[Socket] handleSold Triggered: Auction=${aId}, Player=${playerId}, Team=${teamId}, Price=${price}`);

        try {
            // Fetch JUST the necessary docs first to validate
            const auction = await findAnyAuction(aId);
            const team = await Team.findById(str(teamId));
            const player = await RoomPlayer.findById(str(playerId));

            if (!auction) { console.error('HandleSold: Auction not found'); return null; }
            if (!team) { console.error('HandleSold: Team not found'); return null; }
            if (!player) { console.error('HandleSold: Player not found'); return null; }

            // Idempotency Check: Prevent duplicate sales
            if (player.status === 'SOLD') {
                console.log(`[Socket] Skipped Sold: Player ${player.name} already sold.`);
                return null;
            }

            const priceInCr = price / 100;
            team.currentPurse -= priceInCr;
            team.players.push({ player: player._id, boughtPrice: priceInCr });
            await team.save();

            player.status = 'SOLD';
            player.soldTo = team._id;
            player.soldPrice = priceInCr;
            await player.save();

            auction.currentPlayer = null;
            auction.currentBid = { amount: 0, team: null, placedBy: null };
            auction.status = 'IDLE';
            auction.timer = { isRunning: false, remaining: 0, startedAt: null };
            await auction.save();

            // OPTIMIZATION: Do NOT emit full auction. Emit only the delta.
            console.log(`[Socket] Sold Success. Emitting event.`);
            io.to(`auction:${aId}`).emit('auction:player-sold', {
                player,
                team: { _id: team._id, name: team.name, currentPurse: team.currentPurse },
                price: price,
                timestamp: new Date()
            });

            if (timerIntervals[aId]) {
                clearInterval(timerIntervals[aId]);
                delete timerIntervals[aId];
            }
            return auction;
        } catch (err) {
            console.error('HandleSold Exception:', err);
            io.to(`auction:${aId}`).emit('error', { message: `Sold Action Failed: ${err.message}` });
            return null;
        }
    };

    // Helper for Unsold logic
    const handleUnsold = async (auctionId, playerId) => {
        const aId = str(auctionId);
        console.log(`[Socket] handleUnsold: ${aId}`);
        const player = await RoomPlayer.findById(str(playerId));
        if (player) {
            player.status = 'UNSOLD';
            await player.save();
        }

        const auction = await updateAnyAuction(
            aId,
            {
                currentPlayer: null,
                currentBid: { amount: 0, team: null, placedBy: null },
                status: 'IDLE',
                timer: { isRunning: false, remaining: 0, startedAt: null }
            },
            { new: true }
        );

        // OPTIMIZATION: Lightweight emit
        io.to(`auction:${aId}`).emit('auction:player-unsold', {
            player,
            timestamp: new Date()
        });

        if (timerIntervals[aId]) {
            clearInterval(timerIntervals[aId]);
            delete timerIntervals[aId];
        }
        return auction;
    };

    // RECOVERY LOGIC: Resume timers on server restart
    const recoverTimers = async () => {
        console.log('🔄 Checking for interrupted timers...');
        try {
            // Find ALL active auctions with running timers
            const auctions = await Auction.find({ 'timer.isRunning': true });
            const miniAuctions = await MiniAuction.find({ 'timer.isRunning': true });
            const allActive = [...auctions, ...miniAuctions];

            if (allActive.length === 0) {
                console.log('✅ No active timers to recover.');
                return;
            }

            console.log(`⚠️ Found ${allActive.length} interrupted timers. Recovering...`);

            for (const auction of allActive) {
                const aId = str(auction._id);
                if (!auction.timer.startedAt) continue;

                // Calculate real remaining time
                const elapsedSeconds = Math.floor((Date.now() - new Date(auction.timer.startedAt)) / 1000);
                let remaining = 10 - elapsedSeconds;

                console.log(`[Recovery] Auction ${aId}: Elapsed ${elapsedSeconds}s, Remaining ${remaining}s`);

                if (remaining > 0) {
                    // RESUME
                    if (timerIntervals[aId]) clearInterval(timerIntervals[aId]);

                    timerIntervals[aId] = setInterval(async () => {
                        remaining--;
                        io.to(`auction:${aId}`).emit('auction:timer-update', { remaining, isRunning: true });

                        if (remaining <= 0) {
                            clearInterval(timerIntervals[aId]);
                            delete timerIntervals[aId];

                            // Re-fetch clean state
                            const finalAuction = await findAnyAuction(aId);
                            if (finalAuction?.currentBid?.team) {
                                await handleSold(aId, finalAuction.currentPlayer, finalAuction.currentBid.team, finalAuction.currentBid.amount);
                            } else if (finalAuction?.currentPlayer) {
                                await handleUnsold(aId, finalAuction.currentPlayer);
                            }
                        }
                    }, 1000);
                } else {
                    // FINISH IMMEDIATELY
                    console.log(`[Recovery] Auction ${aId} time expired while offline. Closing...`);
                    const finalAuction = await findAnyAuction(aId); // Refresh state
                    if (finalAuction?.currentBid?.team) {
                        await handleSold(aId, finalAuction.currentPlayer, finalAuction.currentBid.team, finalAuction.currentBid.amount);
                    } else if (finalAuction?.currentPlayer) {
                        await handleUnsold(aId, finalAuction.currentPlayer);
                    }
                }
            }
        } catch (error) {
            console.error('❌ Timer Recovery Failed:', error);
        }
    };

    // Run recovery on startup
    recoverTimers();

    io.on('connection', (socket) => {
        const id = socket.id;
        console.log(`✅ Socket connected: ${id}`);

        const isAuctioneer = async (aId, emitError = true) => {
            if (!socket.userId) {
                if (emitError) socket.emit('error', { message: 'Identity missing. Please rejoin.' });
                return false;
            }

            let auction = await Auction.findById(aId);
            let authorized = false;

            if (auction) {
                authorized = auction.auctioneer.toString() === socket.userId.toString();
            } else {
                auction = await MiniAuction.findById(aId).populate('megaAuctionId');
                if (auction && auction.megaAuctionId) {
                    authorized = auction.megaAuctionId.auctioneer.toString() === socket.userId.toString();
                }
            }

            if (!auction) {
                if (emitError) socket.emit('error', { message: 'Auction not found' });
                return false;
            }

            if (!authorized && emitError) {
                socket.emit('error', { message: 'Unauthorized. Only the Auctioneer can perform this action.' });
            }
            return authorized;
        };

        // Join auction room
        socket.on('auction:join', async ({ auctionId, userId }) => {
            try {
                const aId = str(auctionId);

                // Store userId on socket for verification in subsequent events
                socket.userId = userId;

                // Ensure room isolation: Leave all other auction rooms before joining the new one
                const rooms = Array.from(socket.rooms);
                rooms.forEach(room => {
                    if (room.startsWith('auction:') && room !== `auction:${aId}`) {
                        console.log(`[Socket] leaving old room: ${room}`);
                        socket.leave(room);
                    }
                });

                socket.join(`auction:${aId}`);
                console.log(`User ${userId} joined auction ${aId}`);

                // Send current auction state
                const auction = await getPopulatedAuction(aId);

                io.to(`auction:${aId}`).emit('auction:state', { auction });
                console.log(`State sent for auction ${aId}. Players count: ${auction.players?.length}`);

                // Send current timer state if timer is running
                if (auction.timer && auction.timer.isRunning) {
                    const elapsed = Math.floor((Date.now() - new Date(auction.timer.startedAt)) / 1000);
                    const remaining = Math.max(0, 10 - elapsed);
                    console.log(`[Join] Sending timer state to ${userId}: ${remaining}s remaining`);
                    socket.emit('auction:timer-update', {
                        remaining,
                        isRunning: remaining > 0
                    });
                }

                // Notify others that a user joined
                socket.to(`auction:${aId}`).emit('user:joined', {
                    userId,
                    socketId: socket.id
                });
            } catch (error) {
                console.error('Error joining auction:', error);
                socket.emit('error', { message: 'Failed to join auction' });
            }
        });

        // Leave auction room
        socket.on('auction:leave', ({ auctionId, userId }) => {
            const aId = str(auctionId);
            socket.leave(`auction:${aId}`);
            socket.to(`auction:${aId}`).emit('user:left', { userId });
            console.log(`User ${userId} left auction ${aId}`);
        });

        // Player selected (auctioneer only)
        socket.on('auction:player-selected', async ({ auctionId, playerId }) => {
            try {
                const aId = str(auctionId);
                const pId = str(playerId);

                if (!(await isAuctioneer(aId))) {
                    console.log(`[Socket] Unauthorized player selection by ${socket.userId}`);
                    return;
                }

                const auctionCheck = await findAnyAuction(aId);
                // STRICT LOGIC: Cannot select new player if auction is currently ACTIVE (i.e. has a current player)
                // Exception: If somehow currentPlayer is set but status is IDLE, allow it (recovery)
                if (auctionCheck.currentPlayer && auctionCheck.status === 'ACTIVE') {
                    console.log(`[Socket] Selection Rejected: Auction ${aId} is ACTIVE with player ${auctionCheck.currentPlayer}`);
                    socket.emit('error', { message: 'Cannot select player while auction is active!' });
                    return;
                }

                const player = await RoomPlayer.findById(pId);
                if (!player) return;

                await updateAnyAuction(
                    aId,
                    {
                        currentPlayer: pId,
                        status: 'ACTIVE',
                        currentBid: {
                            amount: player.basePrice,
                            team: null,
                            placedBy: null
                        }
                    }
                );

                // OPTIMIZATION: Lightweight emit
                // We still need 'auction' structure for some frontend compat, but we can make it lighter 
                // OR just trust the frontend to receive { player } and update local state.
                // For safety, let's just emit the player and let frontend switch state.
                // const auction = await getPopulatedAuction(aId); // AVOID THIS EXPENSIVE CALL

                io.to(`auction:${aId}`).emit('auction:player-selected', {
                    player,
                    // auction // REMOVED
                });
            } catch (error) {
                console.error('Error selecting player:', error);
            }
        });

        // Timer Trigger (for Final Call - 10s)
        socket.on('auction:timer-trigger', async ({ auctionId }) => {
            try {
                const aId = str(auctionId);
                console.log(`[Timer] Triggering 10s countdown for: ${aId}`);

                if (!(await isAuctioneer(aId))) {
                    console.log(`[Socket] Unauthorized timer trigger by ${socket.userId}`);
                    return;
                }

                const auction = await findAnyAuction(aId);
                if (!auction || !auction.currentPlayer) {
                    console.log(`[Timer] Cannot start timer: no current player in auction ${aId}`);
                    return;
                }

                let remaining = 10;
                await updateAnyAuction(aId, {
                    'timer.remaining': remaining,
                    'timer.isRunning': true,
                    'timer.startedAt': new Date()
                });

                if (timerIntervals[aId]) clearInterval(timerIntervals[aId]);

                timerIntervals[aId] = setInterval(async () => {
                    remaining--;
                    console.log(`[Timer] ${aId} -> ${remaining}s`);

                    // Sync to all in room
                    io.to(`auction:${aId}`).emit('auction:timer-update', {
                        remaining,
                        isRunning: remaining > 0
                    });

                    if (remaining <= 0) {
                        clearInterval(timerIntervals[aId]);
                        delete timerIntervals[aId];
                        console.log(`[Timer] Finishing auction: ${aId}`);

                        const finalAuction = await findAnyAuction(aId);
                        if (finalAuction && finalAuction.currentBid?.team) {
                            await handleSold(aId, finalAuction.currentPlayer, finalAuction.currentBid.team, finalAuction.currentBid.amount);
                        } else {
                            await handleUnsold(aId, finalAuction.currentPlayer);
                        }
                    }
                }, 1000);

                io.to(`auction:${aId}`).emit('auction:timer-started', { duration: 10 });
                io.to(`auction:${aId}`).emit('auction:timer-update', { remaining: 10, isRunning: true });
            } catch (error) { console.error('[Timer] Error:', error); }
        });

        // Manual Timer Stop/Reset
        socket.on('auction:timer-stop', async ({ auctionId }) => {
            try {
                const aId = str(auctionId);
                if (!(await isAuctioneer(aId))) return;
                await updateAnyAuction(aId, { 'timer.isRunning': false, 'timer.remaining': 0 });
                if (timerIntervals[aId]) { clearInterval(timerIntervals[aId]); delete timerIntervals[aId]; }
                io.to(`auction:${aId}`).emit('auction:timer-update', { remaining: 0, isRunning: false });
            } catch (error) { console.error('Error stopping timer:', error); }
        });


        // New bid placed
        socket.on('auction:bid-placed', async ({ auctionId, amount, teamId }) => {
            try {
                const aId = str(auctionId);
                const tId = str(teamId);
                const auction = await findAnyAuction(aId);
                const team = await Team.findById(tId);
                if (!auction || !team) return;

                const currentBid = auction.currentBid.amount || 0;

                // Validation 1: Prevent bidding against yourself
                if (auction.currentBid.team && str(auction.currentBid.team) === tId) {
                    console.log(`[Bid] Rejected: Team ${team.name} tried to bid against themselves`);
                    socket.emit('bid:error', { message: 'You cannot bid against yourself' });
                    return;
                }

                // Validation 2: Check if bid is higher than current
                if (amount <= currentBid) {
                    console.log(`[Bid] Rejected: ${amount} <= ${currentBid}`);
                    socket.emit('bid:error', { message: 'Bid must be higher than current bid' });
                    return;
                }

                // Validation 3: Check minimum increment (dynamic based on price)
                const getDynamicIncrement = (bidLakhs) => {
                    const bidCr = bidLakhs / 100;
                    if (bidCr < 2) return 10;
                    if (bidCr < 5) return 25;
                    if (bidCr < 10) return 50;
                    return 100;
                };
                const requiredIncrement = getDynamicIncrement(currentBid);
                if (amount < currentBid + requiredIncrement) {
                    console.log(`[Bid] Rejected: Increment too small. Need +${requiredIncrement}L`);
                    socket.emit('bid:error', { message: `Minimum increment: ${requiredIncrement} Lakhs` });
                    return;
                }

                // Validation 4: Check if team can afford
                if (!team.canAfford(amount)) {
                    console.log(`[Bid] Rejected: Team ${team.name} cannot afford ${amount}L`);
                    socket.emit('bid:error', { message: 'Insufficient purse' });
                    return;
                }

                // Validation 5: Check squad size limit (maximum 25 players)
                const currentSquadSize = team.players ? team.players.length : 0;
                if (currentSquadSize >= 25) {
                    console.log(`[Bid] Rejected: Squad full for ${team.name}`);
                    socket.emit('bid:error', { message: `Squad full! Maximum 25 players allowed.` });
                    return;
                }

                // All validations passed - accept bid
                auction.currentBid = { amount, team: team._id, placedBy: team.owner };

                // PAUSE TIMER on bid
                if (timerIntervals[aId]) { clearInterval(timerIntervals[aId]); delete timerIntervals[aId]; }
                auction.timer.isRunning = false;
                auction.timer.remaining = 0;
                await auction.save();

                // Create Bid History Record
                await Bid.create({
                    auction: aId,
                    player: auction.currentPlayer,
                    team: team._id,
                    bidder: team.owner, // Using team owner as bidder
                    amount
                });

                // OPTIMIZATION: Lightweight Emit
                // const updatedAuction = await getPopulatedAuction(aId); // AVOID

                io.to(`auction:${aId}`).emit('auction:timer-update', { remaining: 0, isRunning: false });
                io.to(`auction:${aId}`).emit('auction:bid-placed', {
                    amount,
                    teamId: team._id,
                    teamName: team.name,
                    timestamp: new Date()
                    // REMOVED: auction: updatedAuction
                });

                console.log(`[Bid] Accepted: ${team.name} bid ${amount}L`);
            } catch (error) { console.error('Error broadcasting bid:', error); }
        });

        // Manual actions
        socket.on('auction:player-sold', async ({ auctionId, playerId, teamId, price }) => {
            try {
                if (!(await isAuctioneer(str(auctionId)))) return;
                await handleSold(auctionId, playerId, teamId, price);
            } catch (error) { }
        });
        socket.on('auction:player-unsold', async ({ auctionId, playerId }) => {
            try {
                if (!(await isAuctioneer(str(auctionId)))) return;
                await handleUnsold(auctionId, playerId);
            } catch (error) { }
        });

        // Auction reset (auctioneer only)
        socket.on('auction:reset', async ({ auctionId }) => {
            const aId = str(auctionId);
            if (!(await isAuctioneer(aId))) return;

            if (timerIntervals[aId]) {
                clearInterval(timerIntervals[aId]);
                delete timerIntervals[aId];
            }

            io.to(`auction:${aId}`).emit('auction:reset');
        });

        // Disconnect
        socket.on('disconnect', () => {
            console.log(`❌ Socket disconnected: ${socket.id}`);
            // Note: Timer intervals are cleaned up when auction completes or timer expires
            // We don't clean up on individual disconnects to allow timer to continue for other users
        });
    });

    // Clean up function for completed auctions
    const cleanupAuction = (auctionId) => {
        const aId = str(auctionId);
        if (timerIntervals[aId]) {
            clearInterval(timerIntervals[aId]);
            delete timerIntervals[aId];
            console.log(`[Cleanup] Removed timer interval for auction: ${aId}`);
        }
    };
};

export default setupSocketHandlers;
