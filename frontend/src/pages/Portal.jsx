import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    LogIn,
    UserPlus,
    ShieldCheck,
    Mail,
    Trophy,
    Zap,
    Clock,
    IndianRupee,
    Users,
    PlayCircle,
    Handshake,
    ArrowRight
} from 'lucide-react';

const Portal = () => {
    const navigate = useNavigate();

    const steps = [
        { title: "Register & Access", desc: "Create your official IPL Arena account to start your journey." },
        { title: "Select Mode", desc: "Choose between Mega Auction (Fresh) or Mini Auction (Saved)." },
        { title: "Create/Join Room", desc: "Host a room or join one as a Team Owner." },
        { title: "Live Bidding", desc: "Bid in real-time. Manage your budget wisely!" },
        { title: "Build the Squad", desc: "Aim for 15-25 players with valid team composition." }
    ];

    const rules = [
        { label: "Squad Size", val: "15 - 25 Players", icon: Users },
        { label: "Max Mega Budget", val: "120.00 Crores", icon: IndianRupee },
        { label: "Max Mini Budget", val: "25.00 Crores", icon: IndianRupee },
        { label: "Overseas Limit", val: "Max 8 Players", icon: Trophy },
        { label: "Min Bid", val: "Base Price", icon: Zap },
        { label: "Auction Flow", val: "Retain & Release", icon: Clock }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-outfit selection:bg-primary/30 overflow-x-hidden">
            {/* Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full" />
            </div>

            {/* Top Navigation / Corner Branding */}
            <nav className="relative z-50 px-6 py-6 flex items-center justify-between max-w-7xl mx-auto">
                <div className="flex items-center gap-2">
                    <Trophy className="text-primary" size={24} />
                    <span className="font-black italic tracking-tighter text-lg uppercase text-slate-200">IPL <span className="text-primary">Arena</span></span>
                </div>
            </nav>

            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24">

                {/* 1. Centered Title Section */}
                <header className="pt-12 pb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter mb-4 uppercase">
                            IPL <span className="text-primary drop-shadow-[0_0_15px_rgba(59,130,246,0.5)]">Arena</span>
                        </h1>
                        <p className="text-slate-200 font-bold uppercase tracking-[0.3em] text-sm md:text-base">
                            The Ultimate Live Auction Experience
                        </p>
                    </motion.div>
                </header>

                {/* 2. Left-Aligned Auth Buttons */}
                <section className="mb-20">
                    <div className="max-w-md">
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-6 border-l-2 border-primary pl-4">Gateway Access</h2>
                        <div className="flex flex-col gap-4">
                            <motion.button
                                whileHover={{ scale: 1.02, x: 10 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="flex items-center justify-between p-6 bg-primary rounded-2xl shadow-xl shadow-primary/20 border border-primary/50 group"
                            >
                                <div className="flex items-center gap-4">
                                    <LogIn size={28} />
                                    <div className="text-left">
                                        <h3 className="font-black uppercase italic tracking-widest text-lg">Sign In</h3>
                                        <p className="text-white/90 text-[10px] font-black uppercase tracking-widest leading-none">Access your existing dashboard</p>
                                    </div>
                                </div>
                                <Zap size={20} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02, x: 10 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/register')}
                                className="flex items-center justify-between p-6 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <UserPlus size={28} className="text-primary" />
                                    <div className="text-left">
                                        <h3 className="font-black uppercase italic tracking-widest text-lg">Enrollment</h3>
                                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest leading-none">Join the league as a new official</p>
                                    </div>
                                </div>
                                <Zap size={20} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </motion.button>
                        </div>
                    </div>
                </section>

                {/* 3. User Manual (How to Play) */}
                <section className="mb-20">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 italic text-white/90">
                        <PlayCircle size={28} className="text-primary" />
                        User Manual: How to Play
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <div key={i} className="p-8 bg-slate-900/60 border border-white/5 rounded-3xl hover:border-primary/30 transition-all group relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <span className="text-8xl font-black italic">{i + 1}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black mb-6 border border-primary/20">
                                    {i + 1}
                                </div>
                                <h3 className="text-lg font-black uppercase italic tracking-tight mb-3 text-white">
                                    {step.title}
                                </h3>
                                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Official Rules */}
                <section className="mb-16">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 italic text-white/90">
                        <ShieldCheck size={28} className="text-primary" />
                        Tournament Rules
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rules.map((rule, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-slate-900/40 border border-white/5 rounded-2xl">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                        <rule.icon size={20} />
                                    </div>
                                    <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">{rule.label}</span>
                                </div>
                                <span className="text-primary font-black italic">{rule.val}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-center gap-4">
                        < Zap size={18} className="text-amber-500" />
                        <p className="text-xs text-amber-500/80 font-black uppercase tracking-[0.2em] italic text-center">
                            Valid squads must have at least 1 WK and 4 Bowlers minimum.
                        </p>
                    </div>
                </section>

                {/* 5. Contact Section */}
                <section id="contact" className="text-center pt-8 pb-20">
                    <motion.div
                        whileInView={{ opacity: 1, scale: 1 }}
                        initial={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <Handshake size={32} className="text-primary" />
                        </div>
                        <h2 className="text-3xl font-black text-white mb-3 uppercase italic tracking-tighter">Support</h2>
                        <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto font-medium italic">
                            Technical issues or feedback? Contact the official team.
                        </p>
                        <a
                            href="https://mail.google.com/mail/?view=cm&fs=1&to=iplarena.app@gmail.com&su=IPL Arena Support - Feedback/Query"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-col items-center gap-2 px-10 py-5 bg-white/5 hover:bg-primary text-white border border-white/10 rounded-2xl font-black transition-all shadow-2xl group min-w-[320px]"
                        >
                            <div className="flex items-center gap-3 text-2xl" id="start-conversation">
                                <Mail size={32} />
                                Start Conversation
                                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                            </div>
                            <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 group-hover:text-white/70">
                                iplarena.app@gmail.com
                            </span>
                        </a>
                        <footer className="mt-20">
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.6em] mb-4">
                                IPL ARENA • SECURE SYSTEM
                            </p>
                        </footer>
                    </motion.div>
                </section>
            </main>
        </div>
    );
};

export default Portal;
