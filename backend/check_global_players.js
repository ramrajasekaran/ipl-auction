
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Player from './models/Player.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const checkGlobalPlayers = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Check for players with no auctionId (Global Templates)
        const globalTemplates = await Player.find({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        });

        console.log(`\n📊 Global Player Stats:`);
        console.log(`Total Global Templates Found: ${globalTemplates.length}`);

        if (globalTemplates.length > 0) {
            console.log('\nSample Global Players:');
            globalTemplates.slice(0, 3).forEach(p => {
                console.log(`- ${p.name} (${p.role}) - Price: ${p.basePrice} (ID: ${p._id})`);
            });
        } else {
            console.log('❌ NO Global Players found! The database needs seeding.');
        }

        const allPlayers = await Player.countDocuments({});
        console.log(`\nTotal Players in DB (including room-specific): ${allPlayers}`);

        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkGlobalPlayers();
