import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Player from './models/Player.js';
import connectDB from './config/db.js';

dotenv.config();

const players = [
    // BATSMEN
    { name: 'Virat Kohli', country: 'India', role: 'BATSMAN', basePrice: 200, age: 35, stats: { matches: 237, runs: 7263, average: 37.2, strikeRate: 130.0 }, image: 'https://cdn.britannica.com/48/252748-050-C514EFDB/Virat-Kohli-India-cricket-2023.jpg' },
    { name: 'Rohit Sharma', country: 'India', role: 'BATSMAN', basePrice: 200, age: 36, stats: { matches: 243, runs: 6211, average: 29.6, strikeRate: 130.3 }, image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Rohit_Sharma_in_2023_World_Cup.jpg/330px-Rohit_Sharma_in_2023_World_Cup.jpg' },
    { name: 'Shubman Gill', country: 'India', role: 'BATSMAN', basePrice: 200, age: 24, stats: { matches: 91, runs: 2790, average: 37.7, strikeRate: 134.1 } },
    { name: 'David Warner', country: 'Australia', role: 'BATSMAN', basePrice: 200, age: 37, stats: { matches: 176, runs: 6397, average: 41.5, strikeRate: 139.9 } },
    { name: 'Suryakumar Yadav', country: 'India', role: 'BATSMAN', basePrice: 200, age: 33, stats: { matches: 60, runs: 2141, average: 45.6, strikeRate: 171.6 } },
    { name: 'Faf du Plessis', country: 'South Africa', role: 'BATSMAN', basePrice: 200, age: 39, stats: { matches: 130, runs: 4133, average: 36.9, strikeRate: 134.1 } },

    // WICKET KEEPERS
    { name: 'MS Dhoni', country: 'India', role: 'WICKET-KEEPER', basePrice: 200, age: 42, stats: { matches: 250, runs: 5082, average: 38.8, strikeRate: 135.9 } },
    { name: 'KL Rahul', country: 'India', role: 'WICKET-KEEPER', basePrice: 200, age: 31, stats: { matches: 118, runs: 4163, average: 46.8, strikeRate: 134.4 } },
    { name: 'Sanju Samson', country: 'India', role: 'WICKET-KEEPER', basePrice: 200, age: 29, stats: { matches: 152, runs: 3888, average: 29.2, strikeRate: 137.2 } },
    { name: 'Jos Buttler', country: 'England', role: 'WICKET-KEEPER', basePrice: 200, age: 33, stats: { matches: 96, runs: 3223, average: 37.9, strikeRate: 148.3 } },

    // ALL ROUNDERS
    { name: 'Ravindra Jadeja', country: 'India', role: 'ALL-ROUNDER', basePrice: 200, age: 35, stats: { matches: 226, runs: 2692, wickets: 152, strikeRate: 128.6 } },
    { name: 'Hardik Pandya', country: 'India', role: 'ALL-ROUNDER', basePrice: 200, age: 30, stats: { matches: 123, runs: 2309, wickets: 53, strikeRate: 145.9 } },
    { name: 'Glenn Maxwell', country: 'Australia', role: 'ALL-ROUNDER', basePrice: 200, age: 35, stats: { matches: 124, runs: 2719, wickets: 31, strikeRate: 157.6 } },
    { name: 'Andre Russell', country: 'West Indies', role: 'ALL-ROUNDER', basePrice: 200, age: 35, stats: { matches: 112, runs: 2262, wickets: 96, strikeRate: 174.0 } },
    { name: 'Rashid Khan', country: 'Afghanistan', role: 'ALL-ROUNDER', basePrice: 200, age: 25, stats: { matches: 109, runs: 443, wickets: 139, strikeRate: 166.5 } },

    // BOWLERS
    { name: 'Jasprit Bumrah', country: 'India', role: 'BOWLER', basePrice: 200, age: 30, stats: { matches: 120, wickets: 145, average: 23.3, strikeRate: 19.1 } },
    { name: 'Yuzvendra Chahal', country: 'India', role: 'BOWLER', basePrice: 200, age: 33, stats: { matches: 145, wickets: 187, average: 21.6, strikeRate: 17.0 } },
    { name: 'Mohammed Shami', country: 'India', role: 'BOWLER', basePrice: 200, age: 33, stats: { matches: 105, wickets: 110, average: 26.8, strikeRate: 19.2 } },
    { name: 'Trent Boult', country: 'New Zealand', role: 'BOWLER', basePrice: 200, age: 34, stats: { matches: 88, wickets: 105, average: 26.54, strikeRate: 19.8 } },
    { name: 'Kagiso Rabada', country: 'South Africa', role: 'BOWLER', basePrice: 200, age: 28, stats: { matches: 69, wickets: 106, average: 20.7, strikeRate: 14.8 } }
];

const seedData = async () => {
    try {
        await connectDB();

        // Check if templates exist
        const count = await Player.countDocuments({ auctionId: null });
        if (count > 0) {
            console.log(`✅ Default Players already exist (${count} players). Skipping seed.`);
            process.exit();
        }

        console.log('🌱 Seeding Default Players...');
        await Player.insertMany(players);
        console.log('✅ Default Players seeded successfully!');
        process.exit();
    } catch (error) {
        console.error('❌ Seeding Error:', error);
        process.exit(1);
    }
};

seedData();
