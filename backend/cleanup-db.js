import mongoose from 'mongoose';

const uri = 'mongodb://127.0.0.1:27017/ipl-auction';

async function cleanup() {
    try {
        await mongoose.connect(uri);
        const Player = mongoose.model('Player', new mongoose.Schema({ auctionId: mongoose.Schema.Types.ObjectId }));

        // Find all players where auctionId is not set
        const allPlayers = await mongoose.connection.db.collection('players').find({}).toArray();
        const orphanedIds = allPlayers
            .filter(p => !p.auctionId)
            .map(p => p._id);

        console.log(`Found ${allPlayers.length} total players`);
        console.log(`Found ${orphanedIds.length} orphaned players (no auctionId)`);

        if (orphanedIds.length > 0) {
            const result = await mongoose.connection.db.collection('players').deleteMany({
                _id: { $in: orphanedIds }
            });
            console.log(`Deleted ${result.deletedCount} orphaned players successfully.`);
        } else {
            console.log('No orphaned players found to delete.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Cleanup Error:', error);
        process.exit(1);
    }
}

cleanup();
