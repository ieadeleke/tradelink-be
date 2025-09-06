const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Seller = require('../models/Seller');
const { sendVerificationEmail, sendResetPasswordEmail } = require('../utils/mailer');

function signToken(user) {
  return jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });
}

// POST /api/v1/auth/register
async function register(req, res) {
  try {
    const { name, email, password, phone, storeName, businessLevel, category, address, description } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const user = await User.create({ name, email, passwordHash, phone, address, emailVerified: false, verifyToken });

    // If registering as seller via SellWithUs
    if (storeName || category || businessLevel) {
      const seller = await Seller.create({
        userId: user._id,
        storeName: storeName || name,
        email,
        phone,
        address,
        description,
        businessCategory: category,
        businessLevel,
      });
      user.role = 'seller';
      user.sellerId = seller._id;
      await user.save();
    }

    try {
      await sendVerificationEmail(email, verifyToken);
    } catch (mailErr) {
      console.warn('Verification email failed to send:', mailErr?.message);
    }
    return res.status(201).json({ message: 'Registered. Please check your email to verify your account.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Registration failed' });
  }
}

// GET /api/v1/auth/verify-email/:token
async function verifyEmail(req, res) {
  try {
    const { token } = req.params;
    const user = await User.findOne({ verifyToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.emailVerified = true;
    user.verifyToken = undefined;
    await user.save();
    return res.json({ message: 'Email verified' });
  } catch (e) {
    return res.status(500).json({ message: 'Verification failed' });
  }
}

// POST /api/v1/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });
    const token = signToken(user);
    const role = user.role || (user.sellerId ? 'seller' : 'buyer');
    const resBody = {
      token,
      role,
      userId: String(user._id),
      sellerId: user.sellerId ? String(user.sellerId) : null,
      name: user.name,
    };
    return res.json(resBody);
  } catch (e) {
    return res.status(500).json({ message: 'Login failed' });
  }
}

// POST /api/v1/auth/forgot-password
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If account exists, we sent a link' });
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30m
    await user.save();
    try {
      await sendResetPasswordEmail(email, resetToken);
    } catch (mailErr) {
      console.warn('Reset email failed to send:', mailErr?.message);
    }
    return res.json({ message: 'If this email exists, a reset link has been sent.' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to process request' });
  }
}

// POST /api/v1/reset-password (token + new password)
async function resetPasswordWithToken(req, res) {
  try {
    const { token, password } = req.body;
    const user = await User.findOne({ resetToken: token, resetTokenExpiresAt: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });
    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;
    await user.save();
    return res.json({ message: 'Password reset successful' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to reset password' });
  }
}

// PUT /api/v1/auth/reset-password (current + new, auth required)
async function resetPasswordAuthenticated(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = req.user;
    const ok = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Current password incorrect' });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    return res.json({ message: 'Password changed' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to change password' });
  }
}

// POST /api/v1/auth/resend-verification
async function resendVerification(req, res) {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.json({ message: 'If account exists, a link was sent' });
    const token = crypto.randomBytes(32).toString('hex');
    user.verifyToken = token;
    await user.save();
    try {
      await sendVerificationEmail(email, token);
    } catch (mailErr) {
      console.warn('Resend verification email failed:', mailErr?.message);
    }
    return res.json({ message: 'Verification link sent if account exists' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to resend verification' });
  }
}

// POST /api/v1/auth/logout
async function logout(req, res) {
  // Stateless JWT: nothing to do server-side
  return res.json({ message: 'Logged out' });
}

module.exports = {
  register,
  verifyEmail,
  login,
  forgotPassword,
  resetPasswordWithToken,
  resetPasswordAuthenticated,
  resendVerification,
  logout,
};
