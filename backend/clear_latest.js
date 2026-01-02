import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const auctionId = '69567b6621fd178ee62c41f3'; // Latest auction ID from your logs

async function clearLatestAuction() {
    try {
        await mongoose.connect(uri);

        const db = mongoose.connection.db;
        const playersCollection = db.collection('players');
        const auctionsCollection = db.collection('auctions');

        console.log('🗑️  Deleting players from auction:', auctionId);
        const result = await playersCollection.deleteMany({
            auctionId: new mongoose.Types.ObjectId(auctionId)
        });
        console.log(`✅ Deleted ${result.deletedCount} players`);

        await auctionsCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(auctionId) },
            { $set: { players: [], currentPlayer: null } }
        );
        console.log('✅ Cleared auction');

        await mongoose.disconnect();
        console.log('\n🎯 Now refresh and click "Load Default Players"!');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

clearLatestAuction();
