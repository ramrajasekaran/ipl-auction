import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Lock, Trophy, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const MiniTeamLogin = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        roomId: '',
        teamName: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const token = sessionStorage.getItem('authToken');
            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE || 'http://localhost:5000/api'}/mini-auction/team-continue`,
                {
                    roomId: formData.roomId,
                    teamName: formData.teamName,
                    password: formData.password
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                    withCredentials: true
                }
            );

            if (response.data.success) {
                sessionStorage.setItem('miniAuctionId', response.data.miniAuctionId);
                sessionStorage.setItem('teamId', response.data.teamId);
                sessionStorage.setItem('isManager', 'false');

                // Navigate to player release page first
                navigate(`/mini-auction/${response.data.miniAuctionId}/release`);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to continue as team owner');
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
                        className="w-20 h-20 bg-gradient-to-br from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30"
                    >
                        <Users size={40} className="text-white" />
                    </motion.div>
                    <h1 className="text-3xl font-bold text-white mb-2">Team Owner Login</h1>
                    <p className="text-slate-400">Continue your team to mini auction</p>
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
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600 uppercase"
                                    placeholder="ABC123"
                                    required
                                    maxLength={6}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Team Name
                            </label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
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
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                Team Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Your team password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
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
                            className="w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Validating...
                                </>
                            ) : (
                                <>
                                    Continue to Mini Auction
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
                    <h3 className="text-sm font-bold text-white mb-2">Team Owner Access:</h3>
                    <ul className="text-xs text-slate-400 space-y-1">
                        <li>✓ Mega auction must be completed</li>
                        <li>✓ Team must have 15-25 players</li>
                        <li>✓ Use same team credentials from mega auction</li>
                        <li>✓ Release unwanted players before mini auction</li>
                    </ul>
                </div>
            </motion.div>
        </div>
    );
};

export default MiniTeamLogin;
