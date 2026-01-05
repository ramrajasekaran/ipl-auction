import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Trophy, Zap, LogOut, User } from 'lucide-react';
import { useGame } from '../context/GameContext';

const WelcomeScreen = () => {
    const navigate = useNavigate();
    const [hovered, setHovered] = useState(null);
    const { logout } = useGame();

    // Get logged-in user
    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
            {/* User Header */}
            <div className="absolute top-4 right-4 flex items-center gap-4">
                {authUser.name && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                        <User size={16} className="text-primary" />
                        <span className="text-white text-sm font-medium">{authUser.name}</span>
                    </div>
                )}
                <button
                    onClick={handleLogout}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all flex items-center gap-2"
                    title="Logout"
                >
                    <LogOut size={18} />
                    <span className="text-sm hidden md:inline">Logout</span>
                </button>
            </div>

            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[60%] bg-blue-900/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 blur-[100px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16 space-y-4"
            >
                <h1 className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-2 uppercase italic">
                    IPL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Auction</span>
                </h1>
                <p className="text-slate-400 text-xl tracking-widest uppercase">Select Your Game Mode</p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
                {/* Mega Auction Card */}
                <motion.div
                    onHoverStart={() => setHovered('mega')}
                    onHoverEnd={() => setHovered(null)}
                    onClick={() => navigate('/mega-auction')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative h-full bg-slate-900/90 border border-white/10 p-10 rounded-3xl flex flex-col items-center text-center overflow-hidden hover:border-purple-500/50 transition-colors">

                        <div className="w-24 h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Trophy size={48} className="text-white" />
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-4">MEGA AUCTION</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            The classic experience. One Manager hosts, multiple Team Owners bid.
                            Build your squad from scratch with a massive budget.
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-purple-400 font-bold tracking-wider group-hover:text-purple-300">
                            ENTER ARENA <Zap size={16} fill="currentColor" />
                        </div>
                    </div>
                </motion.div>

                {/* Mini Auction Card */}
                <motion.div
                    onHoverStart={() => setHovered('mini')}
                    onHoverEnd={() => setHovered(null)}
                    onClick={() => navigate('/continue-game')}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="relative cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl blur opacity-20 group-hover:opacity-60 transition-opacity duration-500" />
                    <div className="relative h-full bg-slate-900/90 border border-white/10 p-10 rounded-3xl flex flex-col items-center text-center overflow-hidden hover:border-yellow-500/50 transition-colors">

                        <div className="w-24 h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-8 shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Zap size={48} className="text-white" fill="currentColor" />
                        </div>

                        <h2 className="text-4xl font-bold text-white mb-4">MINI AUCTION</h2>
                        <p className="text-slate-400 mb-8 leading-relaxed">
                            Quick fire rounds. Smaller budgets, limited squads.
                            Perfect for fast-paced strategic gameplay.
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-yellow-500 font-bold tracking-wider group-hover:text-yellow-400">
                            ENTER ARENA <Zap size={16} fill="currentColor" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
