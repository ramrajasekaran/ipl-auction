import mongoose from 'mongoose';

const playerReleaseSchema = new mongoose.Schema({
    miniAuctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MiniAuction',
        required: true
    },
    teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer',
        required: true
    },
    originalBidAmount: {
        type: Number,
        required: true
    },
    reason: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Index for faster lookups
playerReleaseSchema.index({ miniAuctionId: 1 });
playerReleaseSchema.index({ teamId: 1 });

const PlayerRelease = mongoose.model('PlayerRelease', playerReleaseSchema);

export default PlayerRelease;
