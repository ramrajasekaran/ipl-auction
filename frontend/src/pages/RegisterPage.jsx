import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, UserPlus, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { registerAPI } from '../services/api';

const RegisterPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 3) {
            setError('Password must be at least 3 characters');
            return;
        }

        setLoading(true);

        try {
            const data = await registerAPI({
                name: formData.name,
                email: formData.email,
                password: formData.password
            });

            if (data.success) {
                // Store token and user data
                sessionStorage.setItem('authToken', data.token);
                sessionStorage.setItem('authUser', JSON.stringify(data.user));

                // Redirect to welcome screen
                navigate('/');
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Registration failed. Please try again.';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-screen flex flex-col items-center justify-center p-4 overflow-hidden">
            {/* Exit Button */}
            <motion.button
                onClick={() => navigate('/portal')}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-8 left-8 p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors z-50"
                title="Back to Portal"
            >
                <ArrowLeft size={24} />
            </motion.button>

            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-green-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[20%] w-[50%] h-[50%] bg-teal-600/10 blur-[120px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo/Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
                    <p className="text-slate-400">Join IPL Auction as a participant</p>
                </div>

                {/* Register Form */}
                <div className="glass-panel p-8 rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Your full name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="you@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Create a password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>

                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-12 text-white focus:outline-none focus:border-green-500/50 focus:ring-1 focus:ring-green-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="Confirm your password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm text-center flex flex-col gap-1"
                            >
                                <span>⚠️ {error}</span>
                                {error.toLowerCase().includes('exists') && (
                                    <Link to={`/reset-password?type=user&email=${formData.email}`} className="text-xs text-green-500 hover:underline font-bold">
                                        Forgot password? Reset here
                                    </Link>
                                )}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-green-600 rounded-xl text-white font-semibold shadow-lg shadow-green-600/25 hover:shadow-green-600/40 hover:bg-green-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-slate-500 text-sm">
                            Already have an account?{' '}
                            <Link to="/login" className="text-green-500 hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default RegisterPage;
