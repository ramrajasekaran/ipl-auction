import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';

const BidHistory = ({ bids }) => {
    if (!bids || bids.length === 0) {
        return (
            <div className="glass-card h-full flex items-center justify-center">
                <p className="text-gray-500 text-sm">No bids yet</p>
            </div>
        );
    }

    return (
        <div className="glass-card h-full">
            <h3 className="text-lg md:text-xl font-bold text-white mb-4">Bid History</h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                {bids.map((bid, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="glass p-3 rounded-lg flex items-center justify-between"
                    >
                        <div className="flex-1">
                            <div className="flex items-center space-x-2">
                                <span className="font-semibold text-white text-sm md:text-base">
                                    {bid.teamName}
                                </span>
                                {index === 0 && (
                                    <span className="px-2 py-0.5 bg-accent-gold text-black text-xs font-bold rounded">
                                        HIGHEST
                                    </span>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">
                                {formatRelativeTime(bid.timestamp)}
                            </p>
                        </div>

                        <div className="text-right">
                            <p className="text-lg md:text-xl font-bold text-accent-gold">
                                {formatCurrency(bid.amount)}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default BidHistory;
