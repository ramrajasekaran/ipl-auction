import mongoose from 'mongoose';

const playerSchema = new mongoose.Schema({
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
        ref: 'Team',
        default: null
    },
    soldPrice: {
        type: Number,
        default: null
    },
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster queries
playerSchema.index({ status: 1, role: 1 });

const Player = mongoose.model('Player', playerSchema);

export default Player;
