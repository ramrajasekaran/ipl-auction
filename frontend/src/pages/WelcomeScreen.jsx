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
    const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');

    // MASTER ADMIN OVERRIDE
    if (authUser.email && authUser.email.toLowerCase() === 'sriramsriram16145@gmail.com' && authUser.role !== 'ADMIN') {
        authUser.role = 'ADMIN';
        sessionStorage.setItem('authUser', JSON.stringify(authUser));
    }

    const isAdmin = authUser.role === 'ADMIN';

    const handleLogout = async () => {
        await logout();
        navigate('/portal');
    };

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-start p-4 md:p-6 relative overflow-x-hidden">
            {/* Header / Nav */}
            <div className="w-full max-w-7xl flex items-center justify-between mb-4 relative z-10 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Trophy className="text-white" size={28} />
                    </div>
                    <div>
                        <h3 className="text-white font-bold leading-tight">{authUser.name || 'User'}</h3>
                        {isAdmin && (
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{authUser.role}</span>
                                <span className="text-[8px] text-green-500 font-bold uppercase tracking-wider">v1.1-auth-fixed</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    {isAdmin && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full border border-red-500/20 transition-all font-medium"
                        >
                            <Zap size={16} fill="currentColor" />
                            Admin Panel
                        </button>
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
                className="text-center mb-6 space-y-2 relative z-10"
            >
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white mb-1 uppercase italic">
                    IPL <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">Auction</span>
                </h1>
                <div className="flex flex-col items-center gap-2">
                    <p className="text-slate-400 text-xl tracking-widest uppercase">Select Your Game Mode</p>
                    <div className="px-4 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                        <span className="text-green-500 text-xs font-bold uppercase tracking-widest">Authentication Active</span>
                    </div>
                    <p className="text-slate-500 text-sm max-w-md">
                        Your global session is active. To start bidding or hosting, please enter a specific <b>Auction Room</b> using the cards below.
                    </p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full max-w-5xl px-4 relative z-10 pb-10">
                {/* Mega Auction Card */}
                <motion.div
                    onHoverStart={() => setHovered('mega')}
                    onHoverEnd={() => setHovered(null)}
                    onClick={() => navigate('/mega-auction')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative h-full bg-slate-900/90 border border-white/10 p-6 md:p-10 rounded-3xl flex flex-col items-center text-center overflow-hidden hover:border-purple-500/50 transition-colors">

                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Trophy className="text-white w-8 h-8 md:w-12 md:h-12" />
                        </div>

                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 uppercase italic">Mega Auction</h2>
                        <span className="text-[10px] md:text-xs font-bold text-purple-400 tracking-[0.2em] mb-4 uppercase">New Game / Setup</span>
                        <p className="text-slate-400 text-sm md:text-base mb-6 md:mb-8 leading-relaxed">
                            Create a new room or join as a contestant for the first time.
                            Requires a unique Room ID to begin your journey.
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-purple-400 font-bold tracking-wider group-hover:text-purple-300 text-sm md:text-base">
                            HOST OR JOIN <Zap size={16} fill="currentColor" />
                        </div>
                    </div>
                </motion.div>

                {/* Mini Auction Card */}
                <motion.div
                    onHoverStart={() => setHovered('mini')}
                    onHoverEnd={() => setHovered(null)}
                    onClick={() => navigate('/continue-game')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative cursor-pointer group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-3xl blur opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
                    <div className="relative h-full bg-slate-900/90 border border-white/10 p-6 md:p-10 rounded-3xl flex flex-col items-center text-center overflow-hidden hover:border-yellow-500/50 transition-colors">

                        <div className="w-16 h-16 md:w-24 md:h-24 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mb-6 md:mb-8 shadow-lg shadow-yellow-500/30 group-hover:scale-110 transition-transform duration-300">
                            <Zap className="text-white w-8 h-8 md:w-12 md:h-12" fill="currentColor" />
                        </div>

                        <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4 uppercase italic">Mini Auction</h2>
                        <span className="text-[10px] md:text-xs font-bold text-yellow-500 tracking-[0.2em] mb-4 uppercase">Continue Saved Game</span>
                        <p className="text-slate-400 text-sm md:text-base mb-6 md:mb-8 leading-relaxed">
                            Already have a team? Enter your Room ID and Team Password to
                            release players and start your Mini Auction.
                        </p>

                        <div className="mt-auto flex items-center gap-2 text-yellow-500 font-bold tracking-wider group-hover:text-yellow-400 text-sm md:text-base">
                            CONTINUE GAME <Zap size={16} fill="currentColor" />
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default WelcomeScreen;
