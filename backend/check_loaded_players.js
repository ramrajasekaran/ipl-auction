import mongoose from 'mongoose';

const uri = 'mongodb://localhost:27017/ipl-auction';

async function checkAndShowPlayers() {
    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const playersCollection = db.collection('players');

        // Check players in the current auction
        const auctionPlayers = await playersCollection.find({
            auctionId: new mongoose.Types.ObjectId('695675ca736abb26f860aafb')
        }).limit(3).toArray();

        console.log('=== Players Currently in Auction ===');
        auctionPlayers.forEach((p, i) => {
            console.log(`\nPlayer ${i + 1}:`);
            console.log('  _id:', p._id);
            console.log('  name:', p.name);
            console.log('  country:', p.country);
            console.log('  role:', p.role);
            console.log('  basePrice:', p.basePrice);
        });

        // Check global players
        const globalPlayers = await playersCollection.find({
            $or: [
                { auctionId: { $exists: false } },
                { auctionId: null }
            ]
        }).limit(3).toArray();

        console.log('\n\n=== Global Players (Template) ===');
        globalPlayers.forEach((p, i) => {
            console.log(`\nPlayer ${i + 1}:`);
            console.log('  Fields:', Object.keys(p));
            console.log('  _id:', p._id);
            console.log('  "Player Name":', p['Player Name']);
            console.log('  name:', p.name);
            console.log('  "Country":', p.Country);
            console.log('  "Position":', p.Position);
            console.log('  "Base Price":', p['Base Price']);
        });

        await mongoose.disconnect();
        console.log('\n✅ Done');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAndShowPlayers();
