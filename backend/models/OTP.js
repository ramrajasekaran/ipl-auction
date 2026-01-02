import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true
    },
    code: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['MANAGER', 'TEAM', 'USER'],
        required: true
    },
    roomId: {
        type: String,
        required: function () {
            return this.type === 'MANAGER' || this.type === 'TEAM';
        }
    },
    teamName: {
        type: String,
        required: function () {
            return this.type === 'TEAM';
        }
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Auto-delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
