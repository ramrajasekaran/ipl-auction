import { Resend } from 'resend';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix for ES modules - get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root directory
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY || '');

// Check if API key is configured
if (!process.env.RESEND_API_KEY) {
    console.log('⚠️ RESEND_API_KEY not configured. Email sending will fail.');
    console.log('   Get your free API key at: https://resend.com');
} else {
    console.log('✅ Email service ready (Resend)');
}

// ============================================================
// CORE: Single email sending function used by ALL email types
// ============================================================
const sendEmail = async (toEmail, subject, htmlContent) => {
    const senderEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    console.log('📧 [EMAIL] Sending email:');
    console.log('   📤 From:', senderEmail);
    console.log('   📥 To:', toEmail);
    console.log('   📝 Subject:', subject);

    const { data, error } = await resend.emails.send({
        from: `IPL Arena <${senderEmail}>`,
        to: [toEmail],
        subject: subject,
        html: htmlContent,
    });

    if (error) {
        console.error('❌ Resend API error:', JSON.stringify(error));
        throw new Error(error.message || 'Failed to send email');
    }

    console.log('✅ Email sent successfully via Resend');
    console.log('   📨 Email ID:', data?.id || 'N/A');
    return { success: true, messageId: data?.id || 'sent' };
};

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
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
        const result = await sendEmail(
            email,
            `Your IPL Arena Verification Code: ${code}`,
            htmlContent
        );
        console.log('🔑 [DEBUG] OTP Verification Code:', code);
        return result;
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message || error);
        throw error;
    }
};

// Send Verification Email (link-based)
export const sendVerificationEmail = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email/${token}`;

    console.log('🔗 [DEBUG] FRONTEND_URL:', frontendUrl);
    console.log('🔑 [DEBUG] Verification URL:', verificationUrl);

    if (frontendUrl === 'http://localhost:5173') {
        console.warn('⚠️ WARNING: FRONTEND_URL is not set! Verification link will point to localhost.');
    }

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
        const result = await sendEmail(
            email,
            'Verify your IPL Arena Account',
            htmlContent
        );
        return result;
    } catch (error) {
        console.error('❌ Failed to send verification email:', error.message || error);
        throw error;
    }
};

export default resend;
