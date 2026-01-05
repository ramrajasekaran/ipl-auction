import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Lock, Hash, User, Crown, Users, DollarSign, ArrowRight } from 'lucide-react';
import axios from 'axios';

const MiniAuctionPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('manager'); // 'manager' | 'team'
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        roomId: '',
        password: '',
        teamName: '',
        budget: ''
    });

    const handleRoomIdChange = (e) => {
        setFormData({ ...formData, roomId: e.target.value.toUpperCase() });
    };

    const handleManagerContinue = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/mini-auction/manager-continue`,
                {
                    roomId: formData.roomId,
                    password: formData.password,
                    budget: formData.budget ? parseFloat(formData.budget) : 25
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                localStorage.setItem('miniAuctionId', response.data.miniAuctionId);
                localStorage.setItem('isManager', 'true');
                localStorage.setItem('miniAuctionBudget', response.data.budget);

                navigate(`/mini-auction/${response.data.miniAuctionId}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid Credentials");
        } finally {
            setLoading(false);
        }
    };

    const handleTeamContinue = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = localStorage.getItem('authToken');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/mini-auction/team-continue`,
                {
                    roomId: formData.roomId,
                    teamName: formData.teamName,
                    password: formData.password
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                localStorage.setItem('miniAuctionId', response.data.miniAuctionId);
                localStorage.setItem('teamId', response.data.teamId);
                localStorage.setItem('isManager', 'false');

                navigate(`/mini-auction/${response.data.miniAuctionId}/release`);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Invalid Credentials or Team not found");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative">
            <motion.button
                onClick={() => navigate('/welcome')}
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
                    <p className="text-slate-400 text-sm">Continue from a completed mega auction</p>
                </div>

                <div className="flex gap-4 mb-8 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => { setActiveTab('manager'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'manager' ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Crown size={16} />
                        Manager
                    </button>
                    <button
                        onClick={() => { setActiveTab('team'); setError(''); }}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${activeTab === 'team' ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-lg shadow-green-500/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Users size={16} />
                        Team Owner
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
                                onSubmit={handleManagerContinue}
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
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 uppercase"
                                            placeholder="ABC123"
                                            required
                                            maxLength={6}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Manager Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                                            placeholder="Your manager password"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Mini Auction Budget</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="number"
                                            value={formData.budget}
                                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-16 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                                            placeholder="25"
                                            min="1"
                                            max="25"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">Cr</span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">Default: 25 Cr (Max: 25 Cr)</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-xl text-white font-semibold shadow-lg shadow-purple-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Crown size={20} />
                                            Start Mini Auction
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="team"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleTeamContinue}
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
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600 uppercase"
                                            placeholder="ABC123"
                                            required
                                            maxLength={6}
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
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                            placeholder="Your team name"
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
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                            placeholder="Your team password"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-xl text-white font-semibold shadow-lg shadow-green-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Validating...
                                        </>
                                    ) : (
                                        <>
                                            <Users size={20} />
                                            Continue to Mini Auction
                                            <ArrowRight size={18} />
                                        </>
                                    )}
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>

                {/* Info Box */}
                <div className="mt-6 glass-panel p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-2">
                        {activeTab === 'manager' ? 'Manager Access:' : 'Team Owner Access:'}
                    </h3>
                    <ul className="text-xs text-slate-400 space-y-1">
                        {activeTab === 'manager' ? (
                            <>
                                <li>✓ Mega auction must be completed</li>
                                <li>✓ Use same room password from mega auction</li>
                                <li>✓ Set budget for all teams (1-25 Cr)</li>
                                <li>✓ Control the mini auction as auctioneer</li>
                            </>
                        ) : (
                            <>
                                <li>✓ Mega auction must be completed</li>
                                <li>✓ Team must have 15-25 players</li>
                                <li>✓ Use same team credentials from mega auction</li>
                                <li>✓ Release unwanted players before mini auction</li>
                            </>
                        )}
                    </ul>
                </div>
            </motion.div>
        </div>
    );
};

export default MiniAuctionPage;
