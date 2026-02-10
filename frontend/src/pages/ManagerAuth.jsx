import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Play, Lock, Hash, IndianRupee } from 'lucide-react';
import { useGame } from '../context/GameContext';

const ManagerAuth = () => {
    const navigate = useNavigate();
    const { createGame, resumeGame, setUserRole } = useGame();
    const [activeTab, setActiveTab] = useState('new'); // 'new' | 'continue'

    const [formData, setFormData] = useState({
        budget: '',
        password: '',
        roomId: ''
    });

    const [errorMsg, setErrorMsg] = useState('');

    const handleCreateGame = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            const id = await createGame(formData.budget, formData.password);
            setUserRole('MANAGER');
            navigate(`/setup-players/${id}`);
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Unknown error";
            setErrorMsg(msg);
        }
    };

    const handleContinueGame = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        try {
            await resumeGame(formData.roomId, formData.password);
            setUserRole('MANAGER');
            navigate(`/auction/${formData.roomId}`);
        } catch (error) {
            const msg = error.response?.data?.message || "Invalid Room Code or Password";
            setErrorMsg(msg);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
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
                <div className="flex gap-4 mb-8 bg-black/20 p-2 rounded-xl backdrop-blur-sm">
                    <button
                        onClick={() => setActiveTab('new')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'new' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        New Game
                    </button>
                    <button
                        onClick={() => setActiveTab('continue')}
                        className={`flex-1 py-3 text-sm font-medium rounded-lg transition-all ${activeTab === 'continue' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                    >
                        Continue Game
                    </button>
                </div>

                <div className="glass-panel p-8 rounded-2xl relative overflow-hidden">
                    <AnimatePresence mode='wait'>
                        {activeTab === 'new' ? (
                            <motion.form
                                key="new"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleCreateGame}
                                className="space-y-6"
                            >
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Auction Budget (Cr)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={formData.budget}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                    setFormData({ ...formData, budget: val });
                                                }
                                            }}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                            placeholder="90-120"
                                            required
                                        />
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2">Budget must be between 90-120 Crores.</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Create Password</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="password"
                                            value={formData.password}
                                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600"
                                            placeholder="Secure access code"
                                            required
                                        />
                                    </div>
                                </div>
                                {errorMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center font-medium"
                                    >
                                        ⚠️ {errorMsg}
                                    </motion.div>
                                )}

                                <button type="submit" className="w-full py-4 bg-primary rounded-xl text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                    <Play size={20} />
                                    Start Auction
                                </button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="continue"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleContinueGame}
                                className="space-y-6"
                            >
                                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg mb-4">
                                    <p className="text-xs text-yellow-200/80 leading-relaxed mb-2">
                                        Enter the <strong>Room Code</strong> and <strong>Password</strong> that were saved when the auction was created.
                                        We will verify these details with the database.
                                        Access will be granted only if both match the stored records.
                                    </p>
                                    <p className="text-[10px] text-yellow-200/60 mt-2 border-t border-yellow-500/20 pt-2">
                                        🔐 <strong>For security reasons</strong>, both the Room Code and Password must match the values stored in the database.
                                        If either one is incorrect, access will be denied.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Room Code</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={formData.roomId}
                                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value.trim().toUpperCase() })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-slate-600 uppercase"
                                            placeholder="ENTER-CODE"
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
                                {errorMsg && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center font-medium"
                                    >
                                        ⚠️ {errorMsg}
                                    </motion.div>
                                )}

                                {/* Forgot Password Link */}
                                <button
                                    type="button"
                                    onClick={() => {
                                        const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
                                        const email = authUser.email || '';
                                        navigate(`/reset-password?type=manager&roomId=${formData.roomId}&email=${encodeURIComponent(email)}`);
                                    }}
                                    className="block w-full text-amber-500 hover:underline text-xs text-center transition-colors"
                                >
                                    Forgot Password? Click to reset
                                </button>

                                <button type="submit" className="w-full py-4 bg-primary rounded-xl text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all flex items-center justify-center gap-2">
                                    <Save size={20} />
                                    Resume Auction
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div >
        </div >
    );
};

export default ManagerAuth;
