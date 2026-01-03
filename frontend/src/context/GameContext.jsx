import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
    createGameAPI, joinGameAPI, resumeGameAPI, rejoinTeamAPI, logoutAPI, releasePlayerAPI, proposeTradeAPI,
    getMyTradesAPI,
    respondToTradeAPI,
    searchGlobalPlayersAPI,
    activateGlobalPlayerAPI
} from '../services/api';
import { socket } from '../services/socket';

const GameContext = createContext();

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};

export const GameProvider = ({ children }) => {
    // User Role: 'MANAGER' | 'CONTESTANT' | null
    const [userRole, setUserRole] = useState(() => localStorage.getItem('userRole'));

    // Game/Room State
    const [roomData, setRoomData] = useState(() => {
        const saved = localStorage.getItem('roomData');
        const defaults = {
            roomId: null,
            budget: 0,
            isActive: false,
            teams: [],
            players: [],
            auctionId: null
        };
        return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
    });

    // Current User (Contestant/Manager)
    const [currentUser, setCurrentUser] = useState(() => {
        // Priority 1: Game-specific user state
        const saved = localStorage.getItem('currentUser');
        if (saved) return JSON.parse(saved);

        // Priority 2: Auth user state (Login persistence)
        const authUser = localStorage.getItem('authUser');
        if (authUser) {
            const user = JSON.parse(authUser);
            // Adapt authUser to currentUser structure
            return {
                userId: user.id || user._id, // Handle both formats
                email: user.email,
                name: user.name,
                teamId: user.teamId // If available in authUser
            };
        }
        return null;
    }); // { teamName, teamId, userId }

    const [auctionState, setAuctionState] = useState({
        currentPlayer: null,
        currentBid: 0,
        currentBidder: null, // teamId
        isBiddingActive: false,
        history: [],
    });

    // REFS to store latest state for Socket Reconnection logic (closure workaround)
    const connectionRef = useRef({ auctionId: null, userId: null });

    // Keep refs in sync with state
    useEffect(() => {
        connectionRef.current.auctionId = roomData.auctionId;
    }, [roomData.auctionId]);

    useEffect(() => {
        // Resolve best user ID
        const uid = currentUser?.userId || currentUser?.id || currentUser?._id;
        if (uid) connectionRef.current.userId = uid;
    }, [currentUser]);

    const [timerState, setTimerState] = useState({ remaining: 0, isRunning: false });

    // Track last sold player for announcement
    const [lastSoldPlayer, setLastSoldPlayer] = useState(null); // { player, team, price }

    // Socket Event Listeners
    useEffect(() => {
        function onConnect() {
            console.log('✅ Socket Connected!', { role: userRole });

            // AUTO-REJOIN on Reconnect
            // If socket disconnected and reconnected, we must re-emit join using refs
            const { auctionId, userId } = connectionRef.current;
            if (auctionId && userId) {
                console.log('🔄 Re-joining auction after reconnect:', auctionId);
                socket.emit('auction:join', { auctionId, userId });
            }
        }

        function onDisconnect() {
            console.log('❌ Socket Disconnected');
        }

        function onAuctionState(data) {
            console.log('📦 Received auction:state', { hasAuction: !!data?.auction, timerState: data?.auction?.timer });
            // Full Sync
            if (data && data.auction) {
                updateLocalState(data.auction);
            }
        }

        function onBidPlaced({ amount, teamId, teamName, auction }) {
            if (auction) {
                updateLocalState(auction);
            } else {
                setAuctionState(prev => ({
                    ...prev,
                    currentBid: amount,
                    currentBidder: teamId
                }));
            }
        }

        function onPlayerSelected({ player, auction }) {
            // Clear any sold/unsold announcement when new player is selected
            setLastSoldPlayer(null);

            if (auction) {
                // ROBUSTNESS FIX: If backend population failed (schema mismatch) but we have the direct player object
                if (!auction.currentPlayer && player) {
                    console.warn('⚠️ auction.currentPlayer missing in payload, using direct player object fallback', player);
                    auction.currentPlayer = player;
                    // Also ensure status is Active if we have a player
                    if (auction.status === 'IDLE') auction.status = 'ACTIVE';
                }
                updateLocalState(auction);
            } else {
                setAuctionState(prev => ({
                    ...prev,
                    currentPlayer: player,
                    currentBid: player.basePrice,
                    currentBidder: null,
                    isBiddingActive: true
                }));
            }
        }

        function onPlayerSold({ player, team, price, auction }) {
            console.log('[onPlayerSold] Player sold:', player.name, 'Price:', price, 'Team:', team.name);

            // Update local state from auction (this already includes the sold player in teams)
            if (auction) updateLocalState(auction);

            // Store last sold player for announcement (stays until new player selected)
            setLastSoldPlayer({ player, team, price });

            // Reset auction state for next player
            setAuctionState({
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isBiddingActive: false,
                history: []
            });
        }

        function onPlayerUnsold({ player, auction }) {
            if (auction) updateLocalState(auction);

            // Store unsold player for announcement (stays until new player selected)
            setLastSoldPlayer({ player, team: null, price: 0, isUnsold: true });

            setAuctionState({
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isBiddingActive: false,
                history: []
            });
        }

        function onUserJoined({ userId }) {
            // Ideally fetch updated teams list, or just wait for next sync
            // For now, minimal action or toast
            console.log('User joined:', userId);
        }

        function onSocketError(err) {
            console.error('Socket Error:', err);
            alert(`⚠️ ${err.message || 'Auction Error'}`);
        }

        function onTimerUpdate({ remaining, isRunning }) {
            console.log(`⏱️ [Socket] Timer Update: ${remaining}s (isRunning: ${isRunning})`, { role: userRole });
            setTimerState({ remaining, isRunning });
        }

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('auction:state', onAuctionState);
        socket.on('auction:bid-placed', onBidPlaced);
        socket.on('auction:player-selected', onPlayerSelected);
        socket.on('auction:player-sold', onPlayerSold);
        socket.on('auction:player-unsold', onPlayerUnsold);
        socket.on('user:joined', onUserJoined);
        socket.on('error', onSocketError);
        socket.on('auction:timer-update', onTimerUpdate);
        socket.on('auction:refresh-request', () => {
            console.log('🔄 Server requested refresh');
            refreshState();
        });
        socket.on('auction:toast', ({ message }) => {
            alert(message); // Simple alert for now, can be replaced with better toast
        });

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('auction:state', onAuctionState);
            socket.off('auction:bid-placed', onBidPlaced);
            socket.off('auction:player-selected', onPlayerSelected);
            socket.off('auction:player-sold', onPlayerSold);
            socket.off('auction:player-unsold', onPlayerUnsold);
            socket.off('user:joined', onUserJoined);
            socket.off('error', onSocketError);
            socket.off('auction:timer-update', onTimerUpdate);
            socket.off('auction:refresh-request');
            socket.off('auction:toast');
        };
    }, []);

    // Auto-Rejoin Logic: If we have an auctionId in storage, join the room on mount
    useEffect(() => {
        const savedRoomData = localStorage.getItem('roomData');
        if (savedRoomData) {
            try {
                const parsed = JSON.parse(savedRoomData);

                // Validation: check if data is stale (older than 24 hours)
                const savedTimestamp = localStorage.getItem('roomDataTimestamp');
                if (savedTimestamp) {
                    const age = Date.now() - parseInt(savedTimestamp);
                    const MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours
                    if (age > MAX_AGE) {
                        console.log('🧹 Clearing stale localStorage (>24h old)');
                        localStorage.removeItem('roomData');
                        localStorage.removeItem('roomDataTimestamp');
                        return;
                    }
                }

                if (parsed.auctionId) {
                    setRoomData(parsed);

                    // Resolve userId: either from currentUser, or from authUser directly
                    let userId = currentUser?.userId || currentUser?.id || currentUser?._id;
                    if (!userId) {
                        try {
                            const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
                            userId = authUser.id || authUser._id;
                        } catch (e) {
                            console.error("Error parsing authUser for socket", e);
                        }
                    }
                    userId = userId || 'MANAGER';

                    const joinPayload = { auctionId: parsed.auctionId, userId };

                    if (socket.connected) {
                        console.log('🔌 Socket already connected, joining immediately', joinPayload);
                        socket.emit('auction:join', joinPayload);
                    } else {
                        console.log('🔌 Socket connecting... waiting to join', joinPayload);
                        socket.connect();
                        // Remove any existing one-time listener to avoid duplicates if effect re-runs
                        socket.off('connect');
                        socket.once('connect', () => {
                            console.log('✅ Socket connected (delayed), joining now', joinPayload);
                            socket.emit('auction:join', joinPayload);
                        });
                    }

                    console.log('✅ Auto-rejoin logic initiated for:', parsed.auctionId);
                }
            } catch (err) {
                console.error("Error parsing saved roomData", err);
                // process.env.NODE_ENV === 'development' && alert("Session Error: " + err.message);
                // localStorage.removeItem('roomData'); // Temporarily disable clearing to debug
            }
        }
    }, [currentUser]); // currentUser check ensures we have the ID to join with

    // Update persistence when role/user/room changes
    useEffect(() => {
        if (userRole) localStorage.setItem('userRole', userRole);
        else localStorage.removeItem('userRole');
    }, [userRole]);

    useEffect(() => {
        if (currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        } else {
            // If currentUser is null, check if we have authUser and should restore it
            const authUser = localStorage.getItem('authUser');
            if (authUser) {
                const user = JSON.parse(authUser);
                const restoredUser = {
                    userId: user.id,
                    email: user.email,
                    name: user.name,
                    teamId: user.teamId
                };
                setCurrentUser(restoredUser);
                // Don't remove 'currentUser' from storage here, strict sync handled above
            } else {
                localStorage.removeItem('currentUser');
            }
        }
    }, [currentUser]);

    useEffect(() => {
        if (roomData.auctionId) {
            localStorage.setItem('roomData', JSON.stringify(roomData));
            localStorage.setItem('roomDataTimestamp', Date.now().toString());
        }
    }, [roomData]);

    // Helper to map backend data to frontend state
    const updateLocalState = (auction) => {
        console.log('🔄 updateLocalState called', {
            auctionId: auction._id,
            roomId: auction.roomId,
            teamsCount: auction.teams?.length,
            teamNames: auction.teams?.map(t => ({ name: t.name, auctionId: t.auctionId })),
            rawTeams: auction.teams
        });

        console.log('📊 Setting roomData with players:', auction.players?.length);
        if (auction.players?.length > 0) {
            console.log('First player sample:', auction.players[0]);
        }

        setRoomData(prev => ({
            ...prev,
            roomId: auction.roomId,
            auctionId: auction._id,
            budget: auction.settings.initialPurse,
            teams: auction.teams || [],
            players: auction.players || [],
            isActive: true
        }));

        // Log immediately after to see if state update is queued
        console.log('✅ roomData setState called. Teams:', auction.teams?.length);

        // If auction has active bid/player state, sync it
        if (auction.currentPlayer) {
            setAuctionState({
                currentPlayer: auction.currentPlayer,
                currentBid: auction.currentBid?.amount || auction.currentPlayer.basePrice,
                currentBidder: auction.currentBid?.team?._id || auction.currentBid?.team,
                isBiddingActive: auction.status !== 'PAUSED'
            });
        } else {
            // CRITICAL: If no current player, reset auction state to avoid leakage from previous rooms
            setAuctionState({
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isBiddingActive: false,
                history: []
            });
        }

        // Always check and update timer state (independent of currentPlayer)
        if (auction.timer?.isRunning && auction.timer?.startedAt) {
            const elapsed = Math.floor((Date.now() - new Date(auction.timer.startedAt)) / 1000);
            const remaining = Math.max(0, 10 - elapsed);
            console.log(`[updateLocalState] Setting timer: ${remaining}s (isRunning: ${remaining > 0})`);
            setTimerState({
                remaining,
                isRunning: remaining > 0
            });
        } else {
            setTimerState({ remaining: 0, isRunning: false });
        }
    };

    // Clear all session state when entering a new room
    const clearSessionState = () => {
        setAuctionState({
            currentPlayer: null,
            currentBid: 0,
            currentBidder: null,
            isBiddingActive: false,
            history: []
        });
        setTimerState({ remaining: 0, isRunning: false });
        setLastSoldPlayer(null);
        setRoomData({
            roomId: null,
            auctionId: null,
            budget: 0,
            isActive: false,
            teams: [],
            players: []
        });
        setCurrentUser(null);
        // Clear local storage for room data as well
        localStorage.removeItem('roomData');
        localStorage.removeItem('currentUser');
    };

    const resumeGame = async (roomId, password) => {
        try {
            // Clear old state before entering new room
            clearSessionState();

            const data = await resumeGameAPI(roomId, password);
            if (data.success) {
                setRoomData({
                    roomId: roomId,
                    auctionId: data.auctionId,
                    budget: data.budget,
                    isActive: true,
                    teams: [], // Ideally fetch teams too, but socket will sync
                    players: [] // Clear old players
                });
                setUserRole('MANAGER');
                const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
                setCurrentUser({ userId: authUser.id });
                // Connect Socket
                socket.connect();
                socket.emit('auction:join', { auctionId: data.auctionId, userId: authUser.id || 'MANAGER' });
                return true;
            }
        } catch (error) {
            console.error("Resume Game Failed", error);
            throw error;
        }
    };

    const releasePlayer = async (teamId, playerId) => {
        try {
            // Optimistic update could be done here, but safer to wait for response
            const data = await releasePlayerAPI(roomData.roomId, teamId, playerId);
            if (data.success) {
                // Update local state: remove player from squad, update purse
                // But honestly, socket should handle this sync for everyone.
                // For now, manual update:
                setRoomData(prev => ({
                    ...prev,
                    teams: prev.teams.map(t => {
                        if (t._id === teamId || t.id === teamId) {
                            return {
                                ...t,
                                currentPurse: data.teamPurse,
                                players: (t.players || []).filter(p => (p.player?._id || p.player || p) !== playerId)
                            };
                        }
                        return t;
                    })
                }));
                return true;
            }
        } catch (error) {
            console.error("Release Player Failed", error);
            throw error;
        }
    };

    const proposeTrade = async (tradeData) => {
        return await proposeTradeAPI({ ...tradeData, roomId: roomData.roomId });
    };

    const getMyTrades = async (teamId) => {
        return await getMyTradesAPI(teamId);
    };

    const respondToTrade = async (tradeId, status) => {
        return await respondToTradeAPI(tradeId, status);
    };

    const rejoinTeam = async (roomId, teamName, password) => {
        try {
            // Clear old state before entering room
            clearSessionState();

            console.log('🔄 Rejoining team...', { roomId, teamName });
            const data = await rejoinTeamAPI(roomId, teamName, password);
            console.log('📥 Rejoin API response:', data);
            if (data.success) {
                setCurrentUser({
                    teamName,
                    teamId: data.teamId,
                    userId: data.userId
                });
                setRoomData(prev => ({
                    ...prev,
                    auctionId: data.auctionId,
                    roomId: roomId,
                    budget: data.purse,
                    isActive: true,
                    teams: [],
                    players: []
                }));
                console.log('✅ Room data set:', { auctionId: data.auctionId, roomId });
                setUserRole('CONTESTANT');

                // Connect Socket and wait for connection
                if (!socket.connected) {
                    console.log('🔌 Connecting socket...');
                    socket.connect();

                    // Wait for socket to connect before joining room
                    await new Promise((resolve) => {
                        if (socket.connected) {
                            resolve();
                        } else {
                            socket.once('connect', () => {
                                console.log('✅ Socket connected!');
                                resolve();
                            });
                        }
                    });
                }

                console.log('📡 Emitting auction:join', { auctionId: data.auctionId, userId: data.userId });
                socket.emit('auction:join', { auctionId: data.auctionId, userId: data.userId });
                return true;
            }
        } catch (error) {
            console.error('❌ Rejoin Team Failed', error);
            throw error;
        }
    };

    const createGame = async (budget, password) => {
        try {
            // Clear old state before creating new game
            clearSessionState();

            const data = await createGameAPI(budget, password);
            if (data.success) {
                setRoomData({
                    roomId: data.roomId,
                    auctionId: data.auctionId,
                    budget: data.budget,
                    isActive: true,
                    teams: [],
                    players: []
                });
                setUserRole('MANAGER');
                const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
                setCurrentUser({ userId: authUser.id });
                // Connect Socket
                socket.connect();
                socket.emit('auction:join', { auctionId: data.auctionId, userId: authUser.id || 'MANAGER' });
                return data.roomId;
            }
        } catch (error) {
            console.error("Create Game Failed", error);
            throw error;
        }
    };

    const joinGame = async (roomId, teamName, email, password) => {
        try {
            // Clear old state before joining room
            clearSessionState();

            console.log('🎮 Joining game...', { roomId, teamName });
            const data = await joinGameAPI(roomId, teamName, email, password);
            console.log('📥 Join API response:', data);
            if (data.success) {
                setCurrentUser({
                    teamName,
                    teamId: data.teamId,
                    userId: data.userId
                });
                setRoomData(prev => ({
                    ...prev,
                    auctionId: data.auctionId,
                    roomId: roomId,
                    budget: data.purse || 100,
                    isActive: true,
                    teams: [],
                    players: []
                }));
                console.log('✅ Room data set:', { auctionId: data.auctionId, roomId });
                setUserRole('CONTESTANT');

                // Connect Socket and wait for connection
                if (!socket.connected) {
                    console.log('🔌 Connecting socket...');
                    socket.connect();

                    // Wait for socket to connect before joining room
                    await new Promise((resolve) => {
                        if (socket.connected) {
                            resolve();
                        } else {
                            socket.once('connect', () => {
                                console.log('✅ Socket connected!');
                                resolve();
                            });
                        }
                    });
                }

                console.log('📡 Emitting auction:join', { auctionId: data.auctionId, userId: data.userId });
                socket.emit('auction:join', { auctionId: data.auctionId, userId: data.userId });
                return true;
            }
        } catch (error) {
            console.error('❌ Join Game Failed', error);
            throw error;
        }
    };

    const placeBid = (amount, teamId) => {
        if (roomData.auctionId) {
            socket.emit('auction:bid-placed', {
                auctionId: roomData.auctionId,
                amount,
                teamId
            });
        }
    };

    const startTurn = (player) => {
        // Just emit selection, backend handles state
        if (roomData.auctionId) {
            console.log('📡 [startTurn] Emitting auction:player-selected', {
                auctionId: roomData.auctionId,
                playerId: player._id,
                playerName: player.name
            });
            if (!player._id) {
                console.error('❌ [startTurn] Player ID is missing!', player);
                alert('Internal Error: Player ID missing. Cannot select.');
                return;
            }
            socket.emit('auction:player-selected', {
                auctionId: roomData.auctionId,
                playerId: player._id
            });
        } else {
            console.error('❌ [startTurn] No auctionId found in roomData');
        }
    };

    const searchGlobalPlayers = async (query) => {
        return await searchGlobalPlayersAPI(query);
    };

    const activateGlobalPlayer = async (playerId) => {
        try {
            const data = await activateGlobalPlayerAPI(playerId, roomData.auctionId);
            if (data.success) {
                // Return the new player object
                return data.player;
            }
        } catch (error) {
            console.error("Activate Player Failed", error);
            throw error;
        }
    };

    const sellPlayer = () => {
        // Logic requires knowledge of teamId and price. 
        // Ideally backend tracks "currentBid", so we just say "Confirm Sell"
        // But our socket handler expects args. 
        // We'll trust `auctionState` matches backend.
        if (roomData.auctionId && auctionState.currentBidder) {
            socket.emit('auction:player-sold', {
                auctionId: roomData.auctionId,
                playerId: auctionState.currentPlayer._id || auctionState.currentPlayer.id,
                teamId: auctionState.currentBidder,
                price: auctionState.currentBid
            });
        }
    };

    const unsoldPlayer = () => {
        if (roomData.auctionId) {
            socket.emit('auction:player-unsold', {
                auctionId: roomData.auctionId,
                playerId: auctionState.currentPlayer._id || auctionState.currentPlayer.id
            });
        }
    };

    const refreshState = (specificRoomId = null) => {
        const rId = specificRoomId || roomData.roomId;
        if (!rId) return;

        console.log(`[GameContext] refreshState requested for: ${rId}`);

        console.log(`[GameContext] refreshState requested for: ${rId}`);

        // OPTIMIZATION: If we are already in the requested room with data, DO NOT clear state.
        // Just ensure socket connection.
        if (roomData.roomId && roomData.roomId.toUpperCase() === rId.toUpperCase() && roomData.auctionId) {
            console.log('[GameContext] Already in correct room, skipping state clear. Ensuring socket...');
            if (socket.connected) {
                socket.emit('auction:join', {
                    auctionId: roomData.auctionId,
                    userId: currentUser?.userId || 'manager'
                });
            } else {
                socket.connect();
                socket.emit('auction:join', {
                    auctionId: roomData.auctionId,
                    userId: currentUser?.userId || 'manager'
                });
            }
            return;
        }

        // CRITICAL: Clear current view state before loading fresh state from another room
        clearSessionState();

        // If we have an auctionId and it matches, just re-join (fallback for partial state)
        if (roomData.auctionId && (!specificRoomId || specificRoomId === roomData.roomId)) {
        } else {
            // Need to fetch auction details by roomId because we don't have the internal ID
            // We'll use resumeGame logic internally to sync
            resumeGameAPI(rId, '') // Empty password because we are likely already auth'd or it will fail safely
                .then(res => {
                    const data = res.data;
                    setRoomData(prev => ({
                        ...prev,
                        roomId: rId,
                        auctionId: data.auctionId,
                        budget: data.budget,
                        isActive: true
                    }));
                    socket.emit('auction:join', { auctionId: data.auctionId, userId: currentUser?.userId || 'manager' });
                })
                .catch(err => console.error("Refresh failed (needs re-auth?):", err));
        }
    };

    const triggerTimer = () => {
        if (roomData.auctionId) {
            setTimerState({ remaining: 10, isRunning: true });
            socket.emit('auction:timer-trigger', {
                auctionId: roomData.auctionId
            });
        }
    };

    const stopTimer = () => {
        if (roomData.auctionId) {
            socket.emit('auction:timer-stop', {
                auctionId: roomData.auctionId
            });
        }
    };

    const logout = async () => {
        try {
            // Call backend logout endpoint
            await logoutAPI();

            // Clear session state
            clearSessionState();

            // Disconnect socket
            if (socket.connected) {
                socket.disconnect();
            }

            // Clear all local storage
            localStorage.removeItem('authUser');
            localStorage.removeItem('authToken');
            localStorage.removeItem('roomData');
            localStorage.removeItem('currentUser');

            console.log('✅ Logged out successfully');
        } catch (error) {
            console.error('Logout error:', error);
            // Even if API call fails, clear local state
            clearSessionState();
            localStorage.clear();
            if (socket.connected) {
                socket.disconnect();
            }
        }
    };

    const leaveGame = () => {
        console.log('👋 Leaving game/room...');

        // Disconnect socket
        if (socket.connected) socket.disconnect();

        // Clear room data from state and storage
        setRoomData({
            roomId: null,
            auctionId: null,
            budget: 0,
            isActive: false,
            teams: [],
            players: []
        });
        localStorage.removeItem('roomData');
        localStorage.removeItem('roomDataTimestamp');

        // Reset currentUser to base Auth Identity (remove team context)
        const authUserString = localStorage.getItem('authUser');
        if (authUserString) {
            const authUser = JSON.parse(authUserString);
            setCurrentUser({
                userId: authUser.id || authUser._id,
                email: authUser.email,
                name: authUser.name,
                // teamId is explicitly omitted/removed
            });
        } else {
            // Fallback if no auth user
            logout();
        }
    };

    return (
        <GameContext.Provider value={{
            userRole,
            setUserRole,
            roomData,
            setRoomData,
            currentUser,
            setCurrentUser,
            auctionState,
            setAuctionState,
            createGame,
            resumeGame,
            joinGame,
            rejoinTeam,
            placeBid,
            startTurn,
            sellPlayer,
            unsoldPlayer,
            releasePlayer,
            proposeTrade,
            getMyTrades,
            respondToTrade,
            searchGlobalPlayers,
            activateGlobalPlayer,
            timerState,
            lastSoldPlayer,
            triggerTimer,
            stopTimer,
            refreshState,
            logout,
            leaveGame
        }}>
            {children}
        </GameContext.Provider>
    );
};
