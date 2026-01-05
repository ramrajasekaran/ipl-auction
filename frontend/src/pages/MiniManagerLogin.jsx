import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Crown, Lock, Trophy, DollarSign } from 'lucide-react';
import axios from 'axios';

const MiniManagerLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        roomId: '',
        password: '',
        budget: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
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

                // Navigate to mini auction room
                navigate(`/mini-auction/${response.data.miniAuctionId}`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to continue as manager');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-bg flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200 }}
                        className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/30"
                    >
                        <Crown size={40} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2">Manager Login</h1>
                    <p className="text-slate-400">Continue your mega auction room to mini auction</p>
                </div>

                {/* Form */}
                <div className="glass-panel p-8 rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Mega Auction Room ID
                            </label>
                            <div className="relative">
                                <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.roomId}
                                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value.toUpperCase() })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder:text-slate-600 uppercase"
                                    placeholder="ABC123"
                                    required
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Manager Password
                            </label>
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
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Mini Auction Budget
                            </label>
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

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm"
                            >
                                {error}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-purple-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Validating...
                                </>
                            ) : (
                                <>
                                    Start Mini Auction
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => navigate('/mini-auction')}
                            className="text-sm text-slate-400 hover:text-white transition-colors"
                        >
                            ← Back to Mini Auction
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 glass-panel p-4 rounded-xl">
                    <h3 className="text-sm font-bold text-white mb-2">Manager Access:</h3>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Mega auction must be completed</li>
                        <li>✓ Use same room password from mega auction</li>
                        <li>✓ Set budget for all teams (1-25 Cr)</li>
                        <li>✓ Control the mini auction as auctioneer</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
};

export default MiniManagerLogin;
