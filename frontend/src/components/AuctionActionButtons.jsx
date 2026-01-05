import React from 'react';
import { Gavel } from 'lucide-react';

const AuctionActionButtons = ({
    timerState,
    stopTimer,
    triggerTimer,
    auctionState
}) => {
    // Check if there is an active player or turn
    const isActive = auctionState?.isBiddingActive || auctionState?.currentPlayer;

    if (!isActive) return null;

    return (
        <div className="w-full max-w-sm mt-4">
            {timerState.isRunning ? (
                <div className="relative">
                    <button
                        onClick={stopTimer}
                        className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-900/40 flex items-center justify-center gap-3 animate-pulse-slow"
                    >
                        <Gavel size={24} className="animate-bounce" />
                        <div className="flex flex-col items-start leading-none">
                            <span className="text-xs opacity-90 uppercase tracking-tighter">FINAL CALL</span>
                            <span className="text-2xl font-black">{timerState.remaining}s</span>
                        </div>
                        <Gavel size={24} className="animate-bounce" />
                    </button>
                    <div className="absolute -top-1 -left-1 -right-1 -bottom-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl blur-md opacity-50 animate-pulse" />
                </div>
            ) : (auctionState?.currentBid?.team && timerState.remaining === 0 && !timerState.isRunning) ? (
                <button
                    onClick={triggerTimer}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-900/40 hover:scale-105 flex items-center justify-center gap-2"
                >
                    <Gavel size={20} />
                    RESUME BIDDING
                </button>
            ) : (
                <button
                    onClick={triggerTimer}
                    disabled={!auctionState?.currentPlayer}
                    className="group relative w-full h-16 bg-gradient-to-br from-amber-500 via-yellow-500 to-amber-600 text-black rounded-xl font-black transition-all shadow-xl shadow-amber-900/50 hover:shadow-2xl hover:shadow-amber-500/50 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden flex items-center justify-center gap-4"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <Gavel
                        size={32}
                        className="relative z-10 drop-shadow-2xl group-hover:rotate-[-15deg] group-active:rotate-[-35deg] group-active:translate-y-2 transition-all duration-150"
                    />
                    <div className="relative z-10 text-left">
                        <div className="text-sm font-bold opacity-90 uppercase tracking-tighter">FINAL CALL</div>
                        <div className="text-xs opacity-70 leading-none">START 10s COUNTDOWN</div>
                    </div>
                </button>
            )}
        </div>
    );
};

export default AuctionActionButtons;
