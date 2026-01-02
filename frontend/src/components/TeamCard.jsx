import React from 'react';
import { motion } from 'framer-motion';
import { formatCurrency } from '../utils/formatters';

const TeamCard = ({ team }) => {
    if (!team) return null;

    const playerCount = team.players?.length || 0;
    const purseColor = team.currentPurse < 10 ? 'text-red-400' : 'text-green-400';

    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            className="glass-card"
        >
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-base md:text-lg font-bold text-white truncate">
                    {team.name}
                </h3>
                <div className="flex items-center space-x-1 text-xs text-gray-400">
                    <span>👥</span>
                    <span>{playerCount}</span>
                </div>
            </div>

            <div className="space-y-2">
                <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Remaining Purse</span>
                    <span className={`text-sm md:text-base font-bold ${purseColor}`}>
                        {formatCurrency(team.currentPurse)}
                    </span>
                </div>

                {team.initialPurse && (
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-400">Spent</span>
                        <span className="text-sm text-orange-400 font-semibold">
                            {formatCurrency(team.initialPurse - team.currentPurse)}
                        </span>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {team.initialPurse && (
                <div className="mt-3">
                    <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-accent-gold to-orange-500 transition-all duration-500"
                            style={{
                                width: `${((team.initialPurse - team.currentPurse) / team.initialPurse) * 100}%`,
                            }}
                        />
                    </div>
                </div>
            )}
        </motion.div>
    );
};

export default TeamCard;
