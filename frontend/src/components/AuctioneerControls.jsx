import React, { useState, useEffect } from 'react';
import { Gavel, XCircle, Search, UserPlus, Database, Loader2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { formatCurrency } from '../utils/formatters';

const AuctioneerControls = ({
    onSelectPlayer,
    onSold,
    onUnsold,
    currentBid,
    isBiddingActive,
    showList = true,
    showSearch = true
}) => {
    const { roomData, searchGlobalPlayers, activateGlobalPlayer, timerState, triggerTimer, stopTimer, refreshState, auctionState } = useGame();
    const [searchTerm, setSearchTerm] = useState('');

    // Get available and unsold players from roomData
    const allSelectableRoomPlayers = (roomData.players || []).filter(p =>
        p.status === 'AVAILABLE' || p.status === 'UNSOLD' || p.status === 'RELEASED'
    );
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

    const isAuctionInProgress = isBiddingActive || !!auctionState?.currentPlayer;

    const handlePlayerClick = async (player) => {
        if (isAuctionInProgress) {
            return;
        }

        if (roomData.teams.length === 0) {

            alert("No teams have joined the room yet. At least one team must join before you can select and sell players.");
            return;
        }

        // Select player directly (already in room)
        onSelectPlayer(player);
    };

    return (
        <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 w-full h-full md:min-h-[500px] flex flex-col overflow-hidden">
            {/* Actions Zone: Search + Final Call */}
            <div className="sticky top-0 z-30 bg-[#0f172a] shadow-xl p-4 border-b border-white/10 flex-shrink-0">
                {/* Player Search Bar - ALWAYS VISIBLE AT TOP */}
                {showSearch && (
                    <div className="relative mb-2 md:mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search players..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            // Input remains active so user can search
                            className="w-full bg-white/10 border-2 border-white/20 rounded-lg py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-400 focus:outline-none focus:border-primary/70 focus:bg-white/15"
                        />
                        {isSearchingGlobal && (
                            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" size={16} />
                        )}
                    </div>
                )}

                {/* Status Message */}
                {isAuctionInProgress ? (
                    <div className="py-2 px-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-center gap-2">
                        <Loader2 size={14} className="text-yellow-500 animate-spin" />
                        <span className="text-xs text-yellow-200 font-medium">Auction in progress (Selection Locked)</span>
                    </div>
                ) : (
                    <div className="py-3 px-4 bg-white/5 rounded-xl text-center text-slate-400 text-xs border border-white/5 md:block">
                        Select a player to start bidding
                    </div>
                )}
            </div>

            {/* Player Selection List - Flowing area */}
            {showList && (
                <div className="flex-1 overflow-y-auto space-y-1 p-2 md:p-4 custom-scrollbar md:max-h-none">
                    {filteredPlayers.length > 0 ? (
                        filteredPlayers.map((player, idx) => (
                            <div
                                key={player._id || `p-${idx}`}
                                className={`flex items-center gap-3 p-2 rounded-lg transition-colors border border-transparent 
                                    ${isAuctionInProgress
                                        ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                                        : 'hover:bg-white/5 cursor-pointer hover:border-white/5 group'
                                    }`}
                                onClick={() => handlePlayerClick(player)}
                            >
                                <img src={player.image || 'https://via.placeholder.com/100'} alt={player.name} className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover bg-slate-800" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white font-medium text-xs md:text-sm truncate">{player.name}</h4>
                                    <div className="text-[10px] md:text-xs text-slate-500">{player.role} • {formatCurrency(player.basePrice).replace('₹ ', '')}</div>
                                </div>
                                {!isAuctionInProgress && (
                                    <button className="p-1 text-primary md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <UserPlus size={14} />
                                    </button>
                                )}
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
            )}
        </div>
    );
};

export default AuctioneerControls;
