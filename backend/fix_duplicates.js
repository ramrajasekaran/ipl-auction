import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Team from './models/Team.js';
import RoomPlayer from './models/RoomPlayer.js'; // Needed due to ref? Not really, but good practice maybe.

dotenv.config();

const uri = process.env.MONGODB_URI;

const fix = async () => {
    try {
        console.log('Connecting to DB...');
        await mongoose.connect(uri);
        console.log('Connected.');

        const teams = await Team.find({});
        console.log(`Found ${teams.length} teams.`);

        for (const team of teams) {
            let refund = 0;
            const uniquePlayers = [];
            const seenIds = new Set();
            let dups = 0;

            console.log(`Checking Team: ${team.name} (Players: ${team.players.length})`);

            for (const item of team.players) {
                const pid = item.player ? item.player.toString() : null;
                if (!pid) continue;

                if (seenIds.has(pid)) {
                    // Duplicate!
                    console.log(`   Object ID: ${item._id}`);
                    console.log(`   found duplicate player: ${pid} (${item.boughtPrice} Cr)`);
                    refund += item.boughtPrice;
                    dups++;
                } else {
                    seenIds.add(pid);
                    uniquePlayers.push(item);
                }
            }

            if (dups > 0) {
                console.log(`   -> Fixing ${team.name}: Removing ${dups} duplicates. Refunding ${refund} Cr.`);
                // console.log(`   -> Old Purse: ${team.currentPurse}. New Purse: ${team.currentPurse + refund}`);

                team.players = uniquePlayers;
                team.currentPurse += refund;

                // Mongoose might validation error if duplicate logic was weird? No.
                await team.save();
                console.log('   -> Saved ✅');
            } else {
                console.log('   -> No duplicates found.');
            }
        }
        console.log('Done.');
        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
};

fix();
