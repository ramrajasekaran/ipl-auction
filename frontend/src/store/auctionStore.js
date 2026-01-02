import { create } from 'zustand';

const useAuctionStore = create((set, get) => ({
    // Auction state
    auctionId: null,
    auction: null,
    currentPlayer: null,
    currentBid: {
        amount: 0,
        team: null,
        teamName: '',
    },
    teams: [],
    players: [],
    status: 'IDLE', // IDLE, ACTIVE, PAUSED, COMPLETED

    // Timer state
    timer: {
        duration: 60,
        remaining: 60,
        isRunning: false,
    },

    // Bid history
    bidHistory: [],

    // Actions
    setAuctionId: (id) => set({ auctionId: id }),

    setAuction: (auction) => {
        set({
            auction,
            currentPlayer: auction?.currentPlayer || null,
            currentBid: auction?.currentBid || { amount: 0, team: null, teamName: '' },
            status: auction?.status || 'IDLE',
            timer: auction?.timer || { duration: 60, remaining: 60, isRunning: false },
        });
    },

    setTeams: (teams) => set({ teams }),

    setPlayers: (players) => set({ players }),

    setCurrentPlayer: (player) => {
        set({
            currentPlayer: player,
            currentBid: { amount: player?.basePrice || 0, team: null, teamName: '' },
            bidHistory: [],
        });
    },

    updateBid: (bid, teamName) => {
        set({
            currentBid: { ...bid, teamName },
        });

        // Add to bid history
        const history = get().bidHistory;
        set({
            bidHistory: [
                {
                    amount: bid.amount,
                    team: bid.team,
                    teamName,
                    timestamp: new Date(),
                },
                ...history,
            ].slice(0, 20), // Keep last 20 bids
        });
    },

    setStatus: (status) => set({ status }),

    updateTimer: (timer) => set({ timer }),

    startTimer: () => {
        set({
            timer: { ...get().timer, isRunning: true },
            status: 'ACTIVE',
        });
    },

    pauseTimer: () => {
        set({
            timer: { ...get().timer, isRunning: false },
            status: 'PAUSED',
        });
    },

    updateTimerRemaining: (remaining) => {
        set({
            timer: { ...get().timer, remaining },
        });
    },

    extendTimer: (seconds) => {
        const currentRemaining = get().timer.remaining;
        set({
            timer: { ...get().timer, remaining: currentRemaining + seconds },
        });
    },

    resetTimer: () => {
        const duration = get().timer.duration;
        set({
            timer: { duration, remaining: duration, isRunning: false },
        });
    },

    resetAuction: () => {
        set({
            currentPlayer: null,
            currentBid: { amount: 0, team: null, teamName: '' },
            status: 'IDLE',
            bidHistory: [],
        });
        get().resetTimer();
    },

    clearAuction: () => {
        set({
            auctionId: null,
            auction: null,
            currentPlayer: null,
            currentBid: { amount: 0, team: null, teamName: '' },
            teams: [],
            players: [],
            status: 'IDLE',
            timer: { duration: 60, remaining: 60, isRunning: false },
            bidHistory: [],
        });
    },
}));

export default useAuctionStore;
