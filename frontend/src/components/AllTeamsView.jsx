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
        <div className="h-full overflow-y-auto p-4 md:p-6 bg-gradient-to-br from-slate-900/50 to-black/50">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl md:text-4xl font-black text-white mb-2 flex items-center justify-center gap-3">
                        <Shield className="text-primary" size={40} />
                        ALL TEAMS & PURSE
                    </h1>
                    <p className="text-slate-400 text-sm">Click on any team to view their full squad</p>
                </div>

                {/* Teams Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teams.map((team) => {
                        const players = team.players || [];
                        const isExpanded = expandedTeam === team._id;

                        return (
                            <motion.div
                                key={team._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02 }}
                                className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-3xl border-2 border-white/20 overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all"
                            >
                                {/* Team Card Header */}
                                <div
                                    onClick={() => toggleTeam(team._id)}
                                    className="p-6 cursor-pointer hover:bg-white/5 transition-colors"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        {/* Team Logo/Avatar */}
                                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/30 to-purple-600/30 border-3 border-primary/50 flex items-center justify-center flex-shrink-0 shadow-lg">
                                            <Shield className="text-primary" size={32} />
                                        </div>

                                        {/* Team Info */}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-black text-white truncate mb-2">
                                                {team.name}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-slate-300">
                                                <Users size={14} className="text-primary" />
                                                <span className="font-semibold">{players.length} Players</span>
                                            </div>
                                        </div>

                                        {/* Expand Icon */}
                                        <div className="flex-shrink-0">
                                            {isExpanded ? (
                                                <ChevronUp size={24} className="text-primary" />
                                            ) : (
                                                <ChevronDown size={24} className="text-slate-400" />
                                            )}
                                        </div>
                                    </div>

                                    {/* Purse Display - PROMINENT */}
                                    <div className="bg-gradient-to-r from-green-900/40 to-emerald-900/40 rounded-2xl p-4 border-2 border-green-500/30">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs text-green-300 uppercase tracking-wider font-bold">
                                                💰 Current Purse
                                            </span>
                                            <DollarSign size={18} className="text-green-400" />
                                        </div>
                                        <div className="text-3xl font-black text-green-400 mt-1 font-mono">
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
                                        className="border-t-2 border-white/10 bg-black/30"
                                    >
                                        <div className="p-4 max-h-80 overflow-y-auto custom-scrollbar">
                                            {players.length === 0 ? (
                                                <p className="text-center text-slate-500 text-sm py-6">
                                                    No players in squad yet
                                                </p>
                                            ) : (
                                                <div className="space-y-2">
                                                    <div className="text-xs text-slate-400 uppercase tracking-wider font-bold mb-3 flex items-center gap-2">
                                                        <Shield size={12} />
                                                        Squad Members
                                                    </div>
                                                    {players.map((item) => {
                                                        const p = item.player || item;
                                                        const price = item.boughtPrice || p.soldPrice || 0;
                                                        const lakhs = price * 100;

                                                        return (
                                                            <div
                                                                key={p._id || p}
                                                                className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl text-sm transition-colors border border-white/5"
                                                            >
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="text-white font-bold truncate">
                                                                        {p.name}
                                                                    </div>
                                                                    <div className="text-xs text-slate-400 uppercase tracking-wide">
                                                                        {p.role}
                                                                    </div>
                                                                </div>
                                                                <div className="text-green-400 font-mono text-sm font-bold ml-2">
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
