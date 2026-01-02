import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function showActualData() {
    try {
        await mongoose.connect(uri);

        const db = mongoose.connection.db;
        const playersCollection = db.collection('players');

        // Get ONE global player (no auctionId)
        const globalPlayer = await playersCollection.findOne({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        });

        console.log('\n=== GLOBAL PLAYER (Template) ===');
        console.log('All fields:', Object.keys(globalPlayer || {}));
        console.log('\nFull data:');
        console.log(JSON.stringify(globalPlayer, null, 2));

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

showActualData();
