import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017/ipl-auction';

async function findAndClearAuction() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const auctionsCollection = db.collection('auctions');
        const playersCollection = db.collection('players');

        // Find auction by roomId
        const auction = await auctionsCollection.findOne({ roomId: 'Z9K252' });

        if (!auction) {
            console.log('❌ Auction not found with roomId: Z9K252');
            process.exit(1);
        }

        console.log('📋 Found Auction:');
        console.log('   ID:', auction._id.toString());
        console.log('   Room ID:', auction.roomId);
        console.log('   Players in auction array:', auction.players?.length || 0);

        // Count players with this auctionId
        const playerCount = await playersCollection.countDocuments({
            auctionId: auction._id
        });
        console.log('   Players in database:', playerCount);

        // Delete all players
        console.log('\n🗑️  Deleting players...');
        const deleteResult = await playersCollection.deleteMany({
            auctionId: auction._id
        });
        console.log(`   ✅ Deleted ${deleteResult.deletedCount} players`);

        // Clear auction players array
        console.log('\n🔄 Clearing auction players array...');
        await auctionsCollection.updateOne(
            { _id: auction._id },
            { $set: { players: [], currentPlayer: null } }
        );
        console.log('   ✅ Auction cleared');

        await mongoose.disconnect();
        console.log('\n✅ Done! Refresh and click "Load Default Players"');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

findAndClearAuction();
