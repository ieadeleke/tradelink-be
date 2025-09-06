const multer = require('multer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Message = require('../models/Message');
const { uploadBufferToCloudinary } = require('../utils/cloudinary');

const upload = multer({ storage: multer.memoryStorage() });

// GET /api/v1/sellers/only/profile
async function onlyProfile(req, res) {
  const seller = await Seller.findOne({ userId: req.user._id });
  const data = { storeName: seller ? seller.storeName : '' };
  return res.json({ success: true, data });
}

// GET /api/v1/sellers/get/profile
async function getFullProfile(req, res) {
  const seller = await Seller.findOne({ userId: req.user._id });
  if (!seller) return res.json({ seller: {} });
  return res.json({ seller });
}

// POST /api/v1/sellers/profile/full (multipart)
const profileFullMiddleware = upload.single('storeLogo');
async function profileFull(req, res) {
  try {
    let seller = await Seller.findOne({ userId: req.user._id });
    if (!seller) {
      seller = await Seller.create({ userId: req.user._id, email: req.user.email, storeName: req.body.storeName || req.user.name });
    }
    const { storeName, email, phone, description, businessCategory } = req.body;
    if (storeName) seller.storeName = storeName;
    if (email) seller.email = email;
    if (phone) seller.phone = phone;
    if (description) seller.description = description;
    if (businessCategory) seller.businessCategory = businessCategory;
    if (req.body.location) {
      try { seller.location = JSON.parse(req.body.location); } catch (_) {}
    }
    if (req.file) {
      const uploadRes = await uploadBufferToCloudinary(req.file.buffer, 'tradelink/storeLogos', undefined);
      seller.storeLogo = uploadRes.secure_url;
    }
    await seller.save();
    return res.json({ message: 'Profile saved', seller });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Failed to save profile' });
  }
}

// GET /api/v1/sellers/dashboard
async function dashboard(req, res) {
  const seller = await Seller.findOne({ userId: req.user._id });
  const sellerId = seller?._id;
  const totalProducts = await Product.countDocuments({ sellerId });
  const totalMessages = await Message.countDocuments({ recipientId: req.user._id });
  const totalCustomerReviews = 0; // placeholder — no reviews model
  const recentMessages = [];
  const customerReviews = [];
  return res.json({ totalProducts, totalMessages, totalCustomerReviews, recentMessages, customerReviews });
}

module.exports = {
  onlyProfile,
  getFullProfile,
  profileFullMiddleware,
  profileFull,
  dashboard,
};

