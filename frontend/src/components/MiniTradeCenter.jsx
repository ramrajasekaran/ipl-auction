import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, ArrowRightLeft, MessageCircle } from 'lucide-react';
import { createTrade, respondToTrade, sendTradeMessage, getTeamTrades } from '../services/miniAuctionAPI';

const MiniTradeCenter = ({ miniAuctionId, currentTeam, allTeams, onClose }) => {
    const [selectedPartner, setSelectedPartner] = useState(null);
    const [offeredPlayer, setOfferedPlayer] = useState(null);
    const [wantedPlayer, setWantedPlayer] = useState(null);
    const [trades, setTrades] = useState([]);
    const [activeTradeChat, setActiveTradeChat] = useState(null);
    const [chatMessage, setChatMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (miniAuctionId && currentTeam?._id) {
            fetchTrades();
        }
    }, [miniAuctionId, currentTeam]);

    if (!currentTeam) {
        return (
            <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                <div className="glass-card p-6 text-white flex items-center gap-4">
                    <span>Loading Team Data...</span>
                    <button onClick={onClose}><X size={20} /></button>
                </div>
            </div>
        );
    }

    const fetchTrades = async () => {
        try {
            const response = await getTeamTrades(miniAuctionId, currentTeam._id);
            if (response.success) {
                setTrades(response.trades);
            }
        } catch (error) {
            console.error('Failed to fetch trades:', error);
        }
    };

    // Sync selectedPartner with live data (to update player lists after trade)
    useEffect(() => {
        if (selectedPartner && allTeams?.length > 0) {
            const updated = allTeams.find(t => (t._id || t.id).toString() === (selectedPartner._id || selectedPartner.id).toString());
            if (updated) {
                setSelectedPartner(updated);
            }
        }
    }, [allTeams, selectedPartner?._id]);

    const handleCreateTrade = async () => {
        if (!selectedPartner || !offeredPlayer || !wantedPlayer) {
            alert('Please select both players to trade');
            return;
        }

        setLoading(true);
        try {
            const response = await createTrade(
                miniAuctionId,
                currentTeam._id,
                selectedPartner._id,
                offeredPlayer._id,
                wantedPlayer._id
            );

            if (response.success) {
                alert('Trade offer sent!');
                fetchTrades();
                resetSelection();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to create trade');
        } finally {
            setLoading(false);
        }
    };

    const handleRespondToTrade = async (tradeId, action) => {
        setLoading(true);
        try {
            const response = await respondToTrade(tradeId, action, currentTeam._id);
            if (response.success) {
                alert(action === 'ACCEPT' ? 'Trade accepted! Players swapped.' : 'Trade rejected.');
                fetchTrades();
                if (action === 'ACCEPT') {
                    window.location.reload();
                }
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to respond to trade');
        } finally {
            setLoading(false);
        }
    };

    const handleSendMessage = async (tradeId) => {
        if (!chatMessage.trim()) return;

        try {
            const response = await sendTradeMessage(tradeId, currentTeam._id, chatMessage);
            if (response.success) {
                setChatMessage('');
                setTrades(prev => prev.map(t =>
                    t._id === tradeId ? { ...t, chatMessages: response.chatMessages } : t
                ));
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const resetSelection = () => {
        setSelectedPartner(null);
        setOfferedPlayer(null);
        setWantedPlayer(null);
    };

    const otherTeams = allTeams.filter(t => t._id !== currentTeam._id);
    const partnerSquad = selectedPartner?.players || [];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="glass-card w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <ArrowRightLeft className="text-green-500" size={28} />
                        <h2 className="text-2xl font-bold text-white">Trade Center</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <X className="text-slate-400" size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Create New Trade - Simplified for mini auction */}
                    <div className="glass-panel p-6 rounded-xl">
                        <h3 className="text-xl font-bold text-white mb-4">Create New Trade</h3>

                        {/* Team Selection */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-slate-400 mb-2">Select Team</label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {otherTeams.map(team => (
                                    <button
                                        key={team._id}
                                        onClick={() => setSelectedPartner(team)}
                                        className={`p-3 rounded-lg transition-all text-sm ${selectedPartner?._id === team._id
                                            ? 'bg-green-500/20 border-2 border-green-500'
                                            : 'bg-white/5 border border-white/10 hover:border-green-500/50'
                                            }`}
                                    >
                                        <div className="font-bold text-white">{team.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedPartner && (
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Offer Player */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Your Player</label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {currentTeam.players?.map(pd => (
                                            <button
                                                key={pd.player._id}
                                                onClick={() => setOfferedPlayer(pd.player)}
                                                className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all ${offeredPlayer?._id === pd.player._id
                                                    ? 'bg-blue-500/20 border border-blue-500'
                                                    : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex-1 text-left">
                                                    <div className="text-white text-sm font-bold">{pd.player.name}</div>
                                                    <div className="text-xs text-slate-400">{pd.player.role}</div>
                                                </div>
                                                <div className="text-xs text-green-400">₹{pd.boughtPrice}Cr</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Want Player */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">Their Player</label>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {partnerSquad.map(pd => (
                                            <button
                                                key={pd.player._id}
                                                onClick={() => setWantedPlayer(pd.player)}
                                                className={`w-full p-2 rounded-lg flex items-center gap-2 transition-all ${wantedPlayer?._id === pd.player._id
                                                    ? 'bg-purple-500/20 border border-purple-500'
                                                    : 'bg-white/5 hover:bg-white/10'
                                                    }`}
                                            >
                                                <div className="flex-1 text-left">
                                                    <div className="text-white text-sm font-bold">{pd.player.name}</div>
                                                    <div className="text-xs text-slate-400">{pd.player.role}</div>
                                                </div>
                                                <div className="text-xs text-green-400">₹{pd.boughtPrice}Cr</div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {offeredPlayer && wantedPlayer && (
                            <button
                                onClick={handleCreateTrade}
                                disabled={loading}
                                className="w-full mt-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-3 rounded-xl disabled:opacity-50"
                            >
                                {loading ? 'Sending...' : `Trade ${offeredPlayer.name} for ${wantedPlayer.name}`}
                            </button>
                        )}
                    </div>

                    {/* Active Trades - Compact View */}
                    <div className="glass-panel p-4 rounded-xl">
                        <h3 className="text-lg font-bold text-white mb-3">Active Trades</h3>
                        {trades.length === 0 ? (
                            <div className="text-center py-4 text-slate-400 text-sm">No trades yet</div>
                        ) : (
                            <div className="space-y-3">
                                {trades.map(trade => {
                                    const isOffering = trade.offeringTeam._id === currentTeam._id;
                                    const isPending = trade.status === 'PENDING';

                                    return (
                                        <div key={trade._id} className="bg-white/5 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-xs text-slate-400">
                                                    {isOffering ? 'To' : 'From'}: {isOffering ? trade.receivingTeam.name : trade.offeringTeam.name}
                                                </span>
                                                <span className={`text-xs px-2 py-1 rounded ${trade.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-500' :
                                                    trade.status === 'ACCEPTED' ? 'bg-green-500/20 text-green-500' :
                                                        'bg-red-500/20 text-red-500'
                                                    }`}>
                                                    {trade.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm mb-2">
                                                <span className="text-white">{trade.offeredPlayer.playerId.name}</span>
                                                <ArrowRightLeft size={14} className="text-slate-500" />
                                                <span className="text-white">{trade.wantedPlayer.playerId.name}</span>
                                            </div>
                                            {isPending && !isOffering && (
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleRespondToTrade(trade._id, 'ACCEPT')}
                                                        className="flex-1 bg-green-600 text-white text-xs py-2 rounded"
                                                    >
                                                        Accept
                                                    </button>
                                                    <button
                                                        onClick={() => handleRespondToTrade(trade._id, 'REJECT')}
                                                        className="flex-1 bg-red-600 text-white text-xs py-2 rounded"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

export default MiniTradeCenter;
