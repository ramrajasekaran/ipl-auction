import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'sriramsriram16145@gmail.com' });
        if (user) {
            console.log('USER_FOUND:', JSON.stringify({
                email: user.email,
                role: user.role,
                id: user._id
            }, null, 2));
        } else {
            console.log('USER_NOT_FOUND');
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

checkUser();
