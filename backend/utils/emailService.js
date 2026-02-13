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
} else {
    console.log('✅ Email service ready (MailerSend)');
}

// ============================================================
// CORE: Single email sending function used by ALL email types
// ============================================================
const sendMailerSendEmail = async (toEmail, subject, htmlContent) => {
    const senderEmail = process.env.MAILERSEND_FROM_EMAIL || 'noreply@trial-3vz9dle1eqdgkj50.mlsender.net';

    console.log('📧 [EMAIL] Sending email:');
    console.log('   📤 From:', senderEmail);
    console.log('   📥 To:', toEmail);
    console.log('   📝 Subject:', subject);
    console.log('   🔐 API Key configured:', !!process.env.MAILERSEND_API_KEY);

    const sentFrom = new Sender(senderEmail, 'IPL Arena');
    const recipients = [new Recipient(toEmail)];

    const emailParams = new EmailParams()
        .setFrom(sentFrom)
        .setTo(recipients)
        .setSubject(subject)
        .setHtml(htmlContent);

    const response = await mailerSend.email.send(emailParams);

    console.log('✅ Email sent successfully via MailerSend');
    console.log('   📨 Message ID:', response?.headers?.['x-message-id'] || 'N/A');
    return { success: true, messageId: response?.headers?.['x-message-id'] || 'sent' };
};

// Generate 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP Email
export const sendOTPEmail = async (email, code, type = 'password reset') => {
    // Split OTP into individual digits for the digit-box design
    const digits = code.toString().split('');
    const digitBoxes = digits.map(d =>
        `<td style="padding: 0 4px;">
            <div style="width: 48px; height: 58px; background: #1e293b; border: 2px solid #334155; border-radius: 10px; font-size: 28px; font-weight: 700; color: #ffffff; font-family: 'Courier New', Courier, monospace; line-height: 58px; text-align: center;">
                ${d}
            </div>
        </td>`
    ).join('');

    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Your IPL Arena Verification Code</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
            <!-- Outer wrapper -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
                <tr>
                    <td align="center">
                        <!-- Main card -->
                        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width: 520px; width: 100%; background-color: #1a2236; border-radius: 16px; overflow: hidden; border: 1px solid #2a3450;">

                            <!-- Gold accent bar -->
                            <tr>
                                <td style="height: 4px; background: linear-gradient(90deg, #f59e0b, #d97706, #f59e0b);"></td>
                            </tr>

                            <!-- Logo section -->
                            <tr>
                                <td style="padding: 36px 40px 20px 40px; text-align: center;">
                                    <h1 style="margin: 0; font-size: 30px; font-weight: 800; letter-spacing: 1px;">
                                        <span style="color: #ffffff;">IPL</span>
                                        <span style="color: #f59e0b;"> Arena</span>
                                    </h1>
                                </td>
                            </tr>

                            <!-- Divider -->
                            <tr>
                                <td style="padding: 0 40px;">
                                    <div style="height: 1px; background-color: #2a3450;"></div>
                                </td>
                            </tr>

                            <!-- Shield icon + Title -->
                            <tr>
                                <td style="padding: 30px 40px 8px 40px; text-align: center;">
                                    <div style="display: inline-block; width: 52px; height: 52px; background-color: rgba(245, 158, 11, 0.12); border-radius: 50%; line-height: 52px; font-size: 24px; margin-bottom: 12px;">
                                        🔐
                                    </div>
                                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #e2e8f0; letter-spacing: 0.3px;">
                                        Password Reset Code
                                    </h2>
                                </td>
                            </tr>

                            <!-- Description -->
                            <tr>
                                <td style="padding: 8px 40px 24px 40px; text-align: center;">
                                    <p style="margin: 0; font-size: 14px; color: #94a3b8; line-height: 1.6;">
                                        We received a request to reset your password.<br>
                                        Enter the code below to verify your identity.
                                    </p>
                                </td>
                            </tr>

                            <!-- OTP Code box -->
                            <tr>
                                <td style="padding: 0 40px 28px 40px;">
                                    <div style="background-color: #0f172a; border: 1px solid #2a3450; border-radius: 12px; padding: 28px 16px; text-align: center;">
                                        <p style="margin: 0 0 16px 0; font-size: 11px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 2px;">
                                            Verification Code
                                        </p>
                                        <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                                            <tr>
                                                ${digitBoxes}
                                            </tr>
                                        </table>
                                        <p style="margin: 16px 0 0 0; font-size: 12px; color: #64748b;">
                                            ⏱️ Expires in <strong style="color: #f59e0b;">10 minutes</strong>
                                        </p>
                                    </div>
                                </td>
                            </tr>

                            <!-- Security notice -->
                            <tr>
                                <td style="padding: 0 40px 28px 40px;">
                                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(239, 68, 68, 0.06); border: 1px solid rgba(239, 68, 68, 0.15); border-radius: 8px;">
                                        <tr>
                                            <td style="padding: 14px 16px; text-align: center;">
                                                <p style="margin: 0; font-size: 12px; color: #f87171; line-height: 1.5;">
                                                    ⚠️ If you did not request this code, please ignore this email.<br>
                                                    <span style="color: #94a3b8;">Never share this code with anyone.</span>
                                                </p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>

                            <!-- Bottom divider -->
                            <tr>
                                <td style="padding: 0 40px;">
                                    <div style="height: 1px; background-color: #2a3450;"></div>
                                </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                                <td style="padding: 20px 40px 28px 40px; text-align: center;">
                                    <p style="margin: 0 0 4px 0; font-size: 13px; color: #64748b;">
                                        IPL Arena — Online Cricket Auction Platform
                                    </p>
                                    <p style="margin: 0; font-size: 11px; color: #475569;">
                                        This is an automated message. Please do not reply.
                                    </p>
                                </td>
                            </tr>

                        </table>
                        <!-- End main card -->
                    </td>
                </tr>
            </table>
        </body>
        </html>
    `;

    try {
        const result = await sendMailerSendEmail(
            email,
            `IPL Arena — Your Password Reset Code: ${code}`,
            htmlContent
        );
        console.log('🔑 [DEBUG] OTP Verification Code:', code);
        return result;
    } catch (error) {
        console.error('❌ Failed to send OTP email:', error.message || error);
        throw error;
    }
};

// Send Verification Email (link-based) — kept for future use with custom domain
export const sendVerificationEmail = async (email, token) => {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const verificationUrl = `${frontendUrl}/verify-email/${token}`;

    console.log('🔗 [DEBUG] FRONTEND_URL:', frontendUrl);
    console.log('🔑 [DEBUG] Verification URL:', verificationUrl);

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
        const result = await sendMailerSendEmail(
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

export default mailerSend;
