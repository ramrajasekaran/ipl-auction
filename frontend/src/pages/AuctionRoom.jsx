import React, { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import PlayerCard from '../components/PlayerCard';
import BidControls from '../components/BidControls';
import AuctioneerControls from '../components/AuctioneerControls';
import StatsPanel from '../components/StatsPanel';
import TeamDashboard from '../components/TeamDashboard';
import TradeCenter from '../components/TradeCenter';
import Timer from '../components/Timer';
import { Gavel, LayoutDashboard, Users, LogOut } from 'lucide-react';
import { getDynamicIncrement } from '../utils/formatters';

const AuctionRoom = () => {
    const { roomId: urlRoomCode } = useParams();
    const navigate = useNavigate();

    const {
        userRole,
        roomData,
        auctionState,
        currentUser,
        placeBid,
        startTurn,
        sellPlayer,
        unsoldPlayer,
        timerState,
        lastSoldPlayer,
        refreshState,
        logout,
        leaveGame
    } = useGame();

    const [viewMode, setViewMode] = useState('AUCTION'); // AUCTION | DASHBOARD | TRADE

    // Sync state with URL if they don't match
    React.useEffect(() => {
        // PREVENTION: If we are already active in a room, and the URL changes (e.g. back button),
        // we should prioritize the CURRENT STATE and revert the URL, rather than clearing state.
        if (roomData.roomId && roomData.isActive && urlRoomCode && roomData.roomId.toUpperCase() !== urlRoomCode.toUpperCase()) {
            console.warn(`[AuctionRoom] URL mismatch prevented. State=${roomData.roomId}, URL=${urlRoomCode}. Forcing URL sync.`);
            // Force URL to match state (replace history to avoid stack loop)
            window.history.replaceState(null, document.title, `/auction/${roomData.roomId}`);
            return;
        }

        // Only refresh state if we are NOT active or if we really need to load from URL (fresh load)
        if ((!roomData.roomId || !roomData.isActive) && urlRoomCode) {
            console.log(`[AuctionRoom] Fresh load or empty state. syncing from URL: ${urlRoomCode}`);
            refreshState(urlRoomCode);
        }
    }, [urlRoomCode, roomData.roomId, roomData.isActive]);

    // Ref to track if navigation is intentional (Leave/Logout buttons)
    const isIntentionalLeave = React.useRef(false);

    // Prevent Back Navigation & Tab Close
    React.useEffect(() => {
        // Capture the current (correct) URL of the auction room
        const currentUrl = window.location.href;

        // 1. Push a dummy state so there is something to 'pop'
        window.history.pushState(null, '', currentUrl);

        // 2. Handle Back Button
        const handlePopState = (event) => {
            // Prevent default back action by pushing the CORRECT URL again
            window.history.pushState(null, '', currentUrl);
        };

        // 3. Handle Refresh / Tab Close / Navigation
        const handleBeforeUnload = (e) => {
            // If we are leaving intentionally, DO NOT show the prompt
            if (isIntentionalLeave.current) {
                return;
            }

            e.preventDefault();
            e.returnValue = ''; // Chrome requires this to show prompt
            return '';
        };

        window.addEventListener('popstate', handlePopState);
        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
            window.removeEventListener('popstate', handlePopState);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, []);

    // Protection: If no role or data, redirect (basic protection)
    if (!userRole) {
        return <Navigate to="/" />;
    }

    const isManager = userRole === 'MANAGER' || userRole === 'AUCTIONEER';
    const teamId = currentUser?.teamId;
    const currentWinningTeam = (roomData.teams || []).find(t => (t._id || t.id)?.toString() === auctionState.currentBidder?.toString());

    return (
        <div className="flex h-screen bg-background overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-20%] right-[20%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col relative z-10 h-full min-w-0">
                {/* Header */}
                <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-black/20 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h1 className="text-white font-bold tracking-wide uppercase">IPL Auction 2024</h1>
                        <span className="text-slate-500 text-sm">Room: {urlRoomCode}</span>
                    </div>

                    {!isManager && currentUser && (
                        <div className="hidden md:flex bg-white/5 rounded-lg p-1 mr-4">
                            <button
                                onClick={() => setViewMode('AUCTION')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'AUCTION' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Gavel size={14} /> AUCTION
                            </button>
                            <button
                                onClick={() => setViewMode('DASHBOARD')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'DASHBOARD' ? 'bg-blue-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LayoutDashboard size={14} /> MY SQUAD
                            </button>
                            {/* Trade option disabled for mega auctions - only for mini auctions
                            <button
                                onClick={() => setViewMode('TRADE')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'TRADE' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users size={14} /> TRADE
                            </button>
                            */}
                        </div>
                    )}

                    {isManager && (
                        <div className="text-gold text-sm font-medium px-3 py-1 bg-gold/10 rounded-full border border-gold/20">
                            MANAGER VIEW
                        </div>
                    )}

                    {/* Leave Room Button (Keep Session) */}
                    <button
                        onClick={() => {
                            if (confirm('Leave this room? You can rejoin later using the "Continue" tab.')) {
                                isIntentionalLeave.current = true; // Bypass listener
                                leaveGame();
                                window.location.href = '/welcome';
                            }
                        }}
                        className="ml-4 px-3 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
                        title="Leave Room"
                    >
                        Leave Room
                    </button>

                    {/* Logout Button */}
                    <button
                        onClick={() => {
                            if (confirm('Are you sure you want to LOGOUT? This will end your session.')) {
                                isIntentionalLeave.current = true; // Bypass listener
                                logout();
                                window.location.href = '/login';
                            }
                        }}
                        className="ml-2 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </header>

                {/* VIEW MODES */}
                {viewMode === 'AUCTION' && (
                    <main className="flex-1 p-6 flex flex-col md:flex-row items-center justify-center gap-8 overflow-y-auto">
                        {/* Left Side: Manager Controls - NOW VISIBLE ON MOBILE */}
                        {isManager && (
                            <div className="flex flex-col gap-4 w-full md:w-80 md:h-full">
                                <AuctioneerControls
                                    onSelectPlayer={startTurn}
                                    onSold={sellPlayer}
                                    onUnsold={unsoldPlayer}
                                    currentBid={auctionState.currentBid}
                                    isBiddingActive={auctionState.isBiddingActive}
                                />
                            </div>
                        )}

                        {/* Center: Player Card + Bid Controls + Leading Bid */}
                        <div className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl gap-4 overflow-hidden px-4">
                            <PlayerCard
                                player={auctionState.currentPlayer}
                                currentBid={auctionState.currentBid}
                                lastSoldPlayer={lastSoldPlayer}
                                currentBidderName={currentWinningTeam?.name}
                            />

                            {/* Bid Controls for Team Owners - between player and leading bid */}
                            {!isManager && (auctionState.isBiddingActive || auctionState.currentPlayer) && (
                                <BidControls
                                    currentBid={auctionState.currentBid}
                                    onBid={(amount) => placeBid(amount, teamId)}
                                    isMyTurn={(auctionState.currentBidder?.toString() || '') !== (teamId?.toString() || '')}
                                    isDisabled={
                                        !auctionState.isBiddingActive ||
                                        (auctionState.currentBidder?.toString() || '') === (teamId?.toString() || '') ||
                                        ((roomData.teams || []).find(t => (t._id || t.id)?.toString() === teamId?.toString())?.currentPurse || 0) < ((auctionState.currentBid + getDynamicIncrement(auctionState.currentBid)) / 100)
                                    }
                                />
                            )}

                            {/* Unified Timer State */}
                            {(() => {
                                // show timer if it's running OR if there's time remaining on a selected player
                                const showTimer = timerState.isRunning || (timerState.remaining > 0);
                                return showTimer && (
                                    <Timer remaining={timerState.remaining} isRunning={timerState.isRunning} />
                                );
                            })()}
                        </div>


                        {/* Right Side: Stats Panel (Teams & Squads) */}
                        <div className="hidden md:flex flex-col gap-4 w-80 h-full">
                            <StatsPanel
                                teams={roomData.teams || []}
                                currentBidderId={auctionState.currentBidder}
                            />
                        </div>
                    </main>
                )}

                {viewMode === 'DASHBOARD' && (
                    <div className="flex-1 p-6 overflow-hidden">
                        {currentUser?.teamId ? (
                            <TeamDashboard team={(roomData.teams || []).find(t => (t._id || t.id)?.toString() === currentUser.teamId?.toString())} />
                        ) : (
                            <div className="text-center text-slate-400 mt-20">Access Restricted to Team Owners</div>
                        )}
                    </div>
                )}

                {viewMode === 'TRADE' && (
                    <div className="flex-1 p-6 overflow-hidden max-w-4xl mx-auto w-full">
                        <TradeCenter />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctionRoom;
