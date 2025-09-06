const nodemailer = require('nodemailer');

const from = process.env.GMAIL_USER;

// Gmail SMTP transporter using App Password
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

async function sendMail({ to, subject, html }) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    console.warn('Gmail credentials not configured; skipping email send');
    return { skipped: true };
  }
  return transporter.sendMail({ from, to, subject, html });
}

function verificationEmailTemplate(verifyUrl) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#222">
      <h2>Verify your TradeLink account</h2>
      <p>Click the button below to verify your email:</p>
      <p><a href="${verifyUrl}" style="background:#f89216;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Verify Email</a></p>
      <p>If the button doesn’t work, copy and paste this link:</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>If you didn’t create an account, you can ignore this email.</p>
    </div>
  `;
}

function resetPasswordEmailTemplate(resetUrl) {
  return `
    <div style="font-family: Arial, sans-serif; line-height:1.5; color:#222">
      <h2>Reset your TradeLink password</h2>
      <p>You requested a password reset. Click the button below to set a new password:</p>
      <p><a href="${resetUrl}" style="background:#30ac57;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none">Reset Password</a></p>
      <p>If the button doesn’t work, copy and paste this link:</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you didn’t request this, you can ignore this email.</p>
    </div>
  `;
}

async function sendVerificationEmail(to, token) {
  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '') || 'http://localhost:5173';
  // Frontend route handles calling backend verify endpoint
  const verifyUrl = `${clientUrl}/verify-email/${token}`;
  return sendMail({ to, subject: 'Verify your TradeLink email', html: verificationEmailTemplate(verifyUrl) });
}

async function sendResetPasswordEmail(to, token) {
  const clientUrl = process.env.CLIENT_URL?.replace(/\/$/, '') || 'http://localhost:5173';
  const resetUrl = `${clientUrl}/reset-password?token=${encodeURIComponent(token)}`;
  return sendMail({ to, subject: 'Reset your TradeLink password', html: resetPasswordEmailTemplate(resetUrl) });
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };

