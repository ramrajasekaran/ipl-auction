import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, DollarSign, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const AllTeamsView = ({ teams }) => {
    const [expandedTeam, setExpandedTeam] = useState(null);

    if (!teams || teams.length === 0) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center text-slate-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No teams have joined yet</p>
                </div>
            </div>
        );
    }

    const toggleTeam = (teamId) => {
        setExpandedTeam(expandedTeam === teamId ? null : teamId);
    };

    return (
        <div className="h-full overflow-y-auto p-4 md:p-6">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-2xl md:text-3xl font-black text-white mb-6 flex items-center gap-3">
                    <Shield className="text-primary" size={32} />
                    TEAMS & PURSE OVERVIEW
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => {
                        const players = team.players || [];
                        const isExpanded = expandedTeam === team._id;

                        return (
                            <motion.div
                                key={team._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden"
                            >
                                {/* Team Card Header */}
                                <div
                                    onClick={() => toggleTeam(team._id)}
                                    className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        {/* Team Logo/Avatar */}
                                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-purple-600/20 border-2 border-primary/30 flex items-center justify-center flex-shrink-0">
                                            <Shield className="text-primary" size={24} />
                                        </div>

                                        {/* Team Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-white truncate">
                                                {team.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                                                <Users size={12} />
                                                <span>{players.length} Players</span>
                                            </div>
                                        </div>

                                        {/* Expand Icon */}
                                        <div className="flex-shrink-0">
                                            {isExpanded ? (
                                                <ChevronUp size={20} className="text-slate-400" />
                                            ) : (
                                                <ChevronDown size={20} className="text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Purse Display */}
                                    <div className="bg-black/30 rounded-lg p-3 border border-white/5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                                                Current Purse
                                            </span>
                                            <DollarSign size={14} className="text-green-400" />
                                        </div>
                                        <div className="text-xl font-black text-green-400 mt-1 font-mono">
                                            ₹ {team.currentPurse?.toFixed(2)} Cr
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Squad View */}
                                {isExpanded && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="border-t border-white/10 bg-black/20"
                                    >
                                        <div className="p-4 max-h-64 overflow-y-auto custom-scrollbar">
                                            {players.length === 0 ? (
                                                <p className="text-center text-slate-500 text-sm py-4">
                                                    No players yet
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    {players.map((item) => {
                                                        const p = item.player || item;
                                                        const price = item.boughtPrice || p.soldPrice || 0;
                                                        const lakhs = price * 100;

                                                        return (
                                                            <div
                                                                key={p._id || p}
                                                                className="flex items-center justify-between p-2 bg-white/5 rounded-lg text-sm"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-white font-semibold truncate">
                                                                        {p.name}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-400 uppercase">
                                                                        {p.role}
                                                                    </div>
                                                                </div>
                                                                <div className="text-green-400 font-mono text-xs font-bold">
                                                                    {formatCurrency(lakhs)}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default AllTeamsView;
