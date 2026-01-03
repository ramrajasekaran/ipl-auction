import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';
import RoomPlayer from './models/RoomPlayer.js';
import Auction from './models/Auction.js';

dotenv.config();

const checkDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Check Global Players
        const globalCount = await Player.countDocuments();
        console.log(`📊 Global Players: ${globalCount}`);

        // Check Auctions
        const auctions = await Auction.find().select('roomId name players');
        console.log(`\n📊 Auctions: ${auctions.length}`);
        for (const auction of auctions) {
            const roomPlayers = await RoomPlayer.countDocuments({ auctionId: auction._id });
            console.log(`  - Room ${auction.roomId}: ${auction.players.length} player refs, ${roomPlayers} actual RoomPlayers`);
        }

        // Check RoomPlayers
        const totalRoomPlayers = await RoomPlayer.countDocuments();
        console.log(`\n📊 Total RoomPlayers across all rooms: ${totalRoomPlayers}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkDatabase();
