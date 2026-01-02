import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Lock, Mail, Hash, Shield, Key, Send, CheckCircle } from 'lucide-react';
import { sendResetOTPAPI, verifyOTPAPI, resetPasswordOTPAPI } from '../services/api';

const ResetPassword = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const type = searchParams.get('type') || 'user'; // 'team' | 'manager' | 'user'

    // Multi-step form: 1 = email, 2 = OTP, 3 = new password, 4 = success
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState({
        email: searchParams.get('email') || '',
        roomId: searchParams.get('roomId') || '',
        teamName: searchParams.get('teamName') || '',
        otpCode: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [message, setMessage] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOTP = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            const payload = {
                email: formData.email,
                type: type.toUpperCase(),
                roomId: formData.roomId || undefined,
                teamName: formData.teamName || undefined
            };

            const data = await sendResetOTPAPI(payload);

            if (data.success) {
                setMessage({ type: 'success', text: '✅ OTP sent to your email! Check your inbox.' });
                setStep(2);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to send OTP. Please try again.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });
        setLoading(true);

        try {
            const data = await verifyOTPAPI({
                email: formData.email,
                code: formData.otpCode,
                type: type.toUpperCase()
            });

            if (data.success) {
                setMessage({ type: 'success', text: '✅ OTP Verified! You can now create a new password.' });
                setStep(3);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Invalid or expired OTP. Please try again.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: 'Passwords do not match!' });
            return;
        }

        if (formData.newPassword.length < 3) {
            setMessage({ type: 'error', text: 'Password must be at least 3 characters!' });
            return;
        }

        setLoading(true);
        try {
            const payload = {
                email: formData.email,
                code: formData.otpCode,
                newPassword: formData.newPassword,
                type: type.toUpperCase(),
                roomId: formData.roomId || undefined,
                teamName: formData.teamName || undefined
            };

            const data = await resetPasswordOTPAPI(payload);

            if (data.success) {
                setMessage({ type: 'success', text: '✅ Password reset successfully! Redirecting...' });
                setStep(4);
                setTimeout(() => {
                    if (type === 'manager') {
                        navigate('/manager-auth');
                    } else if (type === 'team') {
                        navigate('/contestant-auth');
                    } else {
                        navigate('/login');
                    }
                }, 2000);
            }
        } catch (error) {
            const msg = error.response?.data?.message || 'Something went wrong. Please try again.';
            setMessage({ type: 'error', text: msg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
            <motion.button
                onClick={() => navigate(-1)}
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
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/20 mb-4">
                        <Key size={32} className="text-amber-500" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
                    <p className="text-slate-400">
                        {step === 1 && 'Enter your email to receive a verification code'}
                        {step === 2 && 'Enter the OTP code sent to your email'}
                        {step === 3 && 'Create your new secure password'}
                        {step === 4 && '✅ Password reset complete!'}
                    </p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step >= s
                                ? 'bg-amber-500 text-white'
                                : 'bg-white/10 text-slate-500'
                                }`}>
                                {step > s ? '✓' : s}
                            </div>
                            {s < 4 && (
                                <div className={`w-8 h-0.5 ${step > s ? 'bg-amber-500' : 'bg-white/10'}`} />
                            )}
                        </div>
                    ))}
                </div>

                <div className="glass-panel p-8 rounded-2xl">
                    {/* Step 1: Email Input */}
                    {step === 1 && (
                        <form onSubmit={handleSendOTP} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                                        placeholder="your-email@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            {type === 'manager' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Room Code</label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            value={formData.roomId}
                                            onChange={(e) => setFormData({ ...formData, roomId: e.target.value.toUpperCase() })}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600 uppercase"
                                            placeholder="ENTER-CODE"
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            {type === 'team' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">Room Code</label>
                                        <div className="relative">
                                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                            <input
                                                type="text"
                                                value={formData.roomId}
                                                onChange={(e) => setFormData({ ...formData, roomId: e.target.value.toUpperCase() })}
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600 uppercase"
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
                                                className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                                                placeholder="Your team name"
                                                required
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-lg text-sm text-center font-medium ${message.type === 'error'
                                        ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                        : 'bg-green-500/10 border border-green-500/20 text-green-500'
                                        }`}
                                >
                                    {message.text}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-amber-500 rounded-xl text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Send size={20} />
                                {loading ? 'Sending...' : 'Send OTP Code'}
                            </button>
                        </form>
                    )}

                    {/* Step 2: OTP Verification */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOTP} className="space-y-6">
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg text-center">
                                <p className="text-amber-300 text-sm">
                                    📧 OTP sent to <strong>{formData.email}</strong>
                                </p>
                                <p className="text-slate-400 text-xs mt-1">Check your inbox (and spam folder)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Enter 6-Digit OTP</label>
                                <input
                                    type="text"
                                    value={formData.otpCode}
                                    onChange={(e) => setFormData({ ...formData, otpCode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl py-4 text-center text-2xl tracking-[0.5em] font-mono text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                                    placeholder="000000"
                                    maxLength={6}
                                    required
                                />
                            </div>

                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-lg text-sm text-center font-medium ${message.type === 'error'
                                        ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                        : 'bg-green-500/10 border border-green-500/20 text-green-500'
                                        }`}
                                >
                                    {message.text}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading || formData.otpCode.length !== 6}
                                className="w-full py-4 bg-amber-500 rounded-xl text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Shield size={20} />
                                {loading ? 'Verifying...' : 'Verify OTP Code'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-slate-400 hover:text-white text-sm"
                            >
                                ← Back to email
                            </button>
                        </form>
                    )}

                    {/* Step 3: Password Creation */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                                <p className="text-green-300 text-sm font-medium">
                                    ✅ OTP Verified!
                                </p>
                                <p className="text-slate-400 text-xs mt-1">Please set your new password below.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">New Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                                        placeholder="Enter new password"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="password"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all placeholder:text-slate-600"
                                        placeholder="Confirm new password"
                                        required
                                    />
                                </div>
                            </div>

                            {message.text && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-3 rounded-lg text-sm text-center font-medium ${message.type === 'error'
                                        ? 'bg-red-500/10 border border-red-500/20 text-red-500'
                                        : 'bg-green-500/10 border border-green-500/20 text-green-500'
                                        }`}
                                >
                                    {message.text}
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-amber-500 rounded-xl text-white font-semibold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                <Key size={20} />
                                {loading ? 'Saving...' : 'Reset Password & Proceed'}
                            </button>
                        </form>
                    )}

                    {/* Step 4: Success */}
                    {step === 4 && (
                        <div className="text-center py-8">
                            <CheckCircle size={64} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">Password Reset!</h3>
                            <p className="text-slate-400">You can now sign in and participate in the auction.</p>
                            <p className="text-slate-500 text-xs mt-4 italic">Redirecting you to login automatically...</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default ResetPassword;
