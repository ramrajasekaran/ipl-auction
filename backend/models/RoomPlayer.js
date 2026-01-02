import mongoose from 'mongoose';

const roomPlayerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Player name is required'],
        trim: true
    },
    country: {
        type: String,
        required: [true, 'Country is required']
    },
    role: {
        type: String,
        enum: ['BATSMAN', 'BOWLER', 'ALL-ROUNDER', 'WICKET-KEEPER'],
        required: [true, 'Player role is required']
    },
    basePrice: {
        type: Number,
        required: [true, 'Base price is required'],
        min: 0.2 // Minimum 20 lakhs
    },
    priceLabel: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: 'https://via.placeholder.com/300x400?text=Player'
    },
    age: {
        type: Number,
        min: 18,
        max: 45
    },
    stats: {
        matches: { type: Number, default: 0 },
        runs: { type: Number, default: 0 },
        wickets: { type: Number, default: 0 },
        average: { type: Number, default: 0 },
        strikeRate: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['UNSOLD', 'SOLD', 'AVAILABLE'],
        default: 'AVAILABLE'
    },
    soldTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team', // Teams are specific to an auction
        default: null
    },
    soldPrice: {
        type: Number,
        default: null
    },
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true // Mandatory for RoomPlayer
    },
    // Reference back to the global template if applicable (optional)
    globalPlayerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries within an auction
roomPlayerSchema.index({ auctionId: 1, status: 1 });
roomPlayerSchema.index({ auctionId: 1, name: 1 });

const RoomPlayer = mongoose.model('RoomPlayer', roomPlayerSchema);

export default RoomPlayer;
