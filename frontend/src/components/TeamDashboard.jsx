import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, DollarSign, Users, Shield, Trash2 } from 'lucide-react';
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

    const isMyTeam = (currentUser?.teamId && currentUser.teamId === team._id) ||
        (currentUser?.userId && (team.owner === currentUser.userId || team.owner?._id === currentUser.userId));

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
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-white/5 p-3 rounded-lg flex items-center gap-4 hover:bg-white/10 transition-colors border border-white/5"
                                >
                                    <div className="flex-1 font-semibold text-white tracking-wide">{p.name}</div>

                                    <div className="w-24 text-xs font-bold text-slate-400 uppercase tracking-wider text-center bg-black/20 py-1.5 rounded">
                                        {p.role}
                                    </div>

                                    <div className="w-28 text-right font-mono text-green-400 font-bold">
                                        {(() => {
                                            const val = item.boughtPrice || p.soldPrice || 0;
                                            const lakhs = val * 100;
                                            return formatCurrency(lakhs);
                                        })()}
                                    </div>


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
