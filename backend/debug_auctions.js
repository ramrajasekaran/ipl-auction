import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Auction from './models/Auction.js';
import Team from './models/Team.js';
import User from './models/User.js';

dotenv.config({ path: './.env' });

if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is undefined. Attempting default local connection.');
    process.env.MONGO_URI = 'mongodb://127.0.0.1:27017/ipl-auction';
}

const debugAuctions = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const auctions = await Auction.find({});
        console.log('\n--- EXISTING AUCTIONS ---');

        for (const auction of auctions) {
            console.log(`\nRoom ID: "${auction.roomId}"`); // Quotes to see whitespace
            console.log(`Status: ${auction.status}`);
            console.log(`ID: ${auction._id}`);
            console.log(`Manager ID: ${auction.auctioneer}`);
            console.log(`Password Hash: ${auction.password.substring(0, 10)}...`);

            const teams = await Team.find({ auction: auction._id });
            console.log(`Teams (${teams.length}): ${teams.map(t => t.name).join(', ')}`);
        }

        if (auctions.length === 0) {
            console.log('No auctions found in database.');
        }

        console.log('\n-------------------------\n');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

debugAuctions();
