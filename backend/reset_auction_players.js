import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
const auctionId = '695675ca736abb26f860aafb'; // Your current auction

async function resetAuctionPlayers() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const playersCollection = db.collection('players');
        const auctionsCollection = db.collection('auctions');

        // Step 1: Delete all players with this auctionId
        console.log('🗑️  Deleting old players from auction...');
        const deleteResult = await playersCollection.deleteMany({
            auctionId: new mongoose.Types.ObjectId(auctionId)
        });
        console.log(`   Deleted ${deleteResult.deletedCount} players\n`);

        // Step 2: Clear players array in auction
        console.log('🔄 Clearing auction players array...');
        await auctionsCollection.updateOne(
            { _id: new mongoose.Types.ObjectId(auctionId) },
            { $set: { players: [] } }
        );
        console.log('   Auction players array cleared\n');

        await mongoose.disconnect();

        console.log('✅ Done! Now refresh your PlayerSelection page and click "Load Default Players"');
        console.log('   The new code will properly map the field names this time!\n');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

resetAuctionPlayers();
