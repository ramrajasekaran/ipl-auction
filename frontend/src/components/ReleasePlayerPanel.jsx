import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserMinus, ArrowRight, AlertCircle, X, Shield } from 'lucide-react';
import axios from 'axios';
import { releasePlayer } from '../services/miniAuctionAPI';

const ReleasePlayerPanel = ({ miniAuctionId, teamId, onClose }) => {
    const [squad, setSquad] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [releasing, setReleasing] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (teamId) {
            fetchTeamSquad();
        }
    }, [teamId]);

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

            setError(`Failed to load team squad: ${err.response?.data?.message || err.message}`);
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
        if (selectedPlayers.length === 0) return;

        setReleasing(true);
        setError('');

        try {
            // Release each selected player
            // Ideally backend should support bulk release, but we iterate for now
            for (const playerId of selectedPlayers) {
                await releasePlayer(miniAuctionId, teamId, playerId);
            }

            // Refund handled by backend
            // Refresh squad
            setSelectedPlayers([]);
            await fetchTeamSquad();

            alert('Players Released Successfully!');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to release players');
        } finally {
            setReleasing(false);
        }
    };

    const remainingPlayers = squad.length - selectedPlayers.length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 md:p-8"
        >
            <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-5xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
            >
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <Shield className="text-red-500" />
                            Release Players
                        </h2>
                        <p className="text-slate-400 text-sm">Select players to release back to the pool</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                    >
                        <X size={24} className="text-slate-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

                    {/* Left: Stats & Actions */}
                    <div className="p-6 md:w-80 flex-shrink-0 border-r border-white/10 flex flex-col gap-6 bg-white/5">

                        {/* Stats Cards */}
                        <div className="space-y-4">
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Current Squad</div>
                                <div className="text-2xl font-bold text-white">{squad.length} <span className="text-sm font-normal text-slate-500">Players</span></div>
                            </div>
                            <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">Selected</div>
                                <div className="text-2xl font-bold text-red-500">{selectedPlayers.length} <span className="text-sm font-normal text-slate-500">Players</span></div>
                            </div>
                            <div className={`bg-black/40 p-4 rounded-xl border ${remainingPlayers < 15 ? 'border-red-500/50 bg-red-500/10' : 'border-white/5'}`}>
                                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">After Release</div>
                                <div className={`text-2xl font-bold ${remainingPlayers < 15 ? 'text-red-500' : 'text-green-500'}`}>{remainingPlayers} <span className="text-sm font-normal text-slate-500 opacity-60">Players</span></div>
                            </div>
                        </div>

                        {remainingPlayers < 15 && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs flex gap-2">
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                                <div>You must maintain at least 15 players.</div>
                            </div>
                        )}

                        {error && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs">
                                {error}
                            </div>
                        )}

                        <div className="mt-auto pt-6">
                            <button
                                onClick={handleReleaseSelected}
                                disabled={releasing || selectedPlayers.length === 0 || remainingPlayers < 15}
                                className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {releasing ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Releasing...
                                    </>
                                ) : (
                                    <>
                                        Release Selected
                                        <UserMinus size={20} />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Right: Player Grid */}
                    <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                        {loading ? (
                            <div className="text-center py-12 text-slate-500">Loading squad...</div>
                        ) : squad.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">No players in squad.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {squad.map((playerData) => {
                                    const player = playerData.player;
                                    const isSelected = selectedPlayers.includes(player._id);

                                    return (
                                        <div
                                            key={player._id}
                                            onClick={() => togglePlayerSelection(player._id)}
                                            className={`relative p-4 rounded-xl cursor-pointer transition-all border group ${isSelected
                                                ? 'bg-red-500/10 border-red-500 ring-1 ring-red-500/50'
                                                : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="bg-black/30 px-2 py-1 rounded text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                    {player.role}
                                                </div>
                                                <div className="font-mono text-green-400 font-bold text-sm">
                                                    ₹{playerData.boughtPrice || 0} Cr
                                                </div>
                                            </div>

                                            <h3 className="font-bold text-white text-lg mb-1">{player.name}</h3>
                                            <p className="text-xs text-slate-500">{player.battingStyle || 'Right Hand Bat'}</p>

                                            {isSelected && (
                                                <div className="absolute top-3 right-3 text-red-500">
                                                    <UserMinus size={20} />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                </div>
            </motion.div>
        </motion.div>
    );
};

export default ReleasePlayerPanel;
