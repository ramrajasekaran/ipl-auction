import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PlayerCard from '../components/PlayerCard';
import Timer from '../components/Timer';
import BidButton from '../components/BidButton';
import BidHistory from '../components/BidHistory';
import TeamCard from '../components/TeamCard';
import { auctionAPI } from '../services/api';
import socketService from '../services/socket';
import useAuthStore from '../store/authStore';
import useAuctionStore from '../store/auctionStore';
import { formatCurrency } from '../utils/formatters';
import { pageVariants } from '../utils/animations';
import { createPaymentOrderAPI, verifyPaymentAPI } from '../services/api';
import { Heart } from 'lucide-react';

const TeamOwnerDashboard = () => {
    const navigate = useNavigate();
    const { user, isTeamOwner } = useAuthStore();
    const {
        auctionId,
        currentPlayer,
        currentBid,
        timer,
        bidHistory,
        updateBid,
        setAuctionId,
        setCurrentPlayer,
        updateTimerRemaining,
    } = useAuctionStore();

    const [customBidAmount, setCustomBidAmount] = useState('');
    const [myTeam, setMyTeam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bidError, setBidError] = useState('');

    useEffect(() => {
        if (!isTeamOwner()) {
            navigate('/auctioneer');
            return;
        }

        initializeAuction();
    }, []);

    const initializeAuction = async () => {
        try {
            // Fetch the latest active auction
            const response = await auctionAPI.getLatest();
            const auctionData = response.data.auction;

            if (!auctionData) {
                setLoading(false);
                setBidError('No active auction found. Please wait for the auctioneer.');
                return;
            }

            const auctionId = auctionData._id;
            setAuctionId(auctionId);

            // Connect to socket
            socketService.disconnect(); // Ensure clean state
            socketService.connect();
            socketService.joinAuction(auctionId, user.id);

            // Listen to socket events
            setupSocketListeners(auctionId);

            // Load team data
            await loadTeamData(auctionId);
        } catch (error) {

            setBidError('Waiting for auctioneer to start the session...');
        } finally {
            setLoading(false);
        }
    };

    const setupSocketListeners = (id) => {
        socketService.on('auction:player-selected', ({ player }) => {
            setCurrentPlayer(player);
            setBidError('');
        });

        socketService.on('auction:bid-placed', ({ bid, team }) => {
            updateBid(bid, team.name);
        });

        socketService.on('auction:timer-update', ({ remaining }) => {
            updateTimerRemaining(remaining);
        });

        socketService.on('auction:player-sold', () => {
            setCurrentPlayer(null);
            loadTeamData(id);
        });

        socketService.on('auction:player-unsold', () => {
            setCurrentPlayer(null);
        });
    };

    const loadTeamData = async (id) => {
        try {
            const response = await auctionAPI.getTeams(id);
            const teams = response.data.teams || [];
            const userTeam = teams.find(t => t.owner === user.id);
            setMyTeam(userTeam);
        } catch (error) {

        }
    };

    const handlePlaceBid = async (amount) => {
        if (!auctionId || !currentPlayer || !myTeam) return;

        setBidError('');

        // Validation
        if (amount > myTeam.currentPurse) {
            setBidError('Insufficient purse balance!');
            return;
        }

        if (amount <= currentBid.amount) {
            setBidError('Bid must be higher than current bid!');
            return;
        }

        try {
            const response = await auctionAPI.placeBid(auctionId, amount);

            // Emit via socket
            socketService.placeBid(auctionId, response.data.bid, myTeam);

            setCustomBidAmount('');
        } catch (error) {
            setBidError(error.response?.data?.message || 'Failed to place bid');
        }
    };

    const handleCustomBid = () => {
        const amount = parseFloat(customBidAmount);
        if (isNaN(amount) || amount <= 0) {
            setBidError('Please enter a valid amount');
            return;
        }
        handlePlaceBid(amount);
    };

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
            alert('Razorpay SDK failed to load. Are you online?');
            return;
        }

        try {
            // 1. Create Order
            const data = await createPaymentOrderAPI(500); // 500 INR

            const options = {
                key: data.key_id, // Enter the Key ID generated from the Dashboard
                amount: data.order.amount,
                currency: data.order.currency,
                name: "IPL Auction",
                description: "Fund the Developer",
                order_id: data.order.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await verifyPaymentAPI({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });
                        alert(verifyRes.message);
                    } catch (error) {
                        alert('Payment verification failed');
                    }
                },
                prefill: {
                    name: user.name,
                    email: user.email,
                    contact: "9999999999"
                },
                theme: {
                    color: "#3399cc"
                }
            };

            const paymentObject = new window.Razorpay(options);
            paymentObject.open();
        } catch (error) {
            console.error(error);
            alert('Failed to initiate payment');
        }
    };

    const quickBidAmounts = currentPlayer
        ? [
            currentBid.amount + 0.5,
            currentBid.amount + 1,
            currentBid.amount + 2,
            currentBid.amount + 5,
        ]
        : [];

    return (
        <motion.div
            variants={pageVariants}
            initial="initial"
            animate="animate"
            className="min-h-screen bg-gradient-bg"
        >
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Header with Team Info */}
                <div className="glass-card">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl md:text-4xl font-bold gradient-text">
                                {myTeam?.name || 'Team Dashboard'}
                            </h1>
                            <p className="text-gray-400 text-sm md:text-base mt-2">
                                Place your bids and build your squad
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={handleFundDeveloper}
                                className="flex items-center gap-2 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg transition-colors text-sm font-semibold shadow-lg shadow-pink-600/20"
                            >
                                <Heart size={16} className="fill-current" />
                                Fund Dev
                            </button>

                            {myTeam && (
                                <div className="glass p-4 rounded-lg">
                                    <p className="text-xs text-gray-400 mb-1">Your Purse</p>
                                    <p className="text-2xl md:text-3xl font-bold text-accent-gold">
                                        {formatCurrency(myTeam.currentPurse)}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="glass-card text-center py-12">
                        <p className="text-gray-400">Loading auction...</p>
                    </div>
                ) : (
                    <>
                        {/* Main Bidding Area */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Current Player & Bidding */}
                            <div className="lg:col-span-2 space-y-4">
                                {currentPlayer ? (
                                    <>
                                        {/* Player Card */}
                                        <div className="glass-card spotlight">
                                            <h3 className="text-lg font-bold text-white mb-4">Current Player</h3>
                                            <div className="max-w-sm mx-auto">
                                                <PlayerCard player={currentPlayer} />
                                            </div>
                                        </div>

                                        {/* Current Bid Display */}
                                        <div className="glass-card text-center glow-effect-gold">
                                            <p className="text-sm text-gray-400 mb-2">Current Bid</p>
                                            <p className="text-4xl md:text-6xl font-bold gradient-text-gold">
                                                {formatCurrency(currentBid.amount)}
                                            </p>
                                            {currentBid.teamName && (
                                                <p className="text-sm text-gray-400 mt-2">
                                                    by <span className="text-primary-400 font-semibold">{currentBid.teamName}</span>
                                                </p>
                                            )}
                                        </div>

                                        {/* Bidding Controls */}
                                        <div className="glass-card">
                                            <h3 className="text-lg font-bold text-white mb-4">Place Your Bid</h3>

                                            {bidError && (
                                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                                    <p className="text-red-400 text-sm">{bidError}</p>
                                                </div>
                                            )}

                                            {/* Quick Bid Buttons */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
                                                {quickBidAmounts.map((amount) => (
                                                    <BidButton
                                                        key={amount}
                                                        amount={amount}
                                                        onClick={handlePlaceBid}
                                                        disabled={!myTeam || amount > myTeam.currentPurse || !timer.isRunning}
                                                        variant="quick"
                                                    />
                                                ))}
                                            </div>

                                            {/* Custom Bid */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min={currentBid.amount + 0.5}
                                                    value={customBidAmount}
                                                    onChange={(e) => setCustomBidAmount(e.target.value)}
                                                    placeholder="Custom amount (CR)"
                                                    className="input-field flex-1"
                                                    disabled={!timer.isRunning}
                                                />
                                                <button
                                                    onClick={handleCustomBid}
                                                    disabled={!myTeam || !customBidAmount || !timer.isRunning}
                                                    className="btn-primary px-6"
                                                >
                                                    BID
                                                </button>
                                            </div>

                                            {!timer.isRunning && (
                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                    Bidding is currently paused
                                                </p>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="glass-card h-96 flex items-center justify-center">
                                        <div className="text-center">
                                            <p className="text-2xl mb-2">⏳</p>
                                            <p className="text-gray-400">Waiting for auctioneer to select a player...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sidebar */}
                            <div className="space-y-4">
                                {/* Timer */}
                                <Timer remaining={timer.remaining} isRunning={timer.isRunning} />

                                {/* Bid History */}
                                <BidHistory bids={bidHistory} />

                                {/* My Team Summary */}
                                {myTeam && (
                                    <div className="glass-card">
                                        <h3 className="text-lg font-bold text-white mb-4">My Squad</h3>
                                        <TeamCard team={myTeam} />

                                        {myTeam.players && myTeam.players.length > 0 && (
                                            <div className="mt-4 space-y-2">
                                                <p className="text-sm text-gray-400">Players Bought:</p>
                                                <div className="space-y-1">
                                                    {myTeam.players.slice(0, 5).map((p, idx) => (
                                                        <div key={idx} className="flex justify-between text-xs glass p-2 rounded">
                                                            <span className="text-white">{p.player?.name || 'Player'}</span>
                                                            <span className="text-accent-gold">
                                                                {p.boughtPrice < 1
                                                                    ? `₹${Math.round(p.boughtPrice * 100)} L`
                                                                    : `₹${p.boughtPrice} Cr`
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </motion.div>
    );
};

export default TeamOwnerDashboard;
