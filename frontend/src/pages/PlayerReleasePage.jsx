import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { UserMinus, ArrowRight, AlertCircle } from 'lucide-react';
import { releasePlayer } from '../services/miniAuctionAPI';
import axios from 'axios';

const PlayerReleasePage = () => {
    const { miniAuctionId } = useParams();
    const navigate = useNavigate();
    const [squad, setSquad] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [releasing, setReleasing] = useState(false);
    const [error, setError] = useState('');
    const teamId = sessionStorage.getItem('teamId');

    useEffect(() => {
        fetchTeamSquad();
    }, []);

    const fetchTeamSquad = async () => {
        try {
            const token = sessionStorage.getItem('authToken');
            const response = await axios.get(
                `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/games/team/${teamId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                setSquad(response.data.team.players || []);
            }
        } catch (err) {
            console.error("Fetch Squad Error:", err);
            setError(`Failed to load team squad: ${err.response?.data?.message || err.message} (${err.response?.status})`);
        } finally {
            setLoading(false);
        }
    };

    const togglePlayerSelection = (playerId) => {
        setSelectedPlayers(prev =>
            prev.includes(playerId)
                ? prev.filter(id => id !== playerId)
                : [...prev, playerId]
        );
    };

    const handleReleaseSelected = async () => {
        if (selectedPlayers.length === 0) {
            setError('Please select at least one player to release');
            return;
        }

        setReleasing(true);
        setError('');

        try {
            // Release each selected player
            for (const playerId of selectedPlayers) {
                await releasePlayer(miniAuctionId, teamId, playerId);
            }

            // Navigate to mini auction room
            navigate(`/mini-auction/${miniAuctionId}`);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to release players');
        } finally {
            setReleasing(false);
        }
    };

    const handleSkip = () => {
        navigate(`/mini-auction/${miniAuctionId}`);
    };

    const remainingPlayers = squad.length - selectedPlayers.length;

    return (
        <div className="min-h-screen bg-gradient-bg p-6">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card mb-6"
                >
                    <h1 className="text-3xl font-bold gradient-text mb-2">
                        Release Players
                    </h1>
                    <p className="text-slate-400">
                        Select unwanted players to release before mini auction
                    </p>
                </motion.div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="glass-panel p-4 rounded-xl">
                        <div className="text-slate-400 text-sm mb-1">Current Squad</div>
                        <div className="text-2xl font-bold text-white">{squad.length} Players</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl">
                        <div className="text-slate-400 text-sm mb-1">Selected to Release</div>
                        <div className="text-2xl font-bold text-red-500">{selectedPlayers.length} Players</div>
                    </div>
                    <div className="glass-panel p-4 rounded-xl">
                        <div className="text-slate-400 text-sm mb-1">Remaining Squad</div>
                        <div className="text-2xl font-bold text-green-500">{remainingPlayers} Players</div>
                    </div>
                </div>

                {/* Warning */}
                {remainingPlayers < 15 && (
                    <div className="glass-panel p-4 rounded-xl mb-6 border-2 border-yellow-500/50">
                        <div className="flex items-center gap-3 text-yellow-500">
                            <AlertCircle size={24} />
                            <div>
                                <div className="font-bold">Warning!</div>
                                <div className="text-sm">You must have at least 15 players to participate in mini auction</div>
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="glass-panel p-4 rounded-xl mb-6 border-2 border-red-500/50">
                        <div className="text-red-500">{error}</div>
                    </div>
                )}

                {/* Player Grid */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="w-12 h-12 border-4 border-green-500/30 border-t-green-500 rounded-full animate-spin mx-auto" />
                        <p className="text-slate-400 mt-4">Loading squad...</p>
                    </div>
                ) : (
                    <div className="glass-card mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">Your Squad</h2>
                        <div className="space-y-3">
                            {squad.map((playerData) => {
                                const player = playerData.player;
                                const isSelected = selectedPlayers.includes(player._id);

                                return (
                                    <motion.div
                                        key={player._id}
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => togglePlayerSelection(player._id)}
                                        className={`p-4 rounded-xl cursor-pointer transition-all flex items-center gap-4 ${isSelected
                                            ? 'bg-red-500/20 border border-red-500'
                                            : 'glass-panel hover:bg-white/5 border border-white/5'
                                            }`}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-white text-base">{player.name}</h3>
                                        </div>

                                        <div className="bg-black/20 px-3 py-1 rounded text-xs text-slate-400 font-bold uppercase tracking-wider w-24 text-center">
                                            {player.role}
                                        </div>

                                        <div className="text-base text-green-400 font-mono font-bold w-24 text-right">
                                            ₹{playerData.boughtPrice} Cr
                                        </div>

                                        <div className="w-8 flex justify-center">
                                            {isSelected && (
                                                <UserMinus className="text-red-500" size={20} />
                                            )}
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-4">
                    <button
                        onClick={handleSkip}
                        className="flex-1 glass-panel py-4 rounded-xl font-bold text-white hover:bg-white/10 transition-all"
                    >
                        Skip (Keep All Players)
                    </button>
                    <button
                        onClick={handleReleaseSelected}
                        disabled={releasing || selectedPlayers.length === 0 || remainingPlayers < 15}
                        className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {releasing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Releasing...
                            </>
                        ) : (
                            <>
                                Release {selectedPlayers.length} Player{selectedPlayers.length !== 1 ? 's' : ''}
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlayerReleasePage;
