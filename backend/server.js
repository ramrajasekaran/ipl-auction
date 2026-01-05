import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import gameRoutes from './routes/gameRoutes.js'; // Added
import auctionRoutes from './routes/auctionRoutes.js';
import playerRoutes from './routes/playerRoutes.js';
import tradeRoutes from './routes/tradeRoutes.js';
import miniAuctionRoutes from './routes/miniAuctionRoutes.js'; // Mini Auction Routes
import setupSocketHandlers from './socket/socketHandlers.js';

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Attach io to app for use in routes/controllers
app.set('io', io);

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Management
app.use(session({
    secret: process.env.SESSION_SECRET || 'ipl-auction-secret-key',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        touchAfter: 24 * 3600, // Lazy session update (24 hours)
        crypto: {
            secret: process.env.SESSION_SECRET || 'ipl-auction-secret-key'
        }
    }),
    cookie: {
        maxAge: parseInt(process.env.SESSION_MAX_AGE) || 86400000, // 24 hours
        httpOnly: true, // Prevent JavaScript access
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax', // CSRF protection
        domain: process.env.COOKIE_DOMAIN || undefined
    },
    name: process.env.SESSION_NAME || 'ipl_auction_sid'
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // limit each IP to 1000 requests per windowMs
});

app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes); // Keep for legacy/future full auth
app.use('/api/games', gameRoutes); // New Game Logic
app.use('/api/auction', auctionRoutes);
app.use('/api/players', playerRoutes);
app.use('/api/trades', tradeRoutes);
app.use('/api/mini-auction', miniAuctionRoutes); // Mini Auction Routes

// Health check route
app.get('/api/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'IPL Auction API is running',
        timestamp: new Date()
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: err.message || 'Server Error'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// Setup Socket.io handlers
setupSocketHandlers(io);

// Start server
const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
    console.log(`\n🚀 IPL Auction Server running on port ${PORT}`);
    console.log(`📡 Socket.io server listening`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`❌ Error: ${err.message}`);
    // Close server & exit process
    httpServer.close(() => process.exit(1));
});

export default app;
