import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Copy, Check, ExternalLink } from 'lucide-react';

const MailOptionsModal = ({ isOpen, onClose }) => {
    const [copied, setCopied] = useState(false);
    const email = "iplarena.app@gmail.com";
    const subject = "IPL Arena Support - Feedback/Query";
    const body = "Hello IPL Arena Team,\n\nI have the following feedback/query:\n\n[Your message here]\n\nRegards,\n[Your Name]";

    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);

    const mailOptions = [
        {
            name: "Gmail",
            icon: "https://www.google.com/images/icons/product/search-32.gif", // Generic placeholder or we can use Lucide
            color: "hover:bg-red-500/10 hover:border-red-500/50",
            href: `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${encodedSubject}&body=${encodedBody}`
        },
        {
            name: "Outlook Web",
            color: "hover:bg-blue-500/10 hover:border-blue-500/50",
            href: `https://outlook.office.com/mail/deeplink/compose?to=${email}&subject=${encodedSubject}&body=${encodedBody}`
        },
        {
            name: "Yahoo Mail",
            color: "hover:bg-purple-500/10 hover:border-purple-500/50",
            href: `https://compose.mail.yahoo.com/?to=${email}&subj=${encodedSubject}&body=${encodedBody}`
        },
        {
            name: "Default Mail App",
            color: "hover:bg-slate-700/50 hover:border-slate-500/50",
            href: `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`
        }
    ];

    const copyToClipboard = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Mail className="text-primary" size={20} />
                                </div>
                                <h3 className="text-xl font-bold text-white italic uppercase tracking-tighter">Contact Support</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            <p className="text-slate-400 text-sm font-medium italic mb-2 px-2">
                                Choose your preferred mail provider to send us a message:
                            </p>

                            <div className="grid grid-cols-1 gap-3">
                                {mailOptions.map((option) => (
                                    <a
                                        key={option.name}
                                        href={option.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`flex items-center justify-between p-4 rounded-xl border border-white/5 bg-white/5 transition-all group ${option.color}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-slate-200 group-hover:text-white">{option.name}</span>
                                        </div>
                                        <ExternalLink size={16} className="text-slate-500 group-hover:text-white transition-colors" />
                                    </a>
                                ))}
                            </div>

                            <div className="pt-4 mt-4 border-t border-white/5">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/50 border border-white/5">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Or just copy email</span>
                                        <span className="text-slate-200 font-mono text-sm">{email}</span>
                                    </div>
                                    <button
                                        onClick={copyToClipboard}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-sm font-bold active:scale-95"
                                    >
                                        {copied ? (
                                            <>
                                                <Check size={16} className="text-green-500" />
                                                <span className="text-green-500">Copied!</span>
                                            </>
                                        ) : (
                                            <>
                                                <Copy size={16} className="text-primary" />
                                                <span>Copy</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-950/30 text-center">
                            <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.2em]">
                                We usually respond within 24-48 hours.
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default MailOptionsModal;
