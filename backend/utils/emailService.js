import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create transporter with Gmail SMTP settings
// Create transporter with Gmail SMTP settings
const smtpPort = parseInt(process.env.SMTP_PORT) || 587;
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        rejectUnauthorized: false // Bypass SSL check for hosted environments (Render/Vercel)
    },
    debug: true, // Show debug output for troubleshooting
    logger: true, // Log to console
    // Timeouts (increased for cloud environments like Render)
    connectionTimeout: 30000,
    greetingTimeout: 15000,
    socketTimeout: 30000
});

// Verify transporter configuration
transporter.verify((error, success) => {
    if (error) {
        console.log('❌ Email service not configured:', error.message);
        console.log('   Add SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS to .env file');
    } else {
        console.log('✅ Email service ready');
    }
});

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
export const sendOTPEmail = async (email, code, type = 'password reset') => {
    const mailOptions = {
        from: `"IPL Auction" <${process.env.SMTP_USER}>`,
        to: email,
        subject: `🔐 Your IPL Auction Verification Code: ${code}`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0f1c; color: #fff; margin: 0; padding: 20px; }
                    .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1f3c 0%, #0d1117 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
                    .logo { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 30px; }
                    .logo span { color: #fbbf24; }
                    .code-box { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); border-radius: 12px; padding: 25px; text-align: center; margin: 30px 0; }
                    .code { font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #fff; font-family: 'Courier New', monospace; }
                    .message { color: #94a3b8; line-height: 1.6; text-align: center; }
                    .warning { color: #f87171; font-size: 12px; text-align: center; margin-top: 20px; padding: 10px; background: rgba(248,113,113,0.1); border-radius: 8px; }
                    .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 30px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="logo">IPL <span>Auction</span></div>
                    
                    <p class="message">
                        You requested a ${type} verification code.<br>
                        Use the code below to continue:
                    </p>
                    
                    <div class="code-box">
                        <div class="code">${code}</div>
                    </div>
                    
                    <p class="message">
                        This code will expire in <strong>10 minutes</strong>.
                    </p>
                    
                    <div class="warning">
                        ⚠️ If you didn't request this code, please ignore this email.
                    </div>
                    
                    <div class="footer">
                        © 2026 IPL Auction Platform
                    </div>
                </div>
            </body>
            </html>
        `
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('📧 OTP email sent:', info.messageId);
        console.log('🔑 [DEBUG] OTP Verification Code:', code); // Added for troubleshooting
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message);
        throw error;
    }
};

export default transporter;
