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
    const [userRole, setUserRole] = useState(() => sessionStorage.getItem('userRole'));

    // Game/Room State - NO PERSISTENCE (must join fresh every time)
    const [roomData, setRoomData] = useState({
        roomId: null,
        budget: 0,
        isActive: false,
        teams: [],
        players: [],
        auctionId: null
    });

    // Current User (Contestant/Manager)
    const [currentUser, setCurrentUser] = useState(() => {
        // Priority 1: Game-specific user state
        const saved = sessionStorage.getItem('currentUser');
        if (saved) return JSON.parse(saved);

        // Priority 2: Auth user state (Login persistence)
        const authUserS = sessionStorage.getItem('authUser');
        if (authUserS) {
            const user = JSON.parse(authUserS);
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


            // AUTO-REJOIN on Reconnect
            // If socket disconnected and reconnected, we must re-emit join using refs
            const { auctionId, userId } = connectionRef.current;
            if (auctionId && userId) {
                socket.emit('auction:join', { auctionId, userId });
            }
        }

        function onDisconnect() {

        }

        function onAuctionState(data) {
            // Full Sync
            if (data && data.auction) {
                updateLocalState(data.auction);
            }
        }

        function onBidPlaced({ amount, teamId, teamName, auction }) {
            if (auction) {
                updateLocalState(auction);
            } else {
                // Optimistic / Lightweight Update
                setAuctionState(prev => ({
                    ...prev,
                    currentBid: amount,
                    currentBidder: teamId,
                    isBiddingActive: true
                }));
            }
        }

        function onPlayerSelected({ player, auction }) {
            // Clear any sold/unsold announcement when new player is selected
            setLastSoldPlayer(null);

            if (auction) {
                // Legacy / Full Sync path
                if (!auction.currentPlayer && player) {
                    auction.currentPlayer = player;
                    if (auction.status === 'IDLE') auction.status = 'ACTIVE';
                }
                updateLocalState(auction);
            } else {
                // Lightweight Path
                setAuctionState(prev => ({
                    ...prev,
                    currentPlayer: player,
                    currentBid: player.basePrice,
                    currentBidder: null, // Reset bidder
                    isBiddingActive: true
                }));
            }
        }

        function onPlayerSold({ player, team, price, auction }) {

            if (auction) {
                updateLocalState(auction);
            } else {
                // Lightweight Path: Manually update local state
                // 1. Update Team Purse & functionality (Add player to team list in UI)
                setRoomData(prev => ({
                    ...prev,
                    // 1. Update Teams (Purse & Squad)
                    teams: prev.teams.map(t => {
                        if (t._id === team._id || t.id === team._id) {
                            return {
                                ...t,
                                currentPurse: team.currentPurse,
                                players: [
                                    ...(t.players || []),
                                    { player: player, boughtPrice: price / 100 }
                                ]
                            };
                        }
                        return t;
                    }),
                    // 2. Update Player Status in Master List
                    players: (prev.players || []).map(p => {
                        if ((p._id || p.id) === (player._id || player.id)) {
                            return {
                                ...p,
                                status: 'SOLD',
                                soldTo: team._id,
                                soldPrice: price / 100
                            };
                        }
                        return p;
                    })
                }));
            }

            // Store last sold player for announcement
            setLastSoldPlayer({ player, team, price });

            // Reset auction state
            setAuctionState({
                currentPlayer: null,
                currentBid: 0,
                currentBidder: null,
                isBiddingActive: false,
                history: []
            });
        }

        function onPlayerUnsold({ player, auction }) {
            if (auction) {
                updateLocalState(auction);
            } else {
                // Lightweight Path
                setRoomData(prev => ({
                    ...prev,
                    players: prev.players.map(p => {
                        if ((p._id || p.id) === (player._id || player.id)) {
                            return { ...p, status: 'UNSOLD' };
                        }
                        return p;
                    })
                }));
            }

            // Store unsold player for announcement
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
            // Minimal action or toast
        }

        function onSocketError(err) {

            alert(`⚠️ ${err.message || 'Auction Error'}`);
        }

        function onTimerUpdate({ remaining, isRunning }) {
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
            refreshState();
        });
        socket.on('auction:toast', ({ message }) => {
            alert(message); // Simple alert for now, can be replaced with better toast
        });
        socket.on('bid:error', ({ message }) => {
            alert(`⚠️ Bid Failed: ${message}`);
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
            socket.off('bid:error');
        };
    }, []);

    // Auto-Rejoin logic removed to ensure users always start at Welcome Screen
    // and must explicitly rejoin a room.

    // Persistence hooks removed - application state is now ephemeral and tab-bound via sessionStorage

    // Helper to map backend data to frontend state
    const updateLocalState = (auction) => {

        if (auction.players?.length > 0) {
        }

        setRoomData(prev => ({
            ...prev,
            roomId: auction.roomId,
            auctionId: auction._id,
            budget: auction.budget || auction.settings?.initialPurse || 0,
            teams: auction.teams || [],
            players: auction.players || [],
            isActive: true
        }));

        // Log immediately after to see if state update is queued

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
        // Clear session storage for game-specific data
        sessionStorage.removeItem('roomData');
        sessionStorage.removeItem('currentUser');
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
                const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
                setCurrentUser({ userId: authUser.id });
                // Connect Socket
                socket.connect();
                socket.emit('auction:join', { auctionId: data.auctionId, userId: authUser.id || 'MANAGER' });
                return true;
            }
        } catch (error) {

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

            const data = await rejoinTeamAPI(roomId, teamName, password);
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
                setUserRole('CONTESTANT');

                // Update role in session if returned
                const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
                if (data.newRole) {
                    authUser.role = data.newRole;
                    sessionStorage.setItem('authUser', JSON.stringify(authUser));
                }

                // Connect Socket and wait for connection
                if (!socket.connected) {
                    socket.connect();

                    // Wait for socket to connect before joining room
                    await new Promise((resolve) => {
                        if (socket.connected) {
                            resolve();
                        } else {
                            socket.once('connect', () => {
                                resolve();
                            });
                        }
                    });
                }

                socket.emit('auction:join', { auctionId: data.auctionId, userId: data.userId });
                return true;
            }
        } catch (error) {

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
                const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

                // Update role in session if returned
                if (data.newRole) {
                    authUser.role = data.newRole;
                    sessionStorage.setItem('authUser', JSON.stringify(authUser));
                }

                setCurrentUser({ userId: authUser.id || authUser._id, role: authUser.role });
                // Connect Socket
                socket.connect();
                socket.emit('auction:join', { auctionId: data.auctionId, userId: authUser.id || authUser._id || 'MANAGER' });
                return data.roomId;
            }
        } catch (error) {

            throw error;
        }
    };

    const joinGame = async (roomId, teamName, email, password) => {
        try {
            // Clear old state before joining room
            clearSessionState();

            const data = await joinGameAPI(roomId, teamName, email, password);
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
                setUserRole('CONTESTANT');

                // Update role in session if returned
                const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
                if (data.newRole) {
                    authUser.role = data.newRole;
                    sessionStorage.setItem('authUser', JSON.stringify(authUser));
                }

                // Connect Socket and wait for connection
                if (!socket.connected) {
                    socket.connect();

                    // Wait for socket to connect before joining room
                    await new Promise((resolve) => {
                        if (socket.connected) {
                            resolve();
                        } else {
                            socket.once('connect', () => {
                                resolve();
                            });
                        }
                    });
                }

                socket.emit('auction:join', { auctionId: data.auctionId, userId: data.userId });
                return true;
            }
        } catch (error) {

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
            if (!player._id) {

                alert('Internal Error: Player ID missing. Cannot select.');
                return;
            }
            socket.emit('auction:player-selected', {
                auctionId: roomData.auctionId,
                playerId: player._id
            });
        } else {

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

        // OPTIMIZATION: If we are already in the requested room with data, DO NOT clear state.
        // Just ensure socket connection.
        if (roomData.roomId && roomData.roomId.toUpperCase() === rId.toUpperCase() && roomData.auctionId) {
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

        // MINI AUCTION FIX: If rId is an ObjectId, it's a direct auction ID, not a room code.
        // Skip API lookup and join socket directly.
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(rId);
        if (isObjectId) {
            // Set auctionId immediately so socket listeners know where to update
            setRoomData(prev => ({
                ...prev,
                auctionId: rId,
                isActive: true
            }));

            if (!socket.connected) socket.connect();

            socket.emit('auction:join', {
                auctionId: rId,
                userId: currentUser?.userId || 'manager'
            });
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

            // Clear all session storage (tab-bound)
            sessionStorage.clear();
        } catch (error) {

            // Even if API call fails, clear local state
            clearSessionState();
            sessionStorage.clear();
            if (socket.connected) {
                socket.disconnect();
            }
        }
    };

    const leaveGame = () => {
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
        sessionStorage.removeItem('roomData');
        sessionStorage.removeItem('roomDataTimestamp');

        // Reset currentUser to base Auth Identity (remove team context)
        const authUserString = sessionStorage.getItem('authUser');
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
