import React, { useState, useEffect } from 'react';
import { Gavel, XCircle, Search, UserPlus, Database, Loader2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { formatCurrency } from '../utils/formatters';

const AuctioneerControls = ({ onSelectPlayer, onSold, onUnsold, currentBid, isBiddingActive }) => {
    const { roomData, searchGlobalPlayers, activateGlobalPlayer, timerState, triggerTimer, stopTimer, refreshState, auctionState } = useGame();
    const [searchTerm, setSearchTerm] = useState('');

    // Get available and unsold players from roomData
    const allSelectableRoomPlayers = (roomData.players || []).filter(p =>
        p.status === 'AVAILABLE' || p.status === 'UNSOLD' || p.status === 'RELEASED'
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
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 w-full md:min-h-[500px] md:h-full flex flex-col overflow-hidden">
            {/* Actions Zone: Search + Final Call */}
            <div className="fixed top-[60px] left-0 right-0 md:static z-50 bg-[#0f172a] shadow-xl p-4 border-b border-white/10 md:border-none flex-shrink-0">
                {/* Player Search Bar - ALWAYS VISIBLE AT TOP */}
                <div className="relative mb-2 md:mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search players..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/10 border-2 border-white/20 rounded-lg py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/70 focus:bg-white/15"
                    />
                    {isSearchingGlobal && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={16} />
                    )}
                </div>

                {/* Actions for current player - DESKTOP ONLY (will be fixed at bottom on mobile) */}
                {(isBiddingActive || auctionState?.currentPlayer) && (
                    <div className="hidden md:block space-y-3">
                        {timerState.isRunning ? (
                            <div className="relative">
                                <button
                                    onClick={stopTimer}
                                    className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-3 animate-pulse-slow"
                                >
                                    <Gavel size={20} className="animate-bounce" />
                                    <div>
                                        <div className="text-[10px] opacity-80 uppercase tracking-tighter">FINAL CALL</div>
                                        <div className="text-xl font-black leading-none">{timerState.remaining}s</div>
                                    </div>
                                    <Gavel size={20} className="animate-bounce" />
                                </button>
                                <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse" />
                            </div>
                        ) : (auctionState?.currentBid?.team && timerState.remaining === 0 && !timerState.isRunning) ? (
                            <button
                                onClick={triggerTimer}
                                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <Gavel size={18} />
                                RESUME BIDDING
                            </button>
                        ) : (
                            <div className="flex flex-col gap-2">
                                <button
                                    onClick={triggerTimer}
                                    disabled={!auctionState?.currentPlayer}
                                    className="group relative w-full h-14 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black rounded-xl font-black transition-all shadow-xl shadow-amber-900/50 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-4"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                    <Gavel
                                        size={28}
                                        className="relative z-10 drop-shadow-2xl group-hover:rotate-[-15deg] group-active:rotate-[-35deg] group-active:translate-y-2 transition-all duration-150"
                                    />
                                    <div className="relative z-10 text-left">
                                        <div className="text-xs font-bold opacity-90 uppercase tracking-tighter">FINAL CALL</div>
                                        <div className="text-[10px] opacity-70 leading-none">START 10s COUNTDOWN</div>
                                    </div>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {!isBiddingActive && !auctionState?.currentPlayer && (
                    <div className="py-3 px-4 bg-white/5 rounded-xl text-center text-slate-400 text-xs border border-white/5 hidden md:block">
                        Select a player to start bidding
                    </div>
                )}
            </div>

            {/* Player Selection List - Flowing area with spacer */}
            <div className="flex-1 overflow-y-auto space-y-1 p-2 md:p-4 custom-scrollbar max-h-[250px] md:max-h-none mt-[80px] md:mt-0">
                {filteredPlayers.length > 0 ? (
                    filteredPlayers.map((player, idx) => (
                        <div
                            key={player._id || `p-${idx}`}
                            className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group border border-transparent hover:border-white/5"
                            onClick={() => handlePlayerClick(player)}
                        >
                            <img src={player.image || 'https://via.placeholder.com/100'} alt={player.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-800" />
                            <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium text-xs md:text-sm truncate">{player.name}</h4>
                                <div className="text-[10px] md:text-xs text-slate-500">{player.role} • {formatCurrency(player.basePrice).replace('₹ ', '')}</div>
                            </div>
                            <button className="p-1 text-primary md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                <UserPlus size={14} />
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6 px-4 flex flex-col items-center">
                        <div className="text-slate-600 text-[10px] md:text-sm italic">
                            {searchTerm.length > 0 ? "No players found matching search" : "No available players in room."}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctioneerControls;
