import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const teamSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Team name is required'],
        trim: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    password: {
        type: String,
        required: true // Team PIN/Password for re-entry
    },
    initialPurse: {
        type: Number,
        default: 100, // 100 Crores
        required: true
    },
    currentPurse: {
        type: Number,
        required: true
    },
    players: [{
        player: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomPlayer'
        },
        boughtPrice: {
            type: Number,
            required: true
        },
        boughtAt: {
            type: Date,
            default: Date.now
        }
    }],
    auctionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Auction',
        required: true
    },
    color: {
        type: String,
        default: '#3B82F6' // Default blue color
    },
    // Mini Auction Fields
    miniAuctionBudget: {
        type: Number,
        default: 25 // 25 Cr for mini auction
    },
    releasedPlayers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer'
    }],
    tradedPlayers: [{
        playerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomPlayer'
        },
        tradedWith: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team'
        },
        tradedFor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'RoomPlayer'
        },
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    logo: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Compound unique index: team name must be unique within each auction
teamSchema.index({ name: 1, auctionId: 1 }, { unique: true });

// Encrypt password using bcrypt
teamSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    }

    if (this.isNew) {
        this.currentPurse = this.initialPurse;
    }
    next();
});

// Match team password
teamSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for total spent
teamSchema.virtual('totalSpent').get(function () {
    return this.initialPurse - this.currentPurse;
});

// Method to check if team can afford a bid (amount is in Lakhs)
teamSchema.methods.canAfford = function (amount) {
    return this.currentPurse >= (amount / 100);
};

// Method to deduct amount from purse (amount is in Lakhs)
teamSchema.methods.deductPurse = function (amount) {
    this.currentPurse -= (amount / 100);
    return this.save();
};

const Team = mongoose.model('Team', teamSchema);

export default Team;
