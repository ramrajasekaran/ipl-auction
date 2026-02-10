import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { authAPI } from '../services/api';
import { pageVariants } from '../utils/animations';

const Login = () => {
    const navigate = useNavigate();
    const setAuth = useAuthStore((state) => state.setAuth);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const value = e.target.name === 'email' ? e.target.value.toLowerCase() : e.target.value;
        setFormData({ ...formData, [e.target.name]: value });
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await authAPI.login(formData);
            const { token, user } = response.data;

            setAuth(token, user);

            // Navigate based on role
            if (user.role === 'AUCTIONEER') {
                navigate('/auctioneer');
            } else {
                navigate('/team-owner');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="min-h-screen flex items-center justify-center bg-gradient-bg p-4"
        >
            <div className="w-full max-w-md">
                {/* Logo/Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-2">
                        IPL Auction
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base">
                        Production-grade live bidding platform
                    </p>
                </div>

                {/* Login Form */}
                <div className="glass-card">
                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">
                        Welcome Back
                    </h2>

                    {error && (
                        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="your.email@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="input-field"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Signing In...' : 'Sign In'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400 text-sm">
                            Don't have an account?{' '}
                            <Link to="/register" className="text-primary-400 hover:text-primary-300 font-semibold">
                                Register
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Demo Credentials Hint */}
                <div className="mt-4 glass rounded-lg p-4">
                    <p className="text-xs text-gray-500 text-center">
                        💡 New user? Register to create your account
                    </p>
                </div>
            </div>
        </motion.div>
    );
};

export default Login;
