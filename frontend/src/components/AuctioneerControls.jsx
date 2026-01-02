import React, { useState, useEffect } from 'react';
import { Gavel, XCircle, Search, UserPlus, Database, Loader2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { formatCurrency } from '../utils/formatters';

const AuctioneerControls = ({ onSelectPlayer, onSold, onUnsold, currentBid, isBiddingActive }) => {
    const { roomData, searchGlobalPlayers, activateGlobalPlayer, timerState, triggerTimer, stopTimer, refreshState, auctionState } = useGame();
    const [searchTerm, setSearchTerm] = useState('');

    // Get available and unsold players from roomData
    const allSelectableRoomPlayers = (roomData.players || []).filter(p =>
        p.status === 'AVAILABLE' || p.status === 'UNSOLD'
    );

    console.log('[AuctioneerControls] Room Players:', roomData.players?.length, 'Selectable:', allSelectableRoomPlayers.length);

    // State for global search (for future use)
    const [globalSearchResults, setGlobalSearchResults] = useState([]);
    const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);

    // Handle Global Search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.trim().length > 0) {
                setIsSearchingGlobal(true);
                try {
                    const data = await searchGlobalPlayers(searchTerm);
                    if (data.success) {
                        setGlobalSearchResults(data.players);
                    }
                } catch (error) {
                    console.error('Global search error:', error);
                    setGlobalSearchResults([]);
                } finally {
                    setIsSearchingGlobal(false);
                }
            } else {
                setGlobalSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    // Better local search (word based)
    const normalizedSearch = searchTerm.trim().toLowerCase();
    const searchWords = normalizedSearch.split(/\s+/).filter(w => w.length > 0);

    // Players to display (only room players, filtered by search term)
    const filteredPlayers = allSelectableRoomPlayers.filter(p => {
        if (searchWords.length === 0) return true;
        const pName = (p.name || '').toLowerCase();
        const pRole = (p.role || '').toLowerCase();
        // Match all words
        return searchWords.every(word => pName.includes(word) || pRole.includes(word));
    });

    const handlePlayerClick = async (player) => {
        console.log('[AuctioneerControls] handlePlayerClick called', {
            player: player.name,
            teamsCount: roomData.teams.length,
            teams: roomData.teams,
            roomData: roomData
        });

        if (roomData.teams.length === 0) {
            console.error('[AuctioneerControls] BLOCKED: No teams in roomData!', roomData);
            alert("No teams have joined the room yet. At least one team must join before you can select and sell players.");
            return;
        }

        // Select player directly (already in room)
        onSelectPlayer(player);
    };

    return (
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 p-4 w-full h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Gavel size={18} className="text-primary" />
                    Auctioneer Panel ({allSelectableRoomPlayers.length} Players)
                </h3>
            </div>

            {/* Actions for current player */}
            {isBiddingActive && (
                <div className="mb-6 space-y-3">
                    <div className="bg-white/5 rounded-xl p-4 border border-white/10 text-center">
                        <div className="text-slate-400 text-xs mb-2">Current Bid</div>
                        <div className="text-3xl font-black text-gold">
                            ₹{currentBid >= 100 ? (currentBid / 100).toFixed(2) + ' Cr' : currentBid + ' L'}
                        </div>
                    </div>

                    {timerState.isRunning ? (
                        <div className="relative">
                            <button
                                onClick={stopTimer}
                                className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-3 animate-pulse-slow"
                            >
                                <Gavel size={24} className="animate-bounce" />
                                <div>
                                    <div className="text-xs opacity-80">FINAL CALL</div>
                                    <div className="text-2xl font-black">{timerState.remaining}s</div>
                                </div>
                                <Gavel size={24} className="animate-bounce" />
                            </button>
                            <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-md opacity-50 animate-pulse" />
                        </div>
                    ) : (auctionState?.currentBid?.team && timerState.remaining === 0 && !timerState.isRunning) ? (
                        <button
                            onClick={triggerTimer}
                            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:scale-105 flex items-center justify-center gap-2"
                        >
                            <Gavel size={20} />
                            RESUME BIDDING
                        </button>
                    ) : (
                        <button
                            onClick={triggerTimer}
                            disabled={!isBiddingActive}
                            className="group relative w-full h-24 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black rounded-2xl font-black transition-all shadow-xl shadow-amber-900/50 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-4"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                            <Gavel
                                size={48}
                                className="relative z-10 drop-shadow-2xl group-hover:rotate-[-15deg] group-active:rotate-[-35deg] group-active:translate-y-3 transition-all duration-150"
                            />
                            <div className="relative z-10 text-left">
                                <div className="text-sm font-semibold opacity-80">FINAL CALL</div>
                                <div className="text-xs opacity-60">Start 10s Countdown</div>
                            </div>
                        </button>
                    )}

                    <div className="text-center text-xs text-slate-500 italic px-2">
                        {currentBid > 0
                            ? "Auto-SOLD when timer ends"
                            : "Auto-UNSOLD if no bids when timer ends"}
                    </div>
                </div>
            )}

            {!isBiddingActive && (
                <div className="mb-6 p-4 bg-white/5 rounded-xl text-center text-slate-400 text-sm">
                    Select a player to start bidding
                </div>
            )}

            {/* Player Selection */}
            <div className="flex-1 flex flex-col min-h-0">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                    <input
                        type="text"
                        placeholder="Search room players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 pl-9 pr-3 text-sm text-white focus:outline-none focus:border-primary/50"
                    />
                    {isSearchingGlobal && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={16} />
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player, idx) => (
                            <div
                                key={player._id || `p-${idx}`}
                                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                                onClick={() => handlePlayerClick(player)}
                            >
                                <img src={player.image || 'https://via.placeholder.com/100'} alt={player.name} className="w-10 h-10 rounded-full object-cover bg-slate-800" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-medium text-sm truncate">{player.name}</h4>
                                    <div className="text-xs text-slate-500">{player.role} • {formatCurrency(player.basePrice).replace('₹ ', '')}</div>
                                </div>
                                <button className="p-2 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                                    <UserPlus size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-8 px-4 flex flex-col items-center">
                            <div className="text-slate-600 text-sm italic mb-4">
                                {searchTerm.length > 0 ? "No players found matching search" : "No available players in room. Load players from PlayerSelection page."}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuctioneerControls;
