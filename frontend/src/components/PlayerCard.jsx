import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Activity, DollarSign, User } from 'lucide-react';
import { getDynamicIncrement, formatCurrency } from '../utils/formatters';

// Mock images or placeholders
const PlayerCard = ({ player, currentBid, lastSoldPlayer, currentBidderName }) => {
    if (!player) {
        // Show sold/unsold announcement if available
        if (lastSoldPlayer) {
            return (
                <div className={`min-h-[300px] w-full max-w-sm glass-panel rounded-2xl flex items-center justify-center flex-col p-4 border-2 ${lastSoldPlayer.isUnsold
                    ? 'bg-gradient-to-br from-red-900/50 to-rose-900/50 border-red-500/50'
                    : 'bg-gradient-to-br from-green-900/50 to-emerald-900/50 border-green-500/50'
                    }`}>
                    <div className={`text-2xl font-black mb-2 ${lastSoldPlayer.isUnsold ? 'text-red-400' : 'text-green-400'}`}>
                        {lastSoldPlayer.isUnsold ? 'UNSOLD!' : 'SOLD!'}
                    </div>
                    <div className="text-white font-bold text-lg truncate max-w-full">{lastSoldPlayer.player?.name}</div>
                    {!lastSoldPlayer.isUnsold && (
                        <>
                            <div className="text-green-200 text-sm mt-1">
                                to <span className="font-bold text-white">{lastSoldPlayer.team?.name}</span>
                            </div>
                            <div className="text-green-100 text-xs mt-1">
                                for {formatCurrency(lastSoldPlayer.price)}
                            </div>
                        </>
                    )}
                    {lastSoldPlayer.isUnsold && (
                        <div className="text-red-200 text-sm mt-1">No bids received</div>
                    )}
                </div>
            );
        }

        return (
            <div className="min-h-[300px] w-full max-w-sm glass-panel rounded-2xl flex items-center justify-center flex-col text-slate-500 animate-pulse">
                <div className="w-32 h-32 bg-slate-800 rounded-full flex items-center justify-center mb-4 border-4 border-slate-700">
                    <User size={64} className="text-slate-600" />
                </div>
                <p className="text-lg font-bold text-slate-500">Waiting for Next Player...</p>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm relative group flex-shrink-0"
        >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/20 to-purple-600/20 rounded-2xl blur-lg group-hover:blur-xl transition-all duration-500" />

            <div className="glass-panel p-2 rounded-2xl relative overflow-hidden text-center z-10 border-white/10">
                <div className="w-full aspect-[4/3] bg-gradient-to-br from-slate-800 to-black rounded-xl mb-2 relative overflow-hidden">
                    {/* Placeholder logic for image */}
                    {player.image ? (
                        <img src={player.image} alt={player.name} className="w-full h-full object-cover object-top" />
                    ) : (
                        <div className="flex items-center justify-center h-full bg-slate-800/50">
                            <User size={80} className="text-slate-600" strokeWidth={1} />
                        </div>
                    )}

                    <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white border border-white/10 uppercase tracking-wider">
                        {player.role || 'All Rounder'}
                    </div>
                </div>

                <h2 className="text-lg font-bold text-white mb-0.5 tracking-tight truncate">{player.name}</h2>
                <div className="flex items-center justify-center gap-2 mb-2 text-slate-400 text-xs">
                    <Activity size={10} className="text-green-500" />
                    <span>Base: {player.priceLabel || formatCurrency(player.basePrice)}</span>
                </div>

                <div className="bg-white/5 rounded-lg p-1.5 border border-white/10">
                    <div className="text-[10px] text-slate-400 mb-0.5">Current Bid</div>
                    <div className="text-xl font-black text-gold text-glow-gold flex items-center justify-center gap-1">
                        {formatCurrency(currentBid)}
                    </div>
                    {currentBidderName && (
                        <div className="text-[10px] text-primary mt-0.5 animate-pulse">
                            by <span className="font-bold">{currentBidderName}</span>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

export default PlayerCard;
