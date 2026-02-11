import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
    LogIn,
    UserPlus,
    ShieldCheck,
    Mail,
    Trophy,
    Zap,
    Clock,
    IndianRupee,
    Users,
    PlayCircle,
    Handshake,
    ArrowRight,
    Heart
} from 'lucide-react';
import ManualDetailModal from '../components/ManualDetailModal';
import { createPaymentOrderAPI, verifyPaymentAPI } from '../services/api';

const Portal = () => {
    const navigate = useNavigate();
    const { scrollY } = useScroll();

    // Persistent values for navigation
    const navPadding = "12px";
    const navBg = "rgba(2, 6, 23, 0.8)";
    const navBlur = "blur(12px)";
    const navBorder = "rgba(255, 255, 255, 0.05)";

    const loadScript = (src) => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleFundDeveloper = async () => {
        const res = await loadScript('https://checkout.razorpay.com/v1/checkout.js');

        if (!res) {
            console.error('Razorpay SDK failed to load');
            alert('Razorpay SDK failed to load. Please check your internet connection.');
            return;
        }

        try {
            console.log('Creating payment order...');
            const data = await createPaymentOrderAPI(500); // 500 INR
            console.log('Payment order created:', data);

            const options = {
                key: data.key_id,
                amount: data.order.amount,
                currency: data.order.currency,
                name: "IPL Auction",
                description: "Support the Developer",
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await verifyPaymentAPI({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert(verifyRes.message || 'Payment successful!');
                    } catch (error) {
                        console.error('Payment verification error:', error);
                        alert('Payment verification failed. Please contact support.');
                    }
                },
                prefill: {
                    name: "Supporter",
                    email: "support@iplarena.com",
                    contact: "9999999999"
                },
                theme: {
                    color: "#ec4899"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error('Payment initiation error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
            alert(`Failed to initiate payment: ${errorMessage}\n\nPlease check the browser console for details.`);
        }
    };

    const steps = [
        {
            title: "Register & Access",
            desc: "Create your official IPL Arena account to start your journey.",
            details: [
                "Create your account as either a Team Owner or a Host.",
                "Verify your email to ensure secure access to the league.",
                "Access your personalized dashboard to manage rooms or teams."
            ]
        },
        {
            title: "Select Mode",
            desc: "Choose between Mega Auction (Fresh) or Mini Auction (Saved).",
            details: [
                "Mega Auction: Build a completely new team with the full player pool.",
                "Mini Auction: Retain players from previous seasons and bid for new ones.",
                "Choose the mode that fits your league's current status."
            ]
        },
        {
            title: "Create/Join Room",
            desc: "Host a room or join one as a Team Owner.",
            details: [
                "Hosts can create unique rooms and invite others via Room Codes.",
                "Team Owners join specific rooms to compete for players.",
                "Real-time synchronization ensures everyone starts at the same time."
            ]
        },
        {
            title: "Live Bidding",
            desc: "Bid in real-time. Manage your budget wisely!",
            details: [
                "Dynamic real-time bidding interface with synchronized timers.",
                "Purse management: Keep an eye on your remaining budget as you bid.",
                "Visual alerts and sound effects for high-stakes bidding moments."
            ]
        },
        {
            title: "Build the Squad",
            desc: "Aim for 15-25 players with valid team composition.",
            details: [
                "Strict squad requirements: 15-25 players total.",
                "Composition rules: Minimum 1 Wicket Keeper and 4 Bowlers.",
                "Overseas limit: Max 8 non-Indian players per squad."
            ]
        }
    ];

    const [selectedStep, setSelectedStep] = React.useState(null);
    const [isManualModalOpen, setIsManualModalOpen] = React.useState(false);

    const openStepDetail = (step, index) => {
        setSelectedStep({ ...step, index });
        setIsManualModalOpen(true);
    };

    const rules = [
        { label: "Squad Size", val: "15 - 25 Players", icon: Users },
        { label: "Max Mega Budget", val: "120.00 Crores", icon: IndianRupee },
        { label: "Max Mini Budget", val: "25.00 Crores", icon: IndianRupee },
        { label: "Overseas Limit", val: "Max 8 Players", icon: Trophy },
        { label: "Min Bid", val: "Base Price", icon: Zap },
        { label: "Auction Flow", val: "Retain & Release", icon: Clock }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-white font-outfit selection:bg-primary/30 overflow-x-hidden">
            {/* Background Decor */}
            {/* Arena Background Decor */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-ipl-blue/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[40%] bg-ipl-blue/10 blur-[100px] rounded-full mix-blend-overlay" />
            </div>

            {/* Top Navigation / Corner Branding */}
            <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
                <motion.nav
                    style={{
                        backgroundColor: navBg,
                        backdropFilter: navBlur,
                        WebkitBackdropFilter: navBlur,
                        paddingTop: navPadding,
                        paddingBottom: navPadding,
                        borderBottom: `1px solid ${navBorder}`
                    }}
                    className="w-full px-4 md:px-12 flex items-center justify-between transition-all duration-300"
                >
                    <div className="flex items-center gap-2">
                        <Trophy className="text-ipl-blue" size={20} />
                        <span className="font-black italic tracking-tighter text-base md:text-lg uppercase text-slate-200">IPL <span className="text-ipl-blue">Arena</span></span>
                    </div>
                    <button
                        onClick={handleFundDeveloper}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-gradient-to-r from-ipl-blue to-blue-600 hover:from-blue-500 hover:to-blue-600 text-white rounded-lg transition-all text-xs md:text-sm font-bold shadow-lg shadow-blue-900/40 whitespace-nowrap"
                    >
                        <span className="hidden sm:inline">Support Developer</span>
                        <span className="sm:hidden">Support</span>
                    </button>
                </motion.nav>
            </div>

            <main className="relative z-10 max-w-5xl mx-auto px-6 pb-24">

                {/* 1. Centered Title Section */}
                <header className="pt-8 md:pt-12 pb-10 md:pb-16 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black italic tracking-tighter mb-4 uppercase drop-shadow-2xl">
                            IPL <span className="text-ipl-blue drop-shadow-[0_0_15px_rgba(0,75,160,0.8)]">Arena</span>
                        </h1>
                        <p className="text-slate-200 font-bold uppercase tracking-[0.15em] md:tracking-[0.3em] text-xs md:text-base px-4">
                            The Ultimate Live Auction Experience
                        </p>
                    </motion.div>
                </header>

                {/* 2. Gateway Access Section */}
                <section className="mb-12 md:mb-20 max-w-4xl mx-auto">
                    <div className="flex items-center justify-center mb-10">
                        <div className="h-px w-12 bg-white/10" />
                        <h2 className="mx-4 text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Gateway Access</h2>
                        <div className="h-px w-12 bg-white/10" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/login')}
                            className="flex items-center justify-between p-5 md:p-8 bg-ipl-blue rounded-3xl shadow-2xl shadow-ipl-blue/20 border border-ipl-blue/50 group hover:shadow-ipl-blue/40 neon-border-blue relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-center gap-4 md:gap-6 relative z-10">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-black/20 flex items-center justify-center backdrop-blur-sm">
                                    <LogIn size={24} className="md:text-3xl text-white" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black uppercase italic tracking-widest text-xl md:text-2xl text-white">Sign In</h3>
                                    <p className="text-blue-100 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mt-1">Access Dashboard</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <ArrowRight size={18} className="text-white" />
                            </div>
                        </motion.button>

                        <motion.button
                            whileHover={{ scale: 1.02, y: -5 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate('/register')}
                            className="flex items-center justify-between p-5 md:p-8 bg-arena-dark/50 hover:bg-arena-dark/80 rounded-3xl border border-white/10 transition-all group backdrop-blur-md hover:border-ipl-blue/30"
                        >
                            <div className="flex items-center gap-4 md:gap-6">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                                    <UserPlus size={24} className="md:text-3xl text-ipl-blue" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black uppercase italic tracking-widest text-xl md:text-2xl text-white">Enrollment</h3>
                                    <p className="text-slate-400 text-[10px] md:text-[11px] font-bold uppercase tracking-widest mt-1">New Official Registration</p>
                                </div>
                            </div>
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-ipl-blue/10 transition-colors">
                                <Zap size={18} className="text-slate-500 group-hover:text-ipl-blue transition-colors" />
                            </div>
                        </motion.button>
                    </div>
                </section>

                {/* 3. User Manual (How to Play) */}
                <section className="mb-12 md:mb-20">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 italic text-white/90">
                        <PlayCircle size={28} className="text-primary" />
                        User Manual: How to Play
                    </h2>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {steps.map((step, i) => (
                            <motion.button
                                key={i}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => openStepDetail(step, i)}
                                className="text-left p-6 md:p-8 bg-arena-dark/60 border border-white/5 rounded-3xl hover:border-ipl-blue/30 transition-all group relative overflow-hidden shadow-lg"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                                    <span className="text-8xl font-black italic">{i + 1}</span>
                                </div>
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-black mb-6 border border-primary/20">
                                    {i + 1}
                                </div>
                                <h3 className="text-lg font-black uppercase italic tracking-tight mb-3 text-white">
                                    {step.title}
                                </h3>
                                <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                    {step.desc}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Details <ArrowRight size={12} />
                                </div>
                            </motion.button>
                        ))}
                    </div>

                    <ManualDetailModal
                        isOpen={isManualModalOpen}
                        onClose={() => setIsManualModalOpen(false)}
                        stepData={selectedStep}
                    />
                </section>

                {/* 4. Official Rules */}
                <section className="mb-16">
                    <h2 className="text-xl font-bold mb-8 flex items-center gap-3 italic text-white/90">
                        <ShieldCheck size={28} className="text-primary" />
                        Tournament Rules
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {rules.map((rule, i) => (
                            <div key={i} className="flex items-center justify-between p-6 bg-arena-dark/80 border border-white/5 rounded-2xl hover:border-ipl-blue/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400">
                                        <rule.icon size={20} />
                                    </div>
                                    <span className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">{rule.label}</span>
                                </div>
                                <span className="text-ipl-blue font-black italic">{rule.val}</span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 p-6 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-center gap-4">
                        < Zap size={18} className="text-amber-500" />
                        <p className="text-xs text-amber-500/80 font-black uppercase tracking-[0.2em] italic text-center">
                            Valid squads must have at least 1 WK and 4 Bowlers minimum.
                        </p>
                    </div>
                </section>

                {/* 5. Tournament Footer (Integrated Support) */}
                <footer className="mt-8 border-t border-white/5 pt-16">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 bg-slate-900/40 p-6 md:p-10 rounded-[2.5rem] border border-white/5 backdrop-blur-xl relative overflow-hidden group">
                        {/* Decorative background for footer */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-32 -mt-32 group-hover:bg-primary/10 transition-colors duration-700" />

                        {/* Left: Branding & Status */}
                        <div className="text-left relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Trophy size={20} className="text-primary" />
                                </div>
                                <span className="font-black italic tracking-tighter text-xl uppercase">IPL <span className="text-primary">ARENA</span></span>
                            </div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.4em] mb-2">SECURE AUCTION SYSTEM</p>
                            <p className="text-slate-500 text-[10px] font-medium max-w-xs leading-relaxed italic">
                                The official high-performance platform for real-time player bidding and squad management.
                            </p>
                        </div>

                        {/* Center: Contact / Support CTA */}
                        <div className="flex flex-col items-center md:items-end gap-6 relative z-10 w-full md:w-auto">
                            <div className="text-center md:text-right">
                                <h3 className="text-white font-black italic uppercase tracking-tight text-xl mb-1 flex items-center gap-2 justify-center md:justify-end">
                                    <Handshake className="text-primary" size={24} /> Technical Support
                                </h3>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Feedback & Queries</p>
                            </div>

                            <motion.a
                                whileHover={{ scale: 1.05, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://mail.google.com/mail/?view=cm&fs=1&to=iplarena.app@gmail.com&su=IPL Arena Support - Feedback/Query"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 bg-primary px-8 py-4 rounded-2xl shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all group/btn"
                            >
                                <div className="flex flex-col items-start leading-none">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Start Mail</span>
                                    <span className="text-sm font-black italic tracking-wider">iplarena.app@gmail.com</span>
                                </div>
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center group-hover/btn:bg-white/20 transition-colors">
                                    <Mail size={20} />
                                </div>
                            </motion.a>
                        </div>
                    </div>

                    <div className="mt-12 md:mt-16 text-center space-y-4">
                        <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-[9px] md:text-[10px] font-black text-slate-600 uppercase tracking-[0.25em] md:tracking-[0.5em]">
                            <span>AUTHENTICATED ACCESS</span>
                            <div className="hidden md:block w-1 h-1 bg-slate-800 rounded-full" />
                            <span>ELITE EDITION v1.2.0</span>
                            <div className="hidden md:block w-1 h-1 bg-slate-800 rounded-full" />
                            <span>STATUS: PEAK PERFORMANCE</span>
                        </div>
                    </div>
                </footer>
            </main>
        </div>
    );
};

export default Portal;
