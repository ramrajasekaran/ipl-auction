import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, DollarSign, Users } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useGame } from '../context/GameContext';

const TeamDashboard = ({ team }) => {
    if (!team) return <div className="text-center text-slate-500 py-20">Loading team data...</div>;

    const { releasePlayer, currentUser } = useGame();
    const [processing, setProcessing] = useState(null);

    // Filter squad to get player objects (assuming team.squad might be IDs or objects)
    // In real app, we need full player objects. 
    // If backend only sends IDs, we need to lookup from a global player map or ensure population.
    // For now assuming populated.
    const players = team.players || [];

    const handleRelease = async (playerId) => {
        if (!confirm("Are you sure you want to release this player? You will get a refund.")) return;
        setProcessing(playerId);
        try {
            await releasePlayer(team._id, playerId);
        } catch (err) {
            alert("Failed to release player");
        } finally {
            setProcessing(null);
        }
    };

    const isMyTeam = currentUser?.teamId === team._id;

    return (
        <div className="bg-slate-900/50 rounded-2xl p-6 border border-white/10 h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Shield className="text-primary" /> {team.name}
                    </h2>
                    <p className="text-slate-400 text-sm">Squad Size: {players.length}</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-xs uppercase tracking-wider">Purse Remaining</p>
                    <p className="text-2xl font-mono text-green-400">₹ {team.currentPurse?.toFixed(2)} Cr</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {players.length === 0 ? (
                    <div className="text-center text-slate-500 py-8">No players in squad yet.</div>
                ) : (
                    <AnimatePresence>
                        {players.map((item) => {
                            const p = item.player || item; // Handle both populated and raw
                            return (
                                <motion.div
                                    key={p._id || p}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white/5 p-3 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold ${p.role === 'BATSMAN' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'}`}>
                                            {p.role ? p.role[0] : '?'}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-white">{p.name}</h4>
                                            <p className="text-xs text-slate-400">
                                                {p.country} • {
                                                    (() => {
                                                        const val = item.boughtPrice || p.soldPrice || 0;
                                                        // item.boughtPrice is in Cr in the DB.
                                                        const lakhs = val * 100; // Convert Cr to Lakhs for formatCurrency
                                                        return formatCurrency(lakhs);
                                                    })()
                                                }
                                            </p>
                                        </div>
                                    </div>

                                    {isMyTeam && (
                                        <button
                                            onClick={() => handleRelease(p._id)}
                                            disabled={processing === p._id}
                                            className="p-2 rounded-lg bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/20"
                                            title="Release Player"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                )}
            </div>
        </div>
    );
};

export default TeamDashboard;
