import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2 } from 'lucide-react';

const ManualDetailModal = ({ isOpen, onClose, stepData }) => {
    if (!stepData) return null;

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
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black border border-primary/20">
                                    {stepData.index + 1}
                                </div>
                                <h3 className="text-xl font-bold text-white italic uppercase tracking-tighter">{stepData.title}</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/5 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            <p className="text-lg text-slate-200 font-medium italic leading-relaxed">
                                {stepData.desc}
                            </p>

                            <div className="space-y-4">
                                {stepData.details.map((detail, idx) => (
                                    <div key={idx} className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-primary/30 transition-all">
                                        <div className="mt-1">
                                            <CheckCircle2 size={18} className="text-primary" />
                                        </div>
                                        <p className="text-slate-300 text-sm font-medium leading-relaxed">
                                            {detail}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-4 bg-slate-950/30 text-center border-t border-white/5">
                            <button
                                onClick={onClose}
                                className="px-8 py-2 bg-primary rounded-xl text-white font-black uppercase text-xs tracking-widest hover:bg-primary/80 transition-all active:scale-95"
                            >
                                Got it
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ManualDetailModal;
