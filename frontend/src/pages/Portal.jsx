import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LogIn,
    UserPlus,
    Info,
    ShieldCheck,
    Mail,
    Trophy,
    Zap,
    Clock,
    DollarSign,
    Users,
    ChevronRight,
    Gavel,
    PlayCircle
} from 'lucide-react';
import { loginAPI, registerAPI } from '../services/api';

const Portal = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('auth'); // 'auth' | 'how-to' | 'rules' | 'contact'
    const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'

    // Auth State
    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await loginAPI(loginData.email, loginData.password);
            if (data.success) {
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('authUser', JSON.stringify(data.user));
                navigate('/welcome');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (registerData.password !== registerData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        setLoading(true);
        try {
            const data = await registerAPI({
                name: registerData.name,
                email: registerData.email,
                password: registerData.password
            });
            if (data.success) {
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('authUser', JSON.stringify(data.user));
                navigate('/welcome');
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

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
                                className="h-full flex flex-col"
                            >
                                <div className="flex gap-4 p-1 bg-black/40 rounded-xl mb-8 border border-white/5">
                                    <button
                                        onClick={() => setAuthMode('login')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'login' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        Log In
                                    </button>
                                    <button
                                        onClick={() => setAuthMode('register')}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${authMode === 'register' ? 'bg-primary text-white shadow-md' : 'text-slate-500 hover:text-white'}`}
                                    >
                                        Register
                                    </button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                                    {authMode === 'login' ? (
                                        <form onSubmit={handleLogin} className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={loginData.email}
                                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                    placeholder="Enter your email"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Password</label>
                                                <input
                                                    type="password"
                                                    value={loginData.password}
                                                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-4 px-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                    placeholder="Enter your password"
                                                    required
                                                />
                                            </div>
                                            {error && <p className="text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 italic">⚠️ {error}</p>}
                                            <button
                                                disabled={loading}
                                                className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                {loading ? 'Processing...' : 'Access Arena'}
                                                {!loading && <ChevronRight size={18} />}
                                            </button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleRegister} className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Full Name</label>
                                                <input
                                                    type="text"
                                                    value={registerData.name}
                                                    onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                    placeholder="Enter your name"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Email Address</label>
                                                <input
                                                    type="email"
                                                    value={registerData.email}
                                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                    placeholder="Enter your email"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Create Password</label>
                                                <input
                                                    type="password"
                                                    value={registerData.password}
                                                    onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                    placeholder="Min. 3 characters"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-widest">Confirm Password</label>
                                                <input
                                                    type="password"
                                                    value={registerData.confirmPassword}
                                                    onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 px-4 text-white focus:outline-none focus:border-primary/50 transition-all placeholder:text-slate-700"
                                                    placeholder="Repeat password"
                                                    required
                                                />
                                            </div>
                                            {error && <p className="text-red-500 text-xs font-bold bg-red-500/10 p-3 rounded-lg border border-red-500/20 italic">⚠️ {error}</p>}
                                            <button
                                                disabled={loading}
                                                className="w-full py-4 bg-primary text-white font-black rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                            >
                                                {loading ? 'Creating...' : 'Enroll Official'}
                                                {!loading && <ChevronRight size={18} />}
                                            </button>
                                        </form>
                                    )}
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

            <style htm="true">{`
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
