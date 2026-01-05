import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const auctionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Auction name is required'],
        trim: true
    },
    auctioneer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    roomId: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['IDLE', 'ACTIVE', 'PAUSED', 'COMPLETED'],
        default: 'IDLE'
    },
    currentPlayer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer',
        default: null
    },
    currentBid: {
        amount: {
            type: Number,
            default: 0
        },
        team: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Team',
            default: null
        },
        placedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        }
    },
    timer: {
        duration: {
            type: Number,
            default: 60 // seconds
        },
        remaining: {
            type: Number,
            default: 60
        },
        isRunning: {
            type: Boolean,
            default: false
        },
        startedAt: {
            type: Date,
            default: null
        }
    },
    settings: {
        initialPurse: {
            type: Number,
            default: 100 // 100 Crores
        },
        minBidIncrement: {
            type: Number,
            default: 0.5 // 50 lakhs
        },
        timerDuration: {
            type: Number,
            default: 60 // seconds
        },
        maxTeams: {
            type: Number,
            default: 10
        }
    },
    teams: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Team'
    }],
    players: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RoomPlayer'
    }],
    completedAt: {
        type: Date,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Method to start timer
auctionSchema.methods.startTimer = function () {
    this.timer.isRunning = true;
    this.timer.startedAt = new Date();
    return this.save();
};

// Method to pause timer
auctionSchema.methods.pauseTimer = function () {
    if (this.timer.isRunning) {
        const elapsed = Math.floor((Date.now() - this.timer.startedAt) / 1000);
        this.timer.remaining = Math.max(0, this.timer.remaining - elapsed);
        this.timer.isRunning = false;
        this.timer.startedAt = null;
    }
    return this.save();
};

// Method to extend timer
auctionSchema.methods.extendTimer = function (seconds) {
    this.timer.remaining += seconds;
    if (this.timer.isRunning) {
        this.timer.startedAt = new Date();
    }
    return this.save();
};

// Method to reset timer
auctionSchema.methods.resetTimer = function () {
    this.timer.remaining = this.settings.timerDuration;
    this.timer.isRunning = false;
    this.timer.startedAt = null;
    return this.save();
};

// Encrypt password using bcrypt
auctionSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match auction/room password
auctionSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const Auction = mongoose.model('Auction', auctionSchema);

export default Auction;
