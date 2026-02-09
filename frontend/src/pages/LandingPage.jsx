import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, User, Trophy, PlayCircle } from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
            <motion.button
                onClick={() => { window.location.href = '/' }} // Force full nav or useHook, stick to Link/UserHook inside component.
                // Better: import useNavigate
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-50">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
            </motion.button>

            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[100px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[100px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16 space-y-4"
            >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gold text-sm font-medium mb-4">
                    <Trophy size={14} />
                    <span>IPL ARENA</span>
                </div>
                <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-2">
                    Build Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Dream Team</span>
                </h1>
                <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto">
                    Experience the thrill of the auction. Manage budgets, bid strategically, and assemble the ultimate squad.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
                <Link to="/manager" className="group">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full glass-panel p-8 rounded-2xl flex flex-col items-center text-center transition-all group-hover:bg-white/5 group-hover:border-primary/50 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-6 text-primary group-hover:text-white group-hover:bg-primary transition-colors">
                            <Gavel size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Manager Zone</h2>
                        <p className="text-slate-400 mb-6">
                            Host an auction, manage players, set budgets with 120Cr cap.
                        </p>
                        <span className="mt-auto px-6 py-2 rounded-lg bg-white/10 text-white group-hover:bg-primary transition-colors">
                            Create Game
                        </span>
                    </motion.div>
                </Link>

                <Link to="/join" className="group">
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full glass-panel p-8 rounded-2xl flex flex-col items-center text-center transition-all group-hover:bg-white/5 group-hover:border-green-500/50 relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-6 text-green-500 group-hover:text-white group-hover:bg-green-500 transition-colors">
                            <User size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-3">Team Owner</h2>
                        <p className="text-slate-400 mb-6">
                            Join a room, bid for players, and manage your squad & purse.
                        </p>
                        <span className="mt-auto px-6 py-2 rounded-lg bg-white/10 text-white group-hover:bg-green-600 transition-colors">
                            Join Game
                        </span>
                    </motion.div>
                </Link>
            </div>

            <br />
            {/* Admin Panel link hidden - only accessible via direct URL */}
            {/* <Link to="/admin" className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs border border-white/5">
                <Gavel size={14} /> Admin Panel
            </Link> */}
            <footer className="mt-8 text-slate-500 text-sm">
                IPL Arena &copy; 2026
            </footer>
        </div>
    );
};

export default LandingPage;
