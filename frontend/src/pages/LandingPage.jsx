import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gavel, User, Trophy, PlayCircle, ArrowLeft } from 'lucide-react';

const LandingPage = () => {
    const navigate = useNavigate();
    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 relative z-10 overflow-hidden">
            <motion.button
                onClick={() => navigate('/welcome')}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-50"
                title="Back to Home"
            >
                <ArrowLeft size={24} />
            </motion.button>

            {/* Arena Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Stadium Lights Effect */}
                <div className="absolute top-[-20%] left-[20%] w-[60%] h-[50%] bg-ipl-blue/30 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute top-[-10%] left-[10%] w-[30%] h-[30%] bg-white/10 blur-[80px] rounded-full mix-blend-overlay" />
                <div className="absolute top-[-10%] right-[10%] w-[30%] h-[30%] bg-gold/20 blur-[80px] rounded-full mix-blend-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center mb-16 space-y-4"
            >
                <div className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold text-sm font-bold tracking-wider mb-6 shadow-lg shadow-black/20 neon-border-gold">
                    <Trophy size={16} className="text-gold" />
                    <span>OFFICIAL IPL AUCTION ARENA</span>
                </div>
                <h1 className="text-5xl md:text-8xl font-black tracking-tight text-white mb-4 uppercase drop-shadow-2xl font-outfit">
                    BUILD YOUR <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-yellow-200 to-gold text-glow-gold">DYNASTY</span>
                </h1>
                <p className="text-slate-300 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
                    The stage is set. The hammer is ready. <strong className="text-white">Command the auction floor</strong> and assemble a championship squad.
                </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 w-full max-w-4xl">
                <Link to="/manager" className="group">
                    <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full glass-panel arena-glass p-8 rounded-2xl flex flex-col items-center text-center transition-all group-hover:border-ipl-blue/50 group-hover:shadow-[0_0_30px_rgba(0,75,160,0.3)] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-ipl-blue/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="w-20 h-20 bg-gradient-to-br from-ipl-blue to-ipl-blue-dark rounded-2xl rotate-3 flex items-center justify-center mb-6 text-white shadow-lg shadow-black/40 group-hover:rotate-0 transition-all duration-300">
                            <Gavel size={40} className="drop-shadow-md" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">Manager Zone</h2>
                        <div className="h-1 w-12 bg-ipl-blue rounded-full mb-4 group-hover:w-24 transition-all duration-300" />

                        <p className="text-slate-300 mb-8 font-light text-sm">
                            Create auction rooms, set budgets, and control the hammer.
                        </p>
                        <span className="mt-auto px-8 py-3 rounded-xl bg-ipl-blue hover:bg-ipl-blue-light text-white font-semibold transition-all shadow-lg shadow-ipl-blue/30 w-full">
                            Create Room
                        </span>
                    </motion.div>
                </Link>

                <Link to="/join" className="group">
                    <motion.div
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        className="h-full glass-panel arena-glass p-8 rounded-2xl flex flex-col items-center text-center transition-all group-hover:border-gold/50 group-hover:shadow-[0_0_30px_rgba(255,191,0,0.3)] relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-b from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="w-20 h-20 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl -rotate-3 flex items-center justify-center mb-6 text-black shadow-lg shadow-black/40 group-hover:rotate-0 transition-all duration-300">
                            <User size={36} />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 uppercase tracking-wide">Team Owner</h2>
                        <div className="h-1 w-12 bg-gold rounded-full mb-4 group-hover:w-24 transition-all duration-300" />

                        <p className="text-slate-300 mb-8 font-light">
                            Enter the arena. Build your strategy, manage your purse, and secure the best players.
                        </p>
                        <span className="mt-auto px-8 py-3 rounded-xl bg-gradient-to-r from-gold to-yellow-500 hover:from-yellow-400 hover:to-yellow-500 text-black font-bold transition-all shadow-lg shadow-gold/20 w-full">
                            Join Room
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
