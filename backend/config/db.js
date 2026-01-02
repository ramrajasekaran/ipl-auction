import mongoose from 'mongoose';

const connectDB = async () => {
    try {
        // Using local DB to bypass cloud IP issues
        const conn = await mongoose.connect("mongodb://127.0.0.1:27017/ipl-auction", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ MongoDB Connection Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
