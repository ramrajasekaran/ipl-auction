import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    roomId: { type: String, required: true },
    initiatorTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    targetTeam: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    playerIn: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // Player OFFERED by Initiator
    playerOut: { type: mongoose.Schema.Types.ObjectId, ref: 'Player', required: true }, // Player REQUESTED from Target
    status: {
        type: String,
        enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED'],
        default: 'PENDING'
    },
    message: { type: String }, // Optional message
    createdAt: { type: Date, default: Date.now }
});

const Trade = mongoose.model('Trade', tradeSchema);
export default Trade;
