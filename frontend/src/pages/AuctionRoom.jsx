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
import { Gavel, LayoutDashboard, Users, LogOut, XCircle, UserPlus, UserMinus } from 'lucide-react';
import AuctionActionButtons from '../components/AuctionActionButtons';
import ReleasePlayerPanel from '../components/ReleasePlayerPanel';
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

    // Trade Notification Polling - Only for Mini Auctions
    React.useEffect(() => {
        // Trade is only available for Mini Auctions
        if (!miniAuctionId || !myTeam || !roomData.auctionId) return;

        const fetchTradeCount = async () => {
            try {
                const res = await getTeamTrades(roomData.auctionId, myTeam._id);
                if (res.success) {
                    const count = res.trades.filter(t => t.status === 'PENDING' && (t.receivingTeam._id || t.receivingTeam) === myTeam._id).length;
                    setPendingTradeCount(count);
                }
            } catch (e) { }
        };

        fetchTradeCount();
        const interval = setInterval(fetchTradeCount, 10000);
        return () => clearInterval(interval);
    }, [miniAuctionId, myTeam?._id, roomData.auctionId]);

    // Sync state with URL
    React.useEffect(() => {
        if (!miniAuctionId && roomData.roomId && roomData.isActive && urlRoomCode && roomData.roomId.toUpperCase() !== urlRoomCode.toUpperCase()) {

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
        <div className="flex h-[100dvh] bg-background overflow-hidden relative">
            {/* Background Effects */}
            {/* Arena Background Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[20%] w-[50%] h-[50%] bg-ipl-blue/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[20%] w-[50%] h-[50%] bg-gold/10 blur-[120px] rounded-full mix-blend-overlay" />
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



                    {isManager && (
                        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setViewMode('AUCTION')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'AUCTION' ? 'bg-gold text-black' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Gavel size={14} /> AUCTION
                            </button>
                            <button
                                onClick={() => setViewMode('PLAYERS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'PLAYERS' ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <UserPlus size={14} /> PLAYERS
                            </button>
                            <button
                                onClick={() => setViewMode('ALL_TEAMS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ALL_TEAMS' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users size={14} /> TEAMS & PURSE
                            </button>
                        </div>
                    )}

                    {/* Team Owner Controls */}
                    {!isManager && (
                        <div className="flex bg-white/5 rounded-lg p-1 gap-1">
                            <button
                                onClick={() => setViewMode('AUCTION')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'AUCTION' ? 'bg-gold text-black' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Gavel size={14} /> <span className="hidden sm:inline">AUCTION</span>
                            </button>
                            <button
                                onClick={() => setViewMode('DASHBOARD')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'DASHBOARD' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <LayoutDashboard size={14} /> <span className="hidden sm:inline">MY SQUAD</span>
                            </button>
                            <button
                                onClick={() => setViewMode('ALL_TEAMS')}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'ALL_TEAMS' ? 'bg-green-500 text-white' : 'text-slate-400 hover:text-white'}`}
                            >
                                <Users size={14} /> <span className="hidden sm:inline">TEAMS & PURSE</span>
                            </button>
                            {/* Trade Button - Only for Mini Auctions */}
                            {miniAuctionId && (
                                <button
                                    onClick={() => setViewMode('TRADE')}
                                    className={`relative px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'TRADE' ? 'bg-purple-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <Users size={14} /> <span className="hidden sm:inline">TRADE</span>
                                    {pendingTradeCount > 0 && (
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full border border-slate-900 animate-pulse">
                                            {pendingTradeCount}
                                        </div>
                                    )}
                                </button>
                            )}
                            {/* Release Button - Only for Mini Auctions & BEFORE Auction Starts */}
                            {miniAuctionId && !auctionState.currentPlayer && (auctionState.history || []).length === 0 && !lastSoldPlayer && (
                                <button
                                    onClick={() => setViewMode('RELEASE')}
                                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${viewMode === 'RELEASE' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'}`}
                                >
                                    <UserMinus size={14} /> <span className="hidden sm:inline">RELEASE</span>
                                </button>
                            )}
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
                        onClick={async () => {
                            if (confirm('Are you sure you want to LOGOUT? This will end your session.')) {
                                isIntentionalLeave.current = true; // Bypass listener
                                await logout();
                                navigate('/portal');
                            }
                        }}
                        className="ml-2 p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                        title="Logout"
                    >
                        <LogOut size={18} />
                    </button>
                </header>

                {/* VIEW MODES */}
                {(viewMode === 'AUCTION' || viewMode === 'PLAYERS') && (
                    <main className={`flex-1 p-2  md:p-6 md:pb-6 flex flex-col md:flex-row items-center md:items-center justify-start md:justify-center gap-4 md:gap-8 ${viewMode === 'PLAYERS' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                        {/* Left Side: Manager Controls - FULL WIDTH ON MOBILE (PLAYERS TAB) / SIDEBAR ON DESKTOP */}
                        {isManager && (
                            <div className={`flex flex-col gap-4 flex-shrink-0 ${viewMode === 'PLAYERS' ? 'w-full h-full flex flex-1' : 'hidden'}`}>
                                <AuctioneerControls
                                    onSelectPlayer={(p) => {
                                        startTurn(p);
                                        setViewMode('AUCTION');
                                    }}
                                    onSold={sellPlayer}
                                    onUnsold={unsoldPlayer}
                                    currentBid={auctionState.currentBid}
                                    isBiddingActive={auctionState.isBiddingActive}
                                    showList={viewMode === 'PLAYERS'}
                                    showSearch={viewMode === 'PLAYERS'}
                                />
                            </div>
                        )}

                        {/* Center: Player Card + Bid Controls + Leading Bid (HIDDEN IN PLAYERS MODE) */}
                        <div className={`flex-1 flex-col items-center justify-start w-full max-w-2xl gap-4 px-1 md:px-4 ${viewMode === 'PLAYERS' ? 'hidden' : 'flex'}`}>

                            {/* Unified Timer State - MOVED TOP for Mobile Visibility */}
                            {(() => {
                                // show timer if it's running OR if there's time remaining on a selected player
                                // HIDE for Manager because they have the timer inside their control buttons
                                const showTimer = !isManager && (timerState.isRunning || (timerState.remaining > 0));
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

                            {/* Manager Actions (Final Call, Resume) - Moved below card */}
                            {isManager && (
                                <AuctionActionButtons
                                    timerState={timerState}
                                    stopTimer={stopTimer}
                                    triggerTimer={triggerTimer}
                                    auctionState={auctionState}
                                />
                            )}

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

                {/* Trade View - Only for Mini Auctions */}
                {viewMode === 'TRADE' && miniAuctionId && (
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

                {viewMode === 'RELEASE' && (
                    <ReleasePlayerPanel
                        miniAuctionId={miniAuctionId || roomData.auctionId}
                        teamId={myTeam?._id}
                        onClose={() => setViewMode('AUCTION')}
                    />
                )}

                {/* Fixed Mobile Controls for Manager - REMOVED (Replaced by sticky buttons in main flow) */}
            </div>
        </div>
    );
};

export default AuctionRoom;
