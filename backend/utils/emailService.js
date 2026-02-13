import { MailerSend, EmailParams, Sender, Recipient } from 'mailersend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules - get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize MailerSend client
const mailerSend = new MailerSend({
    apiKey: process.env.MAILERSEND_API_KEY || '',
});

// Check if API key is configured
if (!process.env.MAILERSEND_API_KEY) {
    console.log('⚠️ MAILERSEND_API_KEY not configured. Email sending will fail.');
    console.log('   Get your free API key at: https://mailersend.com');
} else {
    console.log('✅ Email service ready (MailerSend)');
}

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email via MailerSend
export const sendOTPEmail = async (email, code, type = 'password reset') => {
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0f1c; color: #fff; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1f3c 0%, #0d1117 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
                .logo { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 30px; color: #fff; }
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
                <div class="logo">IPL <span>Arena</span></div>
                
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
                    If you didn't request this code, please ignore this email.
                </div>
                
                <div class="footer">
                    IPL Arena 2026
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        // Use your MailerSend trial domain or verified domain
        const sentFrom = new Sender(
            process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-3vz9dle1eqdgkj50.mlsender.net',
            'IPL Arena'
        );

        const recipients = [new Recipient(email)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject(`Your IPL Arena Verification Code: ${code}`)
            .setHtml(htmlContent);

        const response = await mailerSend.email.send(emailParams);

        console.log('📧 OTP email sent via MailerSend');
        console.log('🔑 [DEBUG] OTP Verification Code:', code);
        return { success: true, messageId: response.headers?.['x-message-id'] || 'sent' };
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message || error);
        throw error;
    }
};

// Send Verification Email via MailerSend
export const sendVerificationEmail = async (email, token) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email/${token}`;

    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Segoe UI', Arial, sans-serif; background: #0a0f1c; color: #fff; margin: 0; padding: 20px; }
                .container { max-width: 500px; margin: 0 auto; background: linear-gradient(135deg, #1a1f3c 0%, #0d1117 100%); border-radius: 16px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
                .logo { text-align: center; font-size: 28px; font-weight: bold; margin-bottom: 30px; color: #fff; }
                .logo span { color: #fbbf24; }
                .button { 
                    display: inline-block; 
                    background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 12px; 
                    font-weight: bold; 
                    margin: 30px 0;
                    text-align: center;
                }
                .message { color: #94a3b8; line-height: 1.6; text-align: center; }
                .footer { text-align: center; color: #475569; font-size: 12px; margin-top: 30px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="logo">IPL <span>Arena</span></div>
                
                <p class="message">
                    Welcome to IPL Arena! Please verify your email address to complete your registration.
                </p>
                
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </div>
                
                <p class="message">
                    If the button doesn't work, you can also copy and paste this link into your browser:<br>
                    <span style="word-break: break-all; font-size: 12px; color: #6366f1;">${verificationUrl}</span>
                </p>
                
                <div class="footer">
                    IPL Arena 2026
                </div>
            </div>
        </body>
        </html>
    `;

    try {
        const sentFrom = new Sender(
            process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-3vz9dle1eqdgkj50.mlsender.net',
            'IPL Arena'
        );

        const recipients = [new Recipient(email)];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setSubject(`Verify your IPL Arena Account`)
            .setHtml(htmlContent);

        const response = await mailerSend.email.send(emailParams);

        console.log('📧 Verification email sent via MailerSend');
        return { success: true };
    } catch (error) {
        console.error('❌ Failed to send verification email:', error.message || error);
        throw error;
    }
};

export default mailerSend;
