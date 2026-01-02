import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';

dotenv.config();

const samplePlayers = [
    {
        name: 'Virat Kohli',
        country: 'India',
        role: 'BATSMAN',
        basePrice: 2,
        age: 35,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 223, runs: 7263, wickets: 4, average: 37.39, strikeRate: 136.89 }
    },
    {
        name: 'Jasprit Bumrah',
        country: 'India',
        role: 'BOWLER',
        basePrice: 2,
        age: 30,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32365cecc?w=400',
        stats: { matches: 120, runs: 56, wickets: 165, average: 23.55, strikeRate: 20.2 }
    },
    {
        name: 'Hardik Pandya',
        country: 'India',
        role: 'ALL-ROUNDER',
        basePrice: 2,
        age: 30,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 104, runs: 1548, wickets: 50, average: 27.77, strikeRate: 145.24 }
    },
    {
        name: 'MS Dhoni',
        country: 'India',
        role: 'WICKET-KEEPER',
        basePrice: 2,
        age: 42,
        image: 'https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=400',
        stats: { matches: 234, runs: 5082, wickets: 0, average: 37.60, strikeRate: 135.92 }
    },
    {
        name: 'Rohit Sharma',
        country: 'India',
        role: 'BATSMAN',
        basePrice: 2,
        age: 36,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 243, runs: 6211, wickets: 15, average: 29.86, strikeRate: 130.17 }
    },
    {
        name: 'Rashid Khan',
        country: 'Afghanistan',
        role: 'BOWLER',
        basePrice: 2,
        age: 25,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32365cecc?w=400',
        stats: { matches: 93, runs: 285, wickets: 119, average: 23.02, strikeRate: 19.8 }
    },
    {
        name: 'Ben Stokes',
        country: 'England',
        role: 'ALL-ROUNDER',
        basePrice: 1.5,
        age: 32,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 43, runs: 920, wickets: 28, average: 30.66, strikeRate: 135.29 }
    },
    {
        name: 'Glenn Maxwell',
        country: 'Australia',
        role: 'ALL-ROUNDER',
        basePrice: 1.5,
        age: 35,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 129, runs: 2691, wickets: 28, average: 29.61, strikeRate: 153.84 }
    },
    {
        name: 'Jos Buttler',
        country: 'England',
        role: 'WICKET-KEEPER',
        basePrice: 1.5,
        age: 33,
        image: 'https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=400',
        stats: { matches: 91, runs: 2468, wickets: 0, average: 33.47, strikeRate: 148.97 }
    },
    {
        name: 'Suryakumar Yadav',
        country: 'India',
        role: 'BATSMAN',
        basePrice: 1,
        age: 33,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 51, runs: 1474, wickets: 0, average: 30.91, strikeRate: 147.30 }
    },
    {
        name: 'Mitchell Starc',
        country: 'Australia',
        role: 'BOWLER',
        basePrice: 1.5,
        age: 33,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32365cecc?w=400',
        stats: { matches: 55, runs: 190, wickets: 74, average: 25.81, strikeRate: 19.6 }
    },
    {
        name: 'KL Rahul',
        country: 'India',
        role: 'WICKET-KEEPER',
        basePrice: 1,
        age: 31,
        image: 'https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=400',
        stats: { matches: 123, runs: 3889, wickets: 0, average: 33.73, strikeRate: 134.62 }
    },
    {
        name: 'Trent Boult',
        country: 'New Zealand',
        role: 'BOWLER',
        basePrice: 1,
        age: 34,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32365cecc?w=400',
        stats: { matches: 78, runs: 83, wickets: 96, average: 29.02, strikeRate: 22.7 }
    },
    {
        name: 'David Warner',
        country: 'Australia',
        role: 'BATSMAN',
        basePrice: 1,
        age: 37,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 176, runs: 6397, wickets: 0, average: 39.73, strikeRate: 140.13 }
    },
    {
        name: 'Andre Russell',
        country: 'West Indies',
        role: 'ALL-ROUNDER',
        basePrice: 1.5,
        age: 35,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 98, runs: 2036, wickets: 72, average: 28.80, strikeRate: 176.99 }
    },
    {
        name: 'Shubman Gill',
        country: 'India',
        role: 'BATSMAN',
        basePrice: 0.5,
        age: 24,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 45, runs: 1387, wickets: 0, average: 33.95, strikeRate: 135.92 }
    },
    {
        name: 'Pat Cummins',
        country: 'Australia',
        role: 'BOWLER',
        basePrice: 1,
        age: 30,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32365cecc?w=400',
        stats: { matches: 69, runs: 420, wickets: 85, average: 29.92, strikeRate: 22.8 }
    },
    {
        name: 'Ravindra Jadeja',
        country: 'India',
        role: 'ALL-ROUNDER',
        basePrice: 1,
        age: 35,
        image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400',
        stats: { matches: 220, runs: 2598, wickets: 148, average: 26.95, strikeRate: 128.23 }
    },
    {
        name: 'Rishabh Pant',
        country: 'India',
        role: 'WICKET-KEEPER',
        basePrice: 0.5,
        age: 26,
        image: 'https://images.unsplash.com/photo-1546608235-3310a2494cdf?w=400',
        stats: { matches: 84, runs: 2838, wickets: 0, average: 34.61, strikeRate: 147.69 }
    },
    {
        name: 'Kagiso Rabada',
        country: 'South Africa',
        role: 'BOWLER',
        basePrice: 1,
        age: 28,
        image: 'https://images.unsplash.com/photo-1540747913346-19e32365cecc?w=400',
        stats: { matches: 64, runs: 154, wickets: 91, average: 26.23, strikeRate: 19.4 }
    },
];

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
