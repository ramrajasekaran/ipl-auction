import User from '../models/User.js';
import Team from '../models/Team.js';
import crypto from 'crypto';
import { sendVerificationEmail } from '../utils/emailService.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user (auto-verified since no custom email domain available)
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'USER',
            isVerified: true
        });

        console.log(`✅ User registered and auto-verified: ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful! You can now log in.'
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message || 'Server error during registration'
        });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate email and password
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Check for user (include password for comparison)
        const user = await User.findOne({ email }).select('+password');



        if (!user) {

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // AUTO-PROMPT ADMIN (For hosted environment setup)
        if (email.toLowerCase() === 'sriramsriram16145@gmail.com' && user.role !== 'ADMIN') {

            user.role = 'ADMIN';
            await user.save();
        }



        // Check if password matches
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Auto-verify any unverified users (legacy accounts)
        if (!user.isVerified) {
            user.isVerified = true;
            await user.save();
            console.log(`✅ Auto-verified legacy user: ${user.email}`);
        }



        // Generate token
        const token = user.getSignedJwtToken();

        // Create session
        req.session.userId = user._id.toString();
        req.session.user = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role
        };



        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamName: user.teamName,
                teamId: user.teamId
            }
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('teamId');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // AUTO-PROMOTE ADMIN (For hosted environment setup/consistency)
        if (user.email.toLowerCase() === 'sriramsriram16145@gmail.com' && user.role !== 'ADMIN') {

            user.role = 'ADMIN';
            await user.save();
        }

        res.status(200).json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                teamName: user.teamName,
                teamId: user.teamId
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Send password reset OTP
// @route   POST /api/auth/send-reset-otp
// @access  Public
export const sendPasswordResetOTP = async (req, res) => {
    try {
        const { email, type, roomId, teamName } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const Auction = (await import('../models/Auction.js')).default;
        let isEmailValid = false;

        // Validate email existence based on type
        if (type === 'MANAGER' && roomId) {
            const auction = await Auction.findOne({ roomId: roomId.toUpperCase() }).populate('auctioneer');
            if (auction && auction.auctioneer && auction.auctioneer.email.toLowerCase() === email.toLowerCase()) {
                isEmailValid = true;
            }
        } else if (type === 'TEAM' && roomId && teamName) {
            const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });
            if (auction) {
                const team = await Team.findOne({
                    auctionId: auction._id,
                    name: { $regex: new RegExp(`^${teamName}$`, 'i') }
                }).populate('owner');
                if (team && team.owner && team.owner.email.toLowerCase() === email.toLowerCase()) {
                    isEmailValid = true;
                }
            }
        } else {
            // Default USER type
            const user = await User.findOne({ email: email.toLowerCase() });
            if (user) {
                isEmailValid = true;
            }
        }

        if (!isEmailValid) {
            return res.status(400).json({
                success: false,
                message: 'Email Not Found'
            });
        }

        // Import OTP model and email service dynamically
        const OTP = (await import('../models/OTP.js')).default;
        const { generateOTP, sendOTPEmail } = await import('../utils/emailService.js');

        // Generate 6-digit OTP
        const code = generateOTP();

        // Delete any existing OTPs for this email and type
        await OTP.deleteMany({ email: email.toLowerCase(), type: type || 'USER' });

        // Create new OTP record
        const otpRecord = await OTP.create({
            email: email.toLowerCase(),
            code,
            type: type || 'USER',
            roomId: roomId || undefined,
            teamName: teamName || undefined,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        });

        // Send OTP via email
        try {
            await sendOTPEmail(email, code, 'password reset');
            res.status(200).json({
                success: true,
                message: 'OTP sent to your email. It will expire in 10 minutes.'
            });
        } catch (emailError) {
            // Clean up OTP if email fails
            await OTP.deleteMany({ email: email.toLowerCase(), type: type || 'USER' });
            res.status(500).json({
                success: false,
                message: 'Failed to send OTP email. Please try again later.'
            });
        }

    } catch (error) {

        res.status(500).json({
            success: false,
            message: error.message || 'Failed to send OTP. Please check email configuration.'
        });
    }
};

// @desc    Verify OTP only (without reset)
// @route   POST /api/auth/verify-otp
// @access  Public
export const verifyOTPOnly = async (req, res) => {
    try {
        const { email, code, type } = req.body;

        if (!email || !code) {
            return res.status(400).json({
                success: false,
                message: 'Email and code are required'
            });
        }

        const OTP = (await import('../models/OTP.js')).default;

        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            code,
            type: type || 'USER',
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code. Please try again or request a new one.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Server error during OTP verification'
        });
    }
};

// @desc    Verify OTP and reset password
// @route   POST /api/auth/verify-reset-otp
// @access  Public
export const verifyOTPAndResetPassword = async (req, res) => {
    try {
        const { email, code, newPassword, type, roomId, teamName } = req.body;

        if (!email || !code || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP code, and new password are required'
            });
        }

        // Import OTP model
        const OTP = (await import('../models/OTP.js')).default;
        const Auction = (await import('../models/Auction.js')).default;

        // Find valid OTP
        const otpRecord = await OTP.findOne({
            email: email.toLowerCase(),
            code,
            type: type || 'USER',
            isUsed: false,
            expiresAt: { $gt: new Date() }
        });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP code. Please request a new one.'
            });
        }

        // Reset password based on type
        if (type === 'MANAGER' && roomId) {
            // Reset auction/manager password
            const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });
            if (!auction) {
                return res.status(404).json({ success: false, message: 'Room not found' });
            }
            auction.password = newPassword;
            await auction.save();
        } else if (type === 'TEAM' && roomId && teamName) {
            // Reset team password
            const auction = await Auction.findOne({ roomId: roomId.toUpperCase() });
            if (!auction) {
                return res.status(404).json({ success: false, message: 'Room not found' });
            }
            const team = await Team.findOne({
                auctionId: auction._id,
                name: { $regex: new RegExp(`^${teamName}$`, 'i') }
            });
            if (!team) {
                return res.status(404).json({ success: false, message: 'Team not found' });
            }
            team.password = newPassword;
            await team.save();
        } else {
            // Reset user account password
            const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            user.password = newPassword;
            await user.save();
        }

        // Mark OTP as used
        otpRecord.isUsed = true;
        await otpRecord.save();

        res.status(200).json({
            success: true,
            message: 'Password reset successfully!'
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Server error during password reset'
        });
    }
};

// @desc    Logout user and destroy session
// @route   POST /api/auth/logout
// @access  Private
export const logout = async (req, res) => {
    try {
        // Destroy session
        req.session.destroy((err) => {
            if (err) {

                return res.status(500).json({
                    success: false,
                    message: 'Error logging out'
                });
            }

            // Clear session cookie
            res.clearCookie(process.env.SESSION_NAME || 'ipl_auction_sid');

            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        });
    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};

// @desc    Verify email
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
    try {
        const user = await User.findOne({
            verificationToken: req.params.token,
            verificationExpire: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired verification token'
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationExpire = undefined;
        await user.save();

        res.status(200).json({
            success: true,
            message: 'Email verified successfully! You can now login.'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error during email verification'
        });
    }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide an email'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.isVerified) {
            return res.status(400).json({
                success: false,
                message: 'Email is already verified'
            });
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(20).toString('hex');
        const verificationExpire = Date.now() + 24 * 60 * 60 * 1000;

        user.verificationToken = verificationToken;
        user.verificationExpire = verificationExpire;
        await user.save();

        // Send email
        try {
            await sendVerificationEmail(user.email, verificationToken);
            console.log(`✅ Verification email resent to ${user.email}`);
            res.status(200).json({
                success: true,
                message: 'Verification email resent! Please check your inbox.'
            });
        } catch (emailError) {
            console.error('❌ Resend verification email error:', emailError.message || emailError);
            if (emailError.body) console.error('❌ MailerSend response body:', JSON.stringify(emailError.body));
            if (emailError.statusCode) console.error('❌ MailerSend status code:', emailError.statusCode);
            res.status(500).json({
                success: false,
                message: `Failed to send verification email: ${emailError.message || 'Unknown error'}. Please try again later.`
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error while resending verification'
        });
    }
};
