import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import TeamCard from '../components/TeamCard';
import { playerAPI, auctionAPI } from '../services/api';
import socketService from '../services/socket';
import useAuthStore from '../store/authStore';
import useAuctionStore from '../store/auctionStore';
import { animateHammer } from '../utils/animations';
import { pageVariants } from '../utils/animations';

const AuctioneerDashboard = () => {
    const navigate = useNavigate();
    const { user, isAuctioneer } = useAuthStore();
    const {
        auctionId,
        currentPlayer,
        timer,
        teams,
        setAuctionId,
        setCurrentPlayer,
        setTeams,
        updateTimer,
        updateTimerRemaining,
    } = useAuctionStore();

    const [players, setPlayers] = useState([]);
    const [selectedPlayerId, setSelectedPlayerId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [auction, setAuction] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null); // For mobile team modal
    const hammerRef = useRef(null);

    useEffect(() => {
        if (!isAuctioneer()) {
            navigate('/team-owner');
            return;
        }

        initializeAuction();
        loadPlayers();
        loadTeams();
    }, []);

    const initializeAuction = async () => {
        try {
            let auctionData;

            // Try to get existing auction first
            try {
                const response = await auctionAPI.getLatest();
                if (response.data.auction) {
                    auctionData = response.data.auction;
                }
            } catch (err) {
                // If not found (404), we will create one
                console.log('No active auction found, creating new one...');
            }

            // If no existing auction, create one
            if (!auctionData) {
                const response = await auctionAPI.create({
                    name: 'IPL AUCTION ARENA',
                    initialPurse: 100,
                    minBidIncrement: 0.5,
                    timerDuration: 60,
                });
                auctionData = response.data.auction;
            }

            setAuctionId(auctionData._id);
            setAuction(auctionData);

            // Connect to socket
            socketService.disconnect();
            socketService.connect();
            socketService.joinAuction(auctionData._id, user.id);

            // Listen to socket events
            setupSocketListeners(auctionData._id);
        } catch (error) {
            console.error('Error initializing auction:', error);
        }
    };

    const setupSocketListeners = (id) => {
        socketService.on('auction:timer-update', ({ remaining }) => {
            updateTimerRemaining(remaining);
        });

        socketService.on('auction:timer-ended', () => {
            updateTimer({ ...timer, isRunning: false, remaining: 0 });
        });
    };

    const loadPlayers = async () => {
        try {
            const response = await playerAPI.getAll({ status: 'AVAILABLE' });
            setPlayers(response.data.players || []);
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadTeams = async () => {
        try {
            if (auctionId) {
                const response = await auctionAPI.getTeams(auctionId);
                setTeams(response.data.teams || []);
            }
        } catch (error) {
            console.error('Error loading teams:', error);
        }
    };

    const handleSelectPlayer = async (player) => {
        if (!auctionId || player.status !== 'AVAILABLE') return;

        try {
            await auctionAPI.selectPlayer(auctionId, player._id);
            setCurrentPlayer(player);
            setSelectedPlayerId(player._id);

            // Notify via socket
            socketService.selectPlayer(auctionId, player._id);
        } catch (error) {
            console.error('Error selecting player:', error);
        }
    };

    const handleStartTimer = async () => {
        if (!auctionId || !currentPlayer) return;

        try {
            await auctionAPI.startTimer(auctionId);
            socketService.startTimer(auctionId);
        } catch (error) {
            console.error('Error starting timer:', error);
        }
    };

    const handlePauseTimer = async () => {
        if (!auctionId) return;

        try {
            await auctionAPI.pauseTimer(auctionId);
            socketService.pauseTimer(auctionId);
        } catch (error) {
            console.error('Error pausing timer:', error);
        }
    };

    const handleExtendTimer = async (seconds) => {
        if (!auctionId) return;

        try {
            await auctionAPI.extendTimer(auctionId, seconds);
            socketService.extendTimer(auctionId, seconds);
        } catch (error) {
            console.error('Error extending timer:', error);
        }
    };

    const handleMarkSold = async () => {
        if (!auctionId || !currentPlayer) return;

        try {
            if (hammerRef.current) {
                animateHammer(hammerRef.current, async () => {
                    const response = await auctionAPI.markSold(auctionId);
                    socketService.markPlayerSold(auctionId, response.data.player, response.data.team, response.data.player.soldPrice);

                    // Reload data
                    loadPlayers();
                    loadTeams();
                    setCurrentPlayer(null);
                    setSelectedPlayerId(null);
                });
            }
        } catch (error) {
            console.error('Error marking sold:', error);
        }
    };

    const handleMarkUnsold = async () => {
        if (!auctionId || !currentPlayer) return;

        try {
            if (hammerRef.current) {
                animateHammer(hammerRef.current, async () => {
                    const response = await auctionAPI.markUnsold(auctionId);
                    socketService.markPlayerUnsold(auctionId, response.data.player);

                    // Reload data
                    loadPlayers();
                    setCurrentPlayer(null);
                    setSelectedPlayerId(null);
                });
            }
        } catch (error) {
            console.error('Error marking unsold:', error);
        }
    };

    const handleReset = async () => {
        if (!auctionId) return;

        try {
            await auctionAPI.reset(auctionId);
            socketService.resetAuction(auctionId);
            setCurrentPlayer(null);
            setSelectedPlayerId(null);
        } catch (error) {
            console.error('Error resetting auction:', error);
        }
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-bg"
        >
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Header */}
                <div className="glass-card">
                    <h1 className="text-2xl md:text-4xl font-bold gradient-text">
                        🎯 Auctioneer Control Panel
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base mt-2">
                        Manage players, control timer, and run the auction
                    </p>
                </div>

                {/* Main Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Player Selection Grid - FIRST on mobile for easy access */}
                    <div className="lg:col-span-2 order-2 lg:order-2">
                        <div className="glass-card">
                            <h3 className="text-xl font-bold text-white mb-4">Available Players</h3>

                            {loading ? (
                                <div className="text-center py-12">
                                    <p className="text-gray-400">Loading players...</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[600px] overflow-y-auto pr-2">
                                    {players.map((player) => (
                                        <PlayerCard
                                            key={player._id}
                                            player={player}
                                            onClick={() => handleSelectPlayer(player)}
                                            isSelected={player._id === selectedPlayerId}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Current Player & Timer - SECOND on mobile */}
                    <div className="lg:col-span-1 space-y-4 order-1 lg:order-1">
                        {currentPlayer ? (
                            <div className="glass-card">
                                <h3 className="text-lg font-bold text-white mb-4">Current Player</h3>
                                <PlayerCard player={currentPlayer} />
                            </div>
                        ) : (
                            <div className="glass-card h-64 flex items-center justify-center">
                                <p className="text-gray-500">Select a player to start</p>
                            </div>
                        )}

                        <Timer remaining={timer.remaining} isRunning={timer.isRunning} />

                        {/* Timer Controls */}
                        {currentPlayer && (
                            <div className="glass-card space-y-3">
                                <div className="grid grid-cols-2 gap-2">
                                    {!timer.isRunning ? (
                                        <button onClick={handleStartTimer} className="btn-primary">
                                            ▶️ Start
                                        </button>
                                    ) : (
                                        <button onClick={handlePauseTimer} className="btn-secondary">
                                            ⏸️ Pause
                                        </button>
                                    )}

                                    <button onClick={() => handleExtendTimer(10)} className="btn-secondary">
                                        +10s
                                    </button>
                                </div>

                                <div ref={hammerRef} className="grid grid-cols-2 gap-2">
                                    <button onClick={handleMarkSold} className="bg-green-600 hover:bg-green-700 px-4 py-3 rounded-lg font-bold">
                                        ✅ SOLD
                                    </button>
                                    <button onClick={handleMarkUnsold} className="bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg font-bold">
                                        ❌ UNSOLD
                                    </button>
                                </div>

                                <button onClick={handleReset} className="w-full btn-secondary text-sm">
                                    🔄 Reset
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Teams Overview - Mobile Responsive */}
                <div className="glass-card">
                    <h3 className="text-xl font-bold text-white mb-4">Teams</h3>

                    {/* Desktop View - Full Team Cards */}
                    <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {teams.map((team) => (
                            <TeamCard key={team._id} team={team} />
                        ))}
                    </div>

                    {/* Mobile View - Compact Team Logos */}
                    <div className="md:hidden grid grid-cols-4 gap-3">
                        {teams.map((team) => (
                            <button
                                key={team._id}
                                onClick={() => setSelectedTeam(team)}
                                className="glass-panel p-3 rounded-xl hover:border-green-500/50 transition-all group"
                            >
                                <div className="flex flex-col items-center gap-2">
                                    {/* Team Logo/Icon */}
                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform">
                                        {team.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    {/* Team Name (abbreviated) */}
                                    <span className="text-xs text-gray-400 text-center line-clamp-1">
                                        {team.name.length > 8 ? team.name.substring(0, 8) + '...' : team.name}
                                    </span>
                                    {/* Purse */}
                                    <span className="text-xs font-bold text-green-400">
                                        ₹{(team.purseRemaining / 100).toFixed(1)}Cr
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Mobile Team Details Modal */}
                    {selectedTeam && (
                        <div className="md:hidden fixed inset-0 bg-black/80 z-50 flex items-end sm:items-center justify-center p-4"
                            onClick={() => setSelectedTeam(null)}>
                            <motion.div
                                initial={{ y: 100, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 100, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="glass-card w-full max-w-md"
                            >
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">{selectedTeam.name}</h3>
                                    <button
                                        onClick={() => setSelectedTeam(null)}
                                        className="text-gray-400 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <TeamCard team={selectedTeam} />
                            </motion.div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default AuctioneerDashboard;
