import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';

dotenv.config();

import { samplePlayers } from './data/samplePlayers.js';

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing players
        await Player.deleteMany({});
        console.log('🗑️  Cleared existing players');

        // Insert sample players
        await Player.insertMany(samplePlayers);
        console.log(`✅ Inserted ${samplePlayers.length} sample players`);

        console.log('\n✨ Database seeded successfully!\n');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
