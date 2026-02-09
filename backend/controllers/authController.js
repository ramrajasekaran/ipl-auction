import User from '../models/User.js';
import Team from '../models/Team.js';

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

        // Create user (no teamName required at registration - set when joining room)
        console.log('[REGISTER] Creating user with email:', email);
        const user = await User.create({
            name,
            email,
            password,
            role: role || 'TEAM_OWNER'
        });

        console.log('[REGISTER] User created successfully:', user._id);

        // Generate token
        const token = user.getSignedJwtToken();

        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Register error:', error);
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

        console.log('[LOGIN] User lookup for email:', email);
        console.log('[LOGIN] User found:', !!user);

        if (!user) {
            console.log('[LOGIN] User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // AUTO-PROMPT ADMIN (For hosted environment setup)
        if (email.toLowerCase() === 'sriramsriram16145@gmail.com' && user.role !== 'ADMIN') {
            console.log('[LOGIN] Auto-promoting user to ADMIN:', email);
            user.role = 'ADMIN';
            await user.save();
        }

        console.log('[LOGIN] User exists, checking password...');

        // Check if password matches
        const isMatch = await user.matchPassword(password);

        console.log('[LOGIN] Password match result:', isMatch);

        if (!isMatch) {
            console.log('[LOGIN] Password mismatch');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('[LOGIN] Authentication successful');

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
        console.error('Login error:', error);
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
            // Dev Mode Fallback: Return OTP in response when email fails
            console.log('⚠️ Email failed, using DEV MODE - OTP returned in response');
            console.log('🔑 OTP Code:', code);
            res.status(200).json({
                success: true,
                message: `DEV MODE: Email sending failed. Your OTP is: ${code}`,
                devMode: true,
                otp: code
            });
        }

    } catch (error) {
        console.error('Send OTP Error:', error);
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
        console.error('Verify OTP Only Error:', error);
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
        console.error('Verify OTP Error:', error);
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
                console.error('Session destruction error:', err);
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
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during logout'
        });
    }
};
