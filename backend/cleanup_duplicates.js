import mongoose from 'mongoose';
import dotenv from 'dotenv';
import RoomPlayer from './models/RoomPlayer.js';
import Auction from './models/Auction.js';

dotenv.config();

const cleanDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Delete all RoomPlayers
        const result = await RoomPlayer.deleteMany({});
        console.log(`🗑️  Deleted ${result.deletedCount} RoomPlayers`);

        // Clear player references from all auctions
        const updateResult = await Auction.updateMany({}, { players: [] });
        console.log(`🔄 Updated ${updateResult.modifiedCount} auctions (cleared player arrays)\n`);

        console.log('✅ Cleanup complete! Now you can create a new room and load players fresh.\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

cleanDuplicates();
