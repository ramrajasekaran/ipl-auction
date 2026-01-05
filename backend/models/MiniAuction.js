import mongoose from 'mongoose';

const miniAuctionSchema = new mongoose.Schema({
    megaAuctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    roomId: {
        type: String,
        required: true,
        uppercase: true
    },
    status: {
        type: String,
        enum: ['SETUP', 'PLAYER_RELEASE', 'ACTIVE', 'COMPLETED', 'IDLE'],
        default: 'SETUP'
    },
    playerPool: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer'
    }],
    budget: {
        type: Number,
        default: 25 // 25 Cr for mini auction
    },
    currentPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer',
        default: null
    },
    currentBid: {
        amount: { type: Number, default: 0 },
        team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
        placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    timer: {
        isRunning: { type: Boolean, default: false },
        remaining: { type: Number, default: 0 },
        startedAt: { type: Date, default: null }
    },
    settings: {
        minBidIncrement: { type: Number, default: 0.5 },
        timerDuration: { type: Number, default: 10 }
    }
}, {
    timestamps: true
});

// Index for faster lookups
miniAuctionSchema.index({ roomId: 1 });
miniAuctionSchema.index({ megaAuctionId: 1 });

const MiniAuction = mongoose.model('MiniAuction', miniAuctionSchema);

export default MiniAuction;
