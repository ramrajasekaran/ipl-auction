import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { animateBidPulse } from '../utils/animations';

const BidButton = ({ amount, onClick, disabled, label, variant = 'primary' }) => {
    const buttonRef = useRef(null);

    const handleClick = () => {
        if (buttonRef.current) {
            animateBidPulse(buttonRef.current);
        }
        onClick(amount);
    };

    const getVariantStyles = () => {
        if (variant === 'quick') {
            return 'bg-primary-600 hover:bg-primary-700';
        }
        return 'bg-gradient-to-r from-accent-gold to-yellow-600 hover:from-yellow-600 hover:to-accent-gold text-black';
    };

    return (
        <motion.button
            ref={buttonRef}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            onClick={handleClick}
            disabled={disabled}
            className={`px-4 md:px-6 py-3 md:py-4 rounded-lg font-bold text-sm md:text-base transition-all duration-200 ${getVariantStyles()} disabled:opacity-50 disabled:cursor-not-allowed shadow-lg`}
        >
            {label || `₹${amount}CR`}
        </motion.button>
    );
};

export default BidButton;
