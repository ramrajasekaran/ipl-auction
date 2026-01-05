import React, { useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import PlayerCard from '../components/PlayerCard';
import BidControls from '../components/BidControls';
import AuctioneerControls from '../components/AuctioneerControls';
import StatsPanel from '../components/StatsPanel';
import TeamDashboard from '../components/TeamDashboard';
import TradeCenter from '../components/TradeCenter';
import MiniTradeCenter from '../components/MiniTradeCenter';
import Timer from '../components/Timer';
import AllTeamsView from '../components/AllTeamsView';
import { Gavel, LayoutDashboard, Users, LogOut, XCircle } from 'lucide-react';
import { getDynamicIncrement } from '../utils/formatters';
import { getTeamTrades } from '../services/miniAuctionAPI';

const AuctionRoom = () => {
    const { roomId, miniAuctionId } = useParams();
    const urlRoomCode = roomId || miniAuctionId;
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
        leaveGame,
        triggerTimer,
        stopTimer
    } = useGame();

    const [viewMode, setViewMode] = useState('AUCTION'); // AUCTION | DASHBOARD | TRADE | ALL_TEAMS
    const [pendingTradeCount, setPendingTradeCount] = useState(0);

    // Sync state with URL if they don't match
    // Robust Team Finder: Match by Team ID OR Owner ID (User ID)
    const myTeam = (roomData.teams || []).find(t => {
        const tId = (t._id || t.id)?.toString();
        const tOwner = (t.owner?._id || t.owner || '').toString();
        const myTeamId = currentUser?.teamId?.toString();
        const myUserId = currentUser?.userId?.toString();

        return (myTeamId && tId === myTeamId) || (myUserId && tOwner === myUserId);
    });

    // Trade Notification Polling
    React.useEffect(() => {
        if (!myTeam || !roomData.auctionId) return;

        const fetchTradeCount = async () => {
            try {
                const res = await getTeamTrades(roomData.auctionId, myTeam._id);
                if (res.success) {
                    const count = res.trades.filter(t => t.status === 'PENDING' && (t.receivingTeam._id || t.receivingTeam) === myTeam._id).length;
                    setPendingTradeCount(count);
                }
            } catch (e) { console.error('Trade Poll Failed', e); }
        };

        fetchTradeCount();
        const interval = setInterval(fetchTradeCount, 10000);
        return () => clearInterval(interval);
    }, [myTeam?._id, roomData.auctionId]);

    // Sync state with URL
    React.useEffect(() => {
        if (roomData.roomId && roomData.isActive && urlRoomCode && roomData.roomId.toUpperCase() !== urlRoomCode.toUpperCase()) {
            console.warn(`[AuctionRoom] URL mismatch prevented. State=${roomData.roomId}, URL=${urlRoomCode}. Forcing URL sync.`);
            window.history.replaceState(null, document.title, `/auction/${roomData.roomId}`);
            return;
        }

        if ((!roomData.roomId || !roomData.isActive) && urlRoomCode) {
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


    const teamId = myTeam?._id || currentUser?.teamId;
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
                <header className="h-auto min-h-16 py-2 border-b border-white/10 flex flex-wrap items-center justify-between px-4 bg-black/20 backdrop-blur-sm gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <h1 className="text-white font-bold tracking-wide uppercase">IPL AUCTION ARENA</h1>
                        <span className="text-slate-500 text-sm">Room: {roomData?.roomId || urlRoomCode}</span>
                    </div>

                    {!isManager && currentUser && (
                        <div className="flex bg-white/5 rounded-lg p-1 mr-4 order-3 md:order-none w-full md:w-auto justify-center mt-2 md:mt-0">
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
                            <button
                                onClick={() => setViewMode('ALL_TEAMS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ALL_TEAMS' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users size={14} /> TEAMS & PURSE
                            </button>
                            <button
                                onClick={() => setViewMode('TRADE')}
                                className={`relative px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'TRADE' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users size={14} /> TRADE
                                {pendingTradeCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-slate-900 animate-pulse">
                                        {pendingTradeCount}
                                    </div>
                                )}
                            </button>
                        </div>
                    )}

                    {isManager && (
                        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setViewMode('AUCTION')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'AUCTION' ? 'bg-gold text-black' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Gavel size={14} /> AUCTION
                            </button>
                            <button
                                onClick={() => setViewMode('ALL_TEAMS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ALL_TEAMS' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users size={14} /> TEAMS & PURSE
                            </button>
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
                        <span className="hidden md:inline">Leave Room</span>
                        <span className="md:hidden"><LogOut size={16} className="rotate-180" /></span>
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
                    <main className="flex-1 p-2 md:p-6 pb-40 md:pb-6 flex flex-col md:flex-row items-start md:items-center justify-center gap-4 md:gap-8 overflow-y-auto">
                        {/* Left Side: Manager Controls - FULL WIDTH ON MOBILE */}
                        {isManager && (
                            <div className="flex flex-col gap-4 w-full md:w-80 md:h-full flex-shrink-0">
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
                        <div className={`flex-1 flex flex-col items-center justify-start w-full max-w-2xl gap-4 px-1 md:px-4 flex`}>

                            {/* Unified Timer State - MOVED TOP for Mobile Visibility */}
                            {(() => {
                                // show timer if it's running OR if there's time remaining on a selected player
                                const showTimer = timerState.isRunning || (timerState.remaining > 0);
                                return showTimer && (
                                    <Timer remaining={timerState.remaining} isRunning={timerState.isRunning} />
                                );
                            })()}

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
                        </div>


                        {/* Right Side: Stats Panel (Teams & Squads) */}

                    </main>
                )}

                {viewMode === 'DASHBOARD' && (
                    <div className="flex-1 p-6 overflow-hidden">
                        {myTeam ? (
                            <TeamDashboard team={myTeam} />
                        ) : (
                            <div className="text-center text-slate-400 mt-20">Access Restricted to Team Owners</div>
                        )}
                    </div>
                )}

                {viewMode === 'TRADE' && (
                    <div className="flex-1 p-6 overflow-hidden max-w-4xl mx-auto w-full">
                        {/* Use MiniTradeCenter for Mini Auctions */}
                        <MiniTradeCenter
                            miniAuctionId={roomData.auctionId}
                            currentTeam={myTeam}
                            allTeams={roomData.teams || []}
                            onClose={() => setViewMode('AUCTION')}
                        />
                    </div>
                )}

                {viewMode === 'ALL_TEAMS' && (
                    <div className="flex-1 overflow-hidden">
                        <AllTeamsView teams={roomData.teams || []} />
                    </div>
                )}

                {/* Fixed Mobile Controls for Manager */}
                {isManager && (auctionState.isBiddingActive || auctionState.currentPlayer) && viewMode === 'AUCTION' && (
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0f172a] via-[#0f172a] to-transparent z-40 md:hidden flex flex-col gap-3">
                        {timerState.isRunning ? (
                            <div className="relative">
                                <button
                                    onClick={stopTimer}
                                    className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-2xl font-bold transition-all shadow-xl shadow-red-900/40 flex items-center justify-center gap-3 animate-pulse-slow active:scale-95"
                                >
                                    <Gavel size={24} className="animate-bounce" />
                                    <div className="text-left">
                                        <div className="text-[10px] opacity-80 uppercase tracking-tighter leading-none mb-1">FINAL CALL</div>
                                        <div className="text-2xl font-black leading-none">{timerState.remaining}s</div>
                                    </div>
                                    <Gavel size={24} className="animate-bounce" />
                                </button>
                                <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-2xl blur-md opacity-30 animate-pulse pointer-events-none" />
                            </div>
                        ) : (auctionState?.currentBid?.team && timerState.remaining === 0 && !timerState.isRunning) ? (
                            <button
                                onClick={triggerTimer}
                                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-blue-900/40 flex items-center justify-center gap-3 active:scale-95"
                            >
                                <Gavel size={20} />
                                <div className="text-xl">RESUME BIDDING</div>
                            </button>
                        ) : (
                            <button
                                onClick={triggerTimer}
                                disabled={!auctionState.currentPlayer}
                                className="group relative w-full h-16 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 text-black rounded-2xl font-black transition-all shadow-xl shadow-amber-900/50 flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50"
                            >
                                <Gavel size={32} className="relative z-10" />
                                <div className="relative z-10 text-left">
                                    <div className="text-xs font-bold opacity-80 uppercase tracking-tighter leading-none mb-1">FINAL CALL</div>
                                    <div className="text-[10px] font-semibold opacity-60 leading-none">Auto-sells when timer ends</div>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AuctionRoom;
