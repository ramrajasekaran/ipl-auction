const { MongoClient } = require('mongodb');

async function checkPlayers() {
    const uri = 'mongodb://localhost:27017';
    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db('ipl-auction');
        const players = db.collection('players');

        // Get total count
        const total = await players.countDocuments();
        console.log(`Total players in DB: ${total}`);

        // Get sample player
        const sample = await players.findOne({});
        console.log('\nSample player structure:');
        console.log(JSON.stringify(sample, null, 2));

        // Check how many have auctionId
        const withAuction = await players.countDocuments({ auctionId: { $exists: true } });
        const withoutAuction = await players.countDocuments({ auctionId: { $exists: false } });

        console.log(`\nPlayers with auctionId: ${withAuction}`);
        console.log(`Players without auctionId (global): ${withoutAuction}`);

        // Check for null auctionId
        const nullAuction = await players.countDocuments({ auctionId: null });
        console.log(`Players with auctionId=null: ${nullAuction}`);

    } finally {
        await client.close();
    }
}

checkPlayers().catch(console.error);
