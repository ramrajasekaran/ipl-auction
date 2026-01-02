import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;

async function checkPlayerData() {
    try {
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const Player = mongoose.model('Player');

        // Get a sample of global players
        const globalPlayers = await Player.find({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        }).limit(5).lean();

        console.log('\n=== Sample Global Players ===');
        globalPlayers.forEach((p, idx) => {
            console.log(`\nPlayer ${idx + 1}:`);
            console.log('Fields:', Object.keys(p));
            console.log('Player Name field:', p['Player Name']);
            console.log('name field:', p.name);
            console.log('Player field:', p.Player);
            console.log('Full object:', JSON.stringify(p, null, 2));
        });

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
    }
}

checkPlayerData();
