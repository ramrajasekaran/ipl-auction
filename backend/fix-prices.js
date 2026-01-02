import mongoose from 'mongoose';

async function fixAllPlayers() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/ipl-auction');
        console.log('Connected to DB');

        const Player = mongoose.connection.collection('players');
        const players = await Player.find({}).toArray();
        console.log(`Found ${players.length} players to check`);

        let updatedCount = 0;

        for (const p of players) {
            // Priority 1: Use 'Base Price' (raw string from Compass)
            // Priority 2: Use existing 'priceLabel'
            // Priority 3: Use 'basePrice' number
            let raw = p['Base Price'] || p.Price || p.price || p.priceLabel || p.basePrice || '20L';

            let price = 20;
            let label = '20 Lakhs';

            if (typeof raw === 'string') {
                const upper = raw.toUpperCase();
                const num = parseFloat(raw);
                if (upper.includes('C') || upper.includes('CR')) {
                    price = num * 100;
                    label = `${num.toFixed(2)} Cr`;
                } else if (upper.includes('L')) {
                    price = num;
                    label = `${num} Lakhs`;
                } else {
                    if (num < 15) {
                        price = num * 100;
                        label = `${num.toFixed(2)} Cr`;
                    } else {
                        price = num;
                        label = `${num} Lakhs`;
                    }
                }
            } else {
                const num = Number(raw) || 20;
                if (num < 15) {
                    price = num * 100;
                    label = `${num.toFixed(2)} Cr`;
                } else {
                    price = num;
                    label = `${num} Lakhs`;
                }
            }

            // Update if changed
            if (p.basePrice !== price || p.priceLabel !== label) {
                await Player.updateOne(
                    { _id: p._id },
                    { $set: { basePrice: price, priceLabel: label } }
                );
                updatedCount++;
            }
        }

        console.log(`Successfully updated ${updatedCount} players.`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

fixAllPlayers();
