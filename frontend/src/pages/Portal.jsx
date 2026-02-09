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
    ArrowRight
} from 'lucide-react';

const Portal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'how-to' | 'rules' | 'contact'

    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 bg-slate-950 overflow-hidden relative font-sans">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[20%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 relative z-10 h-[85vh]">

                {/* Left Side: Branding & Info Tabs */}
                <div className="flex flex-col h-full bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                            <Trophy className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl font-black text-white italic">IPL <span className="text-primary">ARENA</span></h1>
                    </div>

                    <div className="flex flex-col gap-3 mb-8">
                        {[
                            { id: 'auth', label: 'Dashboard', icon: LogIn },
                            { id: 'how-to', label: 'How to Play', icon: Zap },
                            { id: 'rules', label: 'Rules', icon: ShieldCheck },
                            { id: 'contact', label: 'Contact', icon: Mail }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-bold tracking-wide uppercase text-sm ${activeTab === tab.id
                                        ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]'
                                        : 'text-slate-500 hover:bg-white/5 hover:text-slate-300'
                                    }`}
                            >
                                <tab.icon size={20} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto p-6 bg-primary/5 border border-primary/10 rounded-2xl">
                        <p className="text-xs text-slate-400 leading-relaxed italic">
                            "The ultimate platform to experience the thrill of the IPL Auction. Strategic bidding, budget management, and team building at your fingertips."
                        </p>
                    </div>
                </div>

                {/* Right Side: Tab Content */}
                <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl relative overflow-hidden flex flex-col shadow-2xl">
                    <AnimatePresence mode="wait">
                        {activeTab === 'auth' && (
                            <motion.div
                                key="auth"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col justify-center gap-6"
                            >
                                <div className="text-center mb-4">
                                    <h2 className="text-3xl font-black text-white mb-2 uppercase italic tracking-tighter">Welcome to the Arena</h2>
                                    <p className="text-slate-500 text-sm font-medium">Choose your path to enter the session</p>
                                </div>

                                <div className="space-y-4">
                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate('/login')}
                                        className="w-full group p-6 bg-primary rounded-2xl flex items-center justify-between shadow-xl shadow-primary/20 transition-all border border-primary/50"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-white">
                                                <LogIn size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-white font-black uppercase italic tracking-widest">Sign In</h3>
                                                <p className="text-white/60 text-xs font-bold uppercase tracking-widest">Returning Official</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>

                                    <motion.button
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => navigate('/register')}
                                        className="w-full group p-6 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-between transition-all border border-white/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-slate-400">
                                                <UserPlus size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-white font-black uppercase italic tracking-widest">Register</h3>
                                                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">New Enrollment</p>
                                            </div>
                                        </div>
                                        <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </motion.button>
                                </div>

                                <div className="mt-8 pt-8 border-t border-white/5 text-center">
                                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.3em]">
                                        Secure Multi-Factor Authentication Active
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'how-to' && (
                            <motion.div
                                key="how-to"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full overflow-y-auto custom-scrollbar space-y-8 pr-2"
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 italic">
                                    <PlayCircle size={24} className="text-primary" />
                                    How to Play
                                </h2>
                                <div className="space-y-6">
                                    {[
                                        { title: "Register & Access", desc: "Create your official IPL Arena account to start your journey." },
                                        { title: "Select Mode", desc: "Choose between Mega Auction (Fresh Play) or Mini Auction (Continue Saved)." },
                                        { title: "Create/Join Room", desc: "Host a new room as an Auctioneer or join an existing one as a Team Owner." },
                                        { title: "Live Bidding", desc: "Bid for your favorite players in real-time. Manage your 120Cr budget wisely!" },
                                        { title: "Build the Squad", desc: "Aim for 15-25 players including required Overseas, Batsmen, and Bowlers." }
                                    ].map((step, i) => (
                                        <div key={i} className="flex gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-black flex-shrink-0">{i + 1}</div>
                                            <div>
                                                <h3 className="text-white font-bold mb-1 tracking-tight">{step.title}</h3>
                                                <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'rules' && (
                            <motion.div
                                key="rules"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full overflow-y-auto custom-scrollbar space-y-6 pr-2"
                            >
                                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 italic">
                                    <Gavel size={24} className="text-primary" />
                                    Official Rules
                                </h2>
                                <div className="grid gap-4">
                                    {[
                                        { label: "Squad Size", val: "15 - 25 Players", icon: Users },
                                        { label: "Total Budget", val: "120.00 Crores", icon: DollarSign },
                                        { label: "Overseas Limit", val: "Max 8 Players", icon: Trophy },
                                        { label: "Min Bid", val: "Base Price of Player", icon: Zap },
                                        { label: "Mini Auction", val: "Retain & Release", icon: Clock }
                                    ].map((rule, i) => (
                                        <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <rule.icon size={18} className="text-slate-500" />
                                                <span className="text-slate-300 font-medium">{rule.label}</span>
                                            </div>
                                            <span className="text-white font-black">{rule.val}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                    <p className="text-[11px] text-amber-500 leading-relaxed font-bold uppercase tracking-widest text-center">
                                        Note: All teams must have at least 1 Wicket-Keeper and 4 Bowlers to be valid.
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'contact' && (
                            <motion.div
                                key="contact"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex flex-col items-center justify-center text-center p-8"
                            >
                                <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                                    <Mail size={48} className="text-primary" />
                                </div>
                                <h2 className="text-3xl font-black text-white mb-4 italic uppercase">Support Center</h2>
                                <p className="text-slate-400 text-lg mb-8 max-w-sm leading-relaxed font-medium">
                                    Encountering an error or need assistance with your auction?
                                </p>
                                <a
                                    href="mailto:iplarena.app@gmail.com"
                                    className="px-8 py-4 bg-primary/20 border border-primary/30 text-primary rounded-2xl font-black text-xl hover:bg-primary hover:text-white transition-all shadow-lg shadow-primary/20 flex items-center gap-3"
                                >
                                    <Mail size={24} />
                                    iplarena.app@gmail.com
                                </a>
                                <p className="mt-8 text-slate-600 text-[10px] uppercase font-bold tracking-[0.2em]">
                                    Typical Response Time: &lt; 24 Hours
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Global Footer */}
            <div className="absolute bottom-6 left-0 right-0 text-center pointer-events-none z-10">
                <p className="text-slate-700 text-[10px] font-black uppercase tracking-[0.4em]">
                    IPL ARENA V1.5 • SECURE ACCESS • REAL-TIME AUCTION SYSTEM
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
                    background: rgba(255, 255, 255, 0.1);
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(59, 130, 246, 0.5);
                }
            `}</style>
        </div>
    );
};

export default Portal;
