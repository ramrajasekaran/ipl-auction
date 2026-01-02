import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Lock, Hash, Shield } from 'lucide-react';
import { useGame } from '../context/GameContext';

const ContestantAuth = () => {
    const navigate = useNavigate();
    const { joinGame, rejoinTeam, setUserRole } = useGame();
    const [activeTab, setActiveTab] = useState('join'); // 'join' | 'continue'

    const [formData, setFormData] = useState({
        teamName: '',
        roomId: '',
        password: ''
    });

    const handleJoinGame = async (e) => {
        e.preventDefault();
        try {
            // Get logged in user email
            const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
            const userEmail = authUser.email || '';

            await joinGame(formData.roomId, formData.teamName, userEmail, formData.password);
            setUserRole('CONTESTANT');
            alert("✅ Successfully Joined!\nYou have created your team-specific password. Keep it safe for re-entry.");
            navigate(`/auction/${formData.roomId}`);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to join room";
            alert(`Error: ${msg}`);
        }
    };

    const handleContinueGame = async (e) => {
        e.preventDefault();
        try {
            await rejoinTeam(formData.roomId, formData.teamName, formData.password);
            setUserRole('CONTESTANT');
            alert("✅ Welcome Back!\nYour credentials match our records.");
            navigate(`/auction/${formData.roomId}`);
        } catch (error) {
            const msg = error.response?.data?.message || "Invalid Team Name or Password";
            alert(`Error: ${msg}\n\nPlease ensure you use the same password created during your first join.`);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
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
                <div className="flex gap-4 mb-8 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('join')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'join' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Join Room
                    </button>
                    <button
                        onClick={() => setActiveTab('continue')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'continue' ? 'bg-green-600 text-white shadow-lg shadow-green-600/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Continue
                    </button>
                </div>

                <div className="text-center mb-8">
                    <h2 className="text-3xl font-bold text-white mb-2">
                        {activeTab === 'join' ? "New Team Registration" : "Team Entry"}
                    </h2>
                    <p className="text-slate-400 mb-4 px-4">
                        {activeTab === 'join'
                            ? "Join an auction room and create your own team password."
                            : `Continuing as ${JSON.parse(localStorage.getItem('authUser') || '{}').email || 'registered user'}`}
                    </p>
                </div>

                <div className="glass-panel p-8 rounded-2xl">
                    <form onSubmit={activeTab === 'join' ? handleJoinGame : handleContinueGame} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Room ID</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.roomId}
                                    onChange={(e) => setFormData({ ...formData, roomId: e.target.value.trim().toUpperCase() })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600 uppercase"
                                    placeholder="ENTER-CODE"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Team Name</label>
                            <div className="relative">
                                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.teamName}
                                    onChange={(e) => setFormData({ ...formData, teamName: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Your official team name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                {activeTab === 'join' ? "Create Team Password" : "Team Password"}
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Secret pin for re-entry"
                                    required
                                />
                            </div>
                            {activeTab === 'join' && (
                                <p className="text-[10px] text-slate-500 mt-2">
                                    This password is JUST for your team. You'll need it to resume if your session expires.
                                </p>
                            )}
                        </div>

                        {/* Forgot Password link - only show on Continue tab */}
                        {activeTab === 'continue' && (
                            <button
                                type="button"
                                onClick={() => {
                                    const authUser = JSON.parse(localStorage.getItem('authUser') || '{}');
                                    const email = authUser.email || '';
                                    navigate(`/reset-password?type=team&roomId=${formData.roomId}&teamName=${encodeURIComponent(formData.teamName)}&email=${encodeURIComponent(email)}`);
                                }}
                                className="text-amber-500 hover:underline text-xs text-center w-full"
                            >
                                Forgot Password? Click here to reset
                            </button>
                        )}

                        <button type="submit" className="w-full py-4 bg-green-600 rounded-xl text-white font-semibold shadow-lg shadow-green-600/25 hover:shadow-green-600/40 hover:bg-green-500 transition-all flex items-center justify-center gap-2">
                            {activeTab === 'join' ? <Users size={20} /> : <Shield size={20} />}
                            {activeTab === 'join' ? "Register Team" : "Resume Bidding"}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ContestantAuth;
