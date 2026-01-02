import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ArrowRight, Check, X } from 'lucide-react';
import { useGame } from '../context/GameContext';

const TradeCenter = () => {
    const { roomData, currentUser, proposeTrade, getMyTrades, respondToTrade } = useGame();
    const [activeTab, setActiveTab] = useState('offers'); // 'offers' | 'propose'
    const [trades, setTrades] = useState([]);

    // Propose Form
    const [targetTeamId, setTargetTeamId] = useState('');
    const [myPlayerId, setMyPlayerId] = useState('');
    const [theirPlayerId, setTheirPlayerId] = useState('');
    const [message, setMessage] = useState('');

    const myTeam = roomData.teams.find(t => t._id === currentUser?.teamId);
    const otherTeams = roomData.teams.filter(t => t._id !== currentUser?.teamId);
    const targetTeam = roomData.teams.find(t => t._id === targetTeamId);

    const refreshTrades = async () => {
        if (currentUser?.teamId) {
            const data = await getMyTrades(currentUser.teamId);
            if (data.success) setTrades(data.trades);
        }
    };

    useEffect(() => {
        refreshTrades();
        const interval = setInterval(refreshTrades, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [currentUser]);

    const handlePropose = async (e) => {
        e.preventDefault();
        try {
            await proposeTrade({
                initiatorTeamId: currentUser.teamId,
                targetTeamId,
                playerInId: myPlayerId,
                playerOutId: theirPlayerId,
                message
            });
            alert("Trade Proposed!");
            setActiveTab('offers');
            refreshTrades();
        } catch (err) {
            alert(err.response?.data?.message || "Trade Failed");
        }
    };

    const handleRespond = async (tradeId, status) => {
        try {
            await respondToTrade(tradeId, status);
            refreshTrades();
        } catch (err) {
            alert("Action Failed");
        }
    };

    return (
        <div className="bg-slate-900/90 rounded-2xl p-6 border border-white/10 h-full backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <RefreshCw className="text-purple-400" /> Trade Center
                </h2>
                <div className="flex bg-black/40 rounded-lg p-1">
                    <button
                        onClick={() => setActiveTab('offers')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'offers' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Offers
                    </button>
                    <button
                        onClick={() => setActiveTab('propose')}
                        className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'propose' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        New Proposal
                    </button>
                </div>
            </div>

            {activeTab === 'offers' ? (
                <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                    {trades.length === 0 && <p className="text-slate-500 text-center py-4">No active trades.</p>}
                    {trades.map(trade => {
                        const isIncoming = trade.targetTeam._id === currentUser.teamId;
                        return (
                            <div key={trade._id} className="bg-white/5 p-4 rounded-xl border border-white/5 relative overflow-hidden">
                                {isIncoming && <div className="absolute top-0 right-0 bg-blue-500 text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">INCOMING</div>}
                                {!isIncoming && <div className="absolute top-0 right-0 bg-slate-500 text-[10px] px-2 py-0.5 rounded-bl-lg font-bold">SENT</div>}

                                <div className="flex items-center justify-between mb-3 text-sm">
                                    <span className="text-slate-300 font-semibold">{trade.initiatorTeam.name}</span>
                                    <ArrowRight size={14} className="text-slate-500" />
                                    <span className="text-slate-300 font-semibold">{trade.targetTeam.name}</span>
                                </div>

                                <div className="bg-black/20 p-2 rounded-lg flex items-center justify-between mb-3">
                                    <div className="text-center">
                                        <p className="text-xs text-red-400">GIVE</p>
                                        <p className="text-white font-bold text-sm">{trade.playerIn.name}</p>
                                    </div>
                                    <RefreshCw size={16} className="text-purple-500/50" />
                                    <div className="text-center">
                                        <p className="text-xs text-green-400">GET</p>
                                        <p className="text-white font-bold text-sm">{trade.playerOut.name}</p>
                                    </div>
                                </div>

                                {isIncoming && (
                                    <div className="flex gap-2 mt-2">
                                        <button onClick={() => handleRespond(trade._id, 'ACCEPTED')} className="flex-1 bg-green-500/20 text-green-400 py-1.5 rounded-lg text-xs font-bold hover:bg-green-500/30 flex items-center justify-center gap-1">
                                            <Check size={14} /> ACCEPT
                                        </button>
                                        <button onClick={() => handleRespond(trade._id, 'REJECTED')} className="flex-1 bg-red-500/20 text-red-400 py-1.5 rounded-lg text-xs font-bold hover:bg-red-500/30 flex items-center justify-center gap-1">
                                            <X size={14} /> REJECT
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                <form onSubmit={handlePropose} className="space-y-4">
                    <div>
                        <label className="text-xs text-slate-400">Target Team</label>
                        <select
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                            value={targetTeamId}
                            onChange={(e) => setTargetTeamId(e.target.value)}
                            required
                        >
                            <option value="">Select Team</option>
                            {otherTeams.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs text-slate-400">My Player (Give)</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                                value={myPlayerId}
                                onChange={(e) => setMyPlayerId(e.target.value)}
                                required
                            >
                                <option value="">Select</option>
                                {myTeam?.squad?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-slate-400">Target Player (Get)</label>
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                                value={theirPlayerId}
                                onChange={(e) => setTheirPlayerId(e.target.value)}
                                required
                                disabled={!targetTeamId}
                            >
                                <option value="">Select</option>
                                {targetTeam?.squad?.map(p => <option key={p._id} value={p._id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-slate-400">Message (Optional)</label>
                        <input
                            type="text"
                            className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white text-sm"
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                        />
                    </div>

                    <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition-colors">
                        Send Proposal
                    </button>
                </form>
            )}
        </div>
    );
};

export default TradeCenter;
