import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Lock, Hash, User, ShieldCheck } from 'lucide-react';
import { useGame } from '../context/GameContext';

const MiniAuctionPage = () => {
    const navigate = useNavigate();
    const { resumeGame, rejoinTeam, setUserRole } = useGame();
    const [activeTab, setActiveTab] = useState('manager'); // 'manager' | 'team'
    const [error, setError] = useState('');

    const [formData, setFormData] = useState({
        roomId: '',
        password: '',
        teamName: '' // Only for team login
    });

    const handleRoomIdChange = (e) => {
        setFormData({ ...formData, roomId: e.target.value.toUpperCase() });
    };

    const handleManagerResume = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await resumeGame(formData.roomId, formData.password);
            setUserRole('MANAGER');
            navigate(`/auction/${formData.roomId}`);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid Credentials");
        }
    };

    const handleTeamRejoin = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await rejoinTeam(formData.roomId, formData.teamName, formData.password);
            setUserRole('CONTESTANT');
            navigate(`/auction/${formData.roomId}`);
        } catch (err) {
            setError(err.response?.data?.message || "Invalid Credentials or Team not found");
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
            <motion.button
                onClick={() => navigate('/')}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
            >
                <ArrowLeft />
            </motion.button>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Mini Auction</h1>
                    <p className="text-slate-400 text-sm">Resume play with existing teams only.</p>
                </div>

                <div className="flex gap-4 mb-8 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => { setActiveTab('manager'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'manager' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Manager Login
                    </button>
                    <button
                        onClick={() => { setActiveTab('team'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'team' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Team Owner Login
                    </button>
                </div>

                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                    {error && (
                        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-xs text-center">
                            {error}
                        </div>
                    )}

                    <AnimatePresence mode='wait'>
                        {activeTab === 'manager' ? (
                            <motion.form
                                key="manager"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleManagerResume}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Room ID</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={formData.roomId}
                                            onChange={handleRoomIdChange}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600 uppercase"
                                            placeholder="ENTER-ID"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                            placeholder="Access code"
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-primary rounded-xl text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                    <ShieldCheck size={20} />
                                    Verify & Resume
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="team"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleTeamRejoin}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Room ID</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={formData.roomId}
                                            onChange={handleRoomIdChange}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600 uppercase"
                                            placeholder="ENTER-ID"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Team Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={formData.teamName}
                                            onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                            placeholder="Existing Team Name"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Team Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                            placeholder="Your Team Password"
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="w-full py-4 bg-primary rounded-xl text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                    <Save size={20} />
                                    Login & Join
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
};

export default MiniAuctionPage;
