import React from 'react';
import { motion } from 'framer-motion';
import { Gavel, TrendingUp } from 'lucide-react';
import { getDynamicIncrement, formatCurrency } from '../utils/formatters';

const BidControls = ({ currentBid, onBid, isMyTurn, isDisabled }) => {

    // Calculate dynamic increment based on current bid price
    const bidIncrement = getDynamicIncrement(currentBid);
    const nextBidAmount = currentBid + bidIncrement;
    const isHighStakes = currentBid >= 500; // 5 Cr threshold for high stakes visual

    const handleBid = () => {
        if (!isDisabled) {
            onBid(nextBidAmount);
        }
    };

    return (
        <div className="fixed bottom-0 md:static left-0 right-0 p-4 md:p-0 bg-black/80 md:bg-transparent backdrop-blur-lg md:backdrop-blur-none z-50 border-t md:border-none border-white/10">
            <motion.button
                whileHover={!isDisabled ? { scale: 1.05 } : {}}
                whileTap={!isDisabled ? { scale: 0.95 } : {}}
                onClick={handleBid}
                disabled={isDisabled}
                className={`w-full md:w-auto px-8 py-6 rounded-2xl flex items-center justify-center gap-4 text-xl font-bold transition-all shadow-xl ${isDisabled
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed grayscale'
                    : isHighStakes
                        ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-red-900/40 border border-red-500/30'
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-blue-900/40 border border-blue-400/30'
                    }`}
            >
                <div className={`p-2 rounded-full ${isHighStakes ? 'bg-black/20' : 'bg-black/20'}`}>
                    {isHighStakes ? <TrendingUp size={24} /> : <Gavel size={24} />}
                </div>
                <div className="text-left">
                    <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Place Bid</div>
                    <div className="text-2xl leading-none">
                        {formatCurrency(nextBidAmount)}
                    </div>
                </div>
            </motion.button>
        </div>
    );
};

export default BidControls;
