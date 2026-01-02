import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Wallet, ChevronRight, ChevronDown } from 'lucide-react';

const StatsPanel = ({ teams, currentBidderId }) => {
    const [expandedTeamId, setExpandedTeamId] = useState(null);

    const toggleTeam = (teamId) => {
        setExpandedTeamId(expandedTeamId === teamId ? null : teamId);
    };

    return (
        <div className="h-full bg-black/40 backdrop-blur-md border-l border-white/10 flex flex-col w-80">
            <div className="p-4 border-b border-white/10">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Users size={18} className="text-blue-400" />
                    Teams & Squads
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                {teams.length === 0 ? (
                    <div className="text-center text-slate-500 text-sm mt-10">
                        No teams joined yet.
                    </div>
                ) : (
                    teams.map(team => {
                        const tId = (team._id || team.id || '').toString();
                        const bId = (currentBidderId || '').toString();
                        const isActiveBidder = tId === bId;
                        const isExpanded = expandedTeamId === tId;

                        return (
                            <motion.div
                                key={tId}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`rounded-xl border transition-all ${isActiveBidder
                                    ? 'bg-primary/20 border-primary/50 shadow-lg shadow-primary/10'
                                    : 'bg-white/5 border-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div
                                    className="p-3 cursor-pointer"
                                    onClick={() => toggleTeam(tId)}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                                            <h4 className={`font-bold text-sm ${isActiveBidder ? 'text-white' : 'text-slate-200'}`}>
                                                {team.name}
                                            </h4>
                                        </div>
                                        <span className="text-xs text-slate-500 bg-black/30 px-2 py-0.5 rounded-full">
                                            {(team.players || []).length} Players
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-green-400 font-mono text-sm">
                                        <Wallet size={14} />
                                        <span>₹ {(team.currentPurse || 0).toFixed(2)} Cr</span>
                                    </div>
                                </div>

                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-3 pb-3 pt-1 border-t border-white/10">
                                                <div className="text-xs text-slate-400 mb-2 font-semibold">Squad:</div>
                                                {(team.players || []).length === 0 ? (
                                                    <div className="text-xs text-slate-500 italic">No players yet</div>
                                                ) : (
                                                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                                        {(team.players || []).map((p, idx) => (
                                                            <div key={idx} className="flex justify-between items-center py-1 px-2 bg-black/20 rounded text-xs">
                                                                <span className="text-slate-300 truncate">{p.player?.name || 'Unknown'}</span>
                                                                <span className="text-green-400 font-mono ml-2">
                                                                    {p.boughtPrice < 1
                                                                        ? `₹${Math.round(p.boughtPrice * 100)} L`
                                                                        : `₹${p.boughtPrice.toFixed(2)} Cr`
                                                                    }
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })
                )}
            </div >
        </div >
    );
};

export default StatsPanel;
