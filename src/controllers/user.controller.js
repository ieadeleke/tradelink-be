const bcrypt = require('bcryptjs');
const User = require('../models/User');

// GET /api/v1/users/get/profile
async function getProfile(req, res) {
  const u = req.user;
  const data = {
    id: String(u._id),
    name: u.name,
    fullName: u.name, // for components using fullName
    email: u.email,
    phone: u.phone || '',
    address: u.address || '',
    logo: u.avatarUrl || '',
    avatarUrl: u.avatarUrl || '',
  };
  return res.json({ data });
}

// PUT /api/v1/users/profile/update
async function updateProfile(req, res) {
  try {
    const { name, fullName, email, phone, address, avatarUrl } = req.body;
    const u = req.user;
    if (name || fullName) u.name = name || fullName;
    if (email) u.email = email; // optional
    if (phone !== undefined) u.phone = phone;
    if (address !== undefined) u.address = address;
    if (avatarUrl !== undefined) u.avatarUrl = avatarUrl;
    await u.save();
    return res.json({ message: 'Profile updated', data: u });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to update profile' });
  }
}

// PUT /api/v1/users/change-password
async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    const u = req.user;
    const ok = await bcrypt.compare(oldPassword, u.passwordHash);
    if (!ok) return res.status(400).json({ message: 'Old password incorrect' });
    u.passwordHash = await bcrypt.hash(newPassword, 10);
    await u.save();
    return res.json({ message: 'Password changed' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to change password' });
  }
}

// DELETE /api/v1/users/delete/profile
async function deleteProfile(req, res) {
  try {
    const u = req.user;
    await User.deleteOne({ _id: u._id });
    return res.json({ message: 'Account deleted' });
  } catch (e) {
    return res.status(500).json({ message: 'Failed to delete account' });
  }
}

module.exports = { getProfile, updateProfile, changePassword, deleteProfile };

