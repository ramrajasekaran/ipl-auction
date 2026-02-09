import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const promoteToAdmin = async (email) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOneAndUpdate(
            { email: email.toLowerCase() },
            { role: 'ADMIN' },
            { new: true }
        );

        if (!user) {
            console.error(`User with email ${email} not found`);
        } else {
            console.log(`Successfully promoted ${user.name} (${user.email}) to ADMIN`);
        }

        await mongoose.connection.close();
    } catch (error) {
        console.error('Error promoting user:', error);
        process.exit(1);
    }
};

const email = process.argv[2];
if (!email) {
    console.error('Please provide an email address as an argument');
    process.exit(1);
}

promoteToAdmin(email);
