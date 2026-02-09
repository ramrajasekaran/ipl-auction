import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn,
    UserPlus,
    ShieldCheck,
    Mail,
    Trophy,
    Zap,
    Clock,
    DollarSign,
    Users,
    ChevronRight,
    Gavel,
    PlayCircle,
    ArrowRight,
    ArrowLeft,
    HandHelping
} from 'lucide-react';

const Portal = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('hub'); // 'hub' | 'rules' | 'contact'

    const steps = [
        { title: "Register & Access", desc: "Create your official IPL Arena account to start." },
        { title: "Select Mode", desc: "Choose between Mega Auction (Fresh) or Mini Auction (Saved)." },
        { title: "Create/Join Room", desc: "Host a room or join one as a Team Owner." },
        { title: "Live Bidding", desc: "Bid in real-time. Manage your 120Cr budget wisely!" },
        { title: "Build the Squad", desc: "Aim for 15-25 players with valid team composition." }
    ];

    const rules = [
        { label: "Squad Size", val: "15 - 25 Players", icon: Users },
        { label: "Total Budget", val: "120.00 Crores", icon: DollarSign },
        { label: "Overseas Limit", val: "Max 8 Players", icon: Trophy },
        { label: "Min Bid", val: "Base Price", icon: Zap },
        { label: "Mini Auction", val: "Retain & Release", icon: Clock }
    ];

    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-950 overflow-hidden relative font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[20%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-6xl grid lg:grid-cols-5 gap-8 relative z-10 h-[85vh]">

                {/* Left Side: How to Play (Static Text) - 2/5 columns */}
                <div className="lg:col-span-2 flex flex-col h-full bg-slate-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Trophy className="text-white" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-white italic tracking-tighter uppercase">IPL <span className="text-primary">ARENA</span></h1>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2 italic">
                            <PlayCircle size={20} className="text-primary" />
                            How to Play
                        </h2>

                        <div className="space-y-6">
                            {steps.map((step, i) => (
                                <div key={i} className="relative pl-8 group">
                                    <div className="absolute left-0 top-1 w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[10px] font-black z-10">
                                        {i + 1}
                                    </div>
                                    {i !== steps.length - 1 && (
                                        <div className="absolute left-[9px] top-6 w-[2px] h-full bg-gradient-to-b from-primary/20 to-transparent" />
                                    )}
                                    <h3 className="text-white font-bold text-sm mb-1 uppercase tracking-tight group-hover:text-primary transition-colors">
                                        {step.title}
                                    </h3>
                                    <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                        {step.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/5">
                        <div className="p-4 bg-primary/5 rounded-2xl flex items-center gap-3">
                            <HandHelping size={18} className="text-primary" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">
                                Strategy is key to winning.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Dynamic Hub - 3/5 columns */}
                <div className="lg:col-span-3 bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden flex flex-col shadow-2xl">
                    <AnimatePresence mode="wait">
                        {view === 'hub' && (
                            <motion.div
                                key="hub"
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 1.05 }}
                                className="h-full flex flex-col justify-center"
                            >
                                <div className="text-center mb-10">
                                    <h2 className="text-4xl font-black text-white mb-3 uppercase italic tracking-tighter">Action Hub</h2>
                                    <p className="text-slate-500 font-medium">Access the official auction tools and resources</p>
                                </div>

                                <div className="grid sm:grid-cols-2 gap-4">
                                    {/* Primary Auth Actions */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate('/login')}
                                        className="p-6 bg-primary rounded-2xl flex flex-col gap-4 text-left shadow-xl shadow-primary/20 border border-primary/50 group"
                                    >
                                        <LogIn size={32} className="text-white" />
                                        <div>
                                            <h3 className="text-white font-black uppercase italic tracking-widest">Sign In</h3>
                                            <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Returning Official</p>
                                        </div>
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate('/register')}
                                        className="p-6 bg-white/5 hover:bg-white/10 rounded-2xl flex flex-col gap-4 text-left border border-white/10 transition-all group"
                                    >
                                        <UserPlus size={32} className="text-primary" />
                                        <div>
                                            <h3 className="text-white font-black uppercase italic tracking-widest">Enrollment</h3>
                                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">New Registration</p>
                                        </div>
                                    </motion.button>

                                    {/* Info Actions */}
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setView('rules')}
                                        className="p-6 bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl flex items-center justify-between border border-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <ShieldCheck size={24} className="text-slate-400" />
                                            <span className="text-slate-200 font-bold uppercase text-xs tracking-widest">Official Rules</span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-600 group-hover:text-primary transition-colors" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => setView('contact')}
                                        className="p-6 bg-slate-800/40 hover:bg-slate-800/60 rounded-2xl flex items-center justify-between border border-white/5 transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Mail size={24} className="text-slate-400" />
                                            <span className="text-slate-200 font-bold uppercase text-xs tracking-widest">Support</span>
                                        </div>
                                        <ChevronRight size={18} className="text-slate-600 group-hover:text-primary transition-colors" />
                                    </motion.button>
                                </div>
                            </motion.div>
                        )}

                        {view === 'rules' && (
                            <motion.div
                                key="rules"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col"
                            >
                                <button
                                    onClick={() => setView('hub')}
                                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest mb-8"
                                >
                                    <ArrowLeft size={16} /> Back to Hub
                                </button>

                                <h2 className="text-3xl font-black text-white mb-8 italic uppercase tracking-tighter">Official Rules</h2>

                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                    {rules.map((rule, i) => (
                                        <div key={i} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-800/50 flex items-center justify-center text-slate-400">
                                                    <rule.icon size={20} />
                                                </div>
                                                <span className="text-slate-300 font-bold uppercase text-xs tracking-widest">{rule.label}</span>
                                            </div>
                                            <span className="text-primary font-black italic">{rule.val}</span>
                                        </div>
                                    ))}
                                    <div className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-2xl mt-4">
                                        <p className="text-[10px] text-amber-500/80 leading-relaxed font-black uppercase tracking-widest text-center italic">
                                            Note: Valid squads must have at least 1 WK and 4 Bowlers.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {view === 'contact' && (
                            <motion.div
                                key="contact"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col items-center justify-center text-center px-4"
                            >
                                <button
                                    onClick={() => setView('hub')}
                                    className="absolute top-0 left-0 flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
                                >
                                    <ArrowLeft size={16} /> Hub
                                </button>

                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20 animate-pulse">
                                    <HandHelping size={48} className="text-primary" />
                                </div>
                                <h2 className="text-4xl font-black text-white mb-4 italic uppercase tracking-tighter">Support</h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-sm leading-relaxed font-medium italic">
                                    encountered an issue or have any query?
                                </p>
                                <a
                                    href="mailto:iplarena.app@gmail.com"
                                    className="w-full max-w-sm py-5 bg-primary/10 border border-primary/20 text-white rounded-2xl font-black text-xl hover:bg-primary transition-all shadow-2xl flex items-center justify-center gap-3 group"
                                >
                                    <Mail size={24} className="group-hover:scale-110 transition-transform" />
                                    iplarena.app@gmail.com
                                </a>
                                <p className="mt-8 text-slate-700 text-[10px] uppercase font-bold tracking-[0.3em]">
                                    Response within 24 hours
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Global Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
                <p className="text-slate-800 text-[10px] font-black uppercase tracking-[0.5em]">
                    IPL ARENA V1.5 • SECURE Hub ACCESS • REAL-TIME AUCTION
                </p>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.3);
                }
            `}</style>
        </div>
    );
};

export default Portal;
