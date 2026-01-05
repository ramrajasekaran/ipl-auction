import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    miniAuctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MiniAuction',
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    offeringTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    receivingTeam: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    offeredPlayer: {
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomPlayer',
            required: true
        },
        originalBidAmount: {
            type: Number,
            required: true
        }
    },
    wantedPlayer: {
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomPlayer',
            required: true
        },
        originalBidAmount: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING'
    },
    chatMessages: [{
        teamId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        teamName: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    respondedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster lookups
tradeSchema.index({ miniAuctionId: 1 });
tradeSchema.index({ offeringTeam: 1 });
tradeSchema.index({ receivingTeam: 1 });
tradeSchema.index({ status: 1 });

const Trade = mongoose.model('Trade', tradeSchema);

export default Trade;
