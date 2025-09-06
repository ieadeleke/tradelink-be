const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['buyer', 'seller'], default: 'buyer' },
    phone: { type: String },
    address: { type: String },
    avatarUrl: { type: String },
    emailVerified: { type: Boolean, default: false },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    verifyToken: { type: String },
    resetToken: { type: String },
    resetTokenExpiresAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);

