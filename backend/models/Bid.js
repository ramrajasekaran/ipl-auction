import mongoose from 'mongoose';

const bidSchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    player: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer',
        required: true
    },
    team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team',
        required: true
    },
    bidder: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
bidSchema.index({ auction: 1, player: 1, timestamp: -1 });

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
