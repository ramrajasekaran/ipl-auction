import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { verifyEmailAPI } from '../services/api';

const VerifyEmail = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verify = async () => {
            try {
                const data = await verifyEmailAPI(token);
                if (data.success) {
                    setStatus('success');
                    setMessage(data.message);
                }
            } catch (error) {
                setStatus('error');
                setMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
            }
        };

        if (token) {
            verify();
        } else {
            setStatus('error');
            setMessage('No verification token provided.');
        }
    }, [token]);

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-ipl-blue/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[20%] w-[50%] h-[50%] bg-gold/10 blur-[120px] rounded-full mix-blend-overlay" />
            </div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md relative z-10 glass-panel p-8 rounded-2xl text-center"
            >
                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <Loader2 className="w-16 h-16 text-primary animate-spin" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verifying Email</h2>
                        <p className="text-slate-400">Please wait while we verify your email address...</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <CheckCircle className="w-16 h-16 text-green-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verified Successfully!</h2>
                        <p className="text-slate-400">{message}</p>
                        <button
                            onClick={() => navigate('/login')}
                            className="w-full py-4 bg-primary rounded-xl text-white font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                        >
                            Back to Login <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-6">
                        <div className="flex justify-center">
                            <XCircle className="w-16 h-16 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Verification Failed</h2>
                        <p className="text-slate-400">{message}</p>
                        <div className="space-y-3">
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-white font-semibold hover:bg-white/10 transition-all"
                            >
                                Back to Login
                            </button>
                            <p className="text-xs text-slate-500">
                                Need help? <Link to="/portal" className="text-primary hover:underline">Contact Support</Link>
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
