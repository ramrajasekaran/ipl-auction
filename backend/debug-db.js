import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = 'mongodb://127.0.0.1:27017/ipl-auction';

const run = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const Auction = mongoose.model('Auction', new mongoose.Schema({ roomId: String, players: Array }));
        const Player = mongoose.model('Player', new mongoose.Schema({ name: String, Player: String, auctionId: mongoose.Schema.Types.ObjectId, status: String }));

        const totalPlayers = await Player.countDocuments();
        console.log('Total Players in DB:', totalPlayers);

        const roomPlayers = await Player.countDocuments({ auctionId: { $ne: null } });
        console.log('Players in specific rooms (with auctionId):', roomPlayers);

        const globalPlayers = await Player.countDocuments({ auctionId: { $exists: false } });
        console.log('Global Players (without auctionId):', globalPlayers);

        const samples = await Player.find().limit(5);
        console.log('Sample Data Structure:', JSON.stringify(samples, null, 2));

        const auctions = await Auction.find();
        console.log('Active Auctions:', auctions.map(a => ({ roomId: a.roomId, pCount: a.players?.length })));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

run();
