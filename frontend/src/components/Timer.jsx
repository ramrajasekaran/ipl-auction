import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { animateCountdownUrgent, stopCountdownAnimation } from '../utils/animations';
import { formatTime } from '../utils/formatters';

const Timer = ({ remaining, isRunning }) => {
    const timerRef = useRef(null);

    useEffect(() => {
        if (isRunning && remaining <= 10 && remaining > 0) {
            // Apply urgent animation when time is running out
            if (timerRef.current) {
                animateCountdownUrgent(timerRef.current);
            }
        } else {
            // Stop animation
            if (timerRef.current) {
                stopCountdownAnimation(timerRef.current);
            }
        }

        return () => {
            if (timerRef.current) {
                stopCountdownAnimation(timerRef.current);
            }
        };
    }, [isRunning, remaining]);

    const getTimerColor = () => {
        if (!isRunning) return 'text-slate-500';
        if (remaining <= 3) return 'text-red-500';
        if (remaining <= 6) return 'text-orange-500';
        return 'text-green-500';
    };

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-panel p-6 rounded-2xl text-center shadow-2xl shadow-primary/10"
        >
            <div className="text-sm text-gray-400 mb-2">Time Remaining</div>
            <div
                ref={timerRef}
                className={`text-4xl md:text-6xl font-bold ${getTimerColor()} transition-colors duration-200`}
            >
                {formatTime(remaining)}
            </div>
            {!isRunning && remaining > 0 && (
                <div className="text-xs text-gray-500 mt-2">Paused</div>
            )}
            {remaining === 0 && (
                <div className="text-xs text-red-400 mt-2 font-semibold">Time's Up!</div>
            )}
        </motion.div>
    );
};

export default Timer;
