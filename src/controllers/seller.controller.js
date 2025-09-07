const multer = require('multer');
const Seller = require('../models/Seller');
const Product = require('../models/Product');
const Service = require('../models/Service');
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

// GET /api/v1/sellers/public/:sellerId
async function getSellerPublic(req, res) {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });
    const [products, services] = await Promise.all([
      Product.find({ sellerId }).sort({ createdAt: -1 }),
      Service.find({ sellerId }).sort({ createdAt: -1 }),
    ]);
    const productItems = products.map(p => ({
      id: String(p._id),
      name: p.name,
      category: p.category,
      price: p.price,
      quantity: p.quantity,
      productImg: p.productImg,
    }));
    const serviceItems = services.map(s => ({
      id: String(s._id),
      name: s.name,
      category: s.category,
      price: s.price,
      serviceImg: s.serviceImg,
    }));
    const stats = {
      productsCount: products.length,
      servicesCount: services.length,
      reviewsCount: 0,
      rating: null,
    };
    return res.json({ seller, products: productItems, services: serviceItems, stats, reviews: [] });
  } catch (_) {
    return res.status(400).json({ message: 'Invalid seller id' });
  }
}

module.exports.getSellerPublic = getSellerPublic;

// GET /api/v1/sellers/search?query=...
async function searchSellers(req, res) {
  try {
    const { query } = req.query;
    if (!query || String(query).trim() === '') {
      return res.status(400).json({ message: 'Query is required' });
    }

    const q = String(query).trim();
    const re = new RegExp(q, 'i');

    // Find sellerIds that have services matching the query (servicesOffered)
    const serviceSellerIds = await Service.find({ servicesOffered: re }).distinct('sellerId');

    // Find sellerIds that have products matching the query (name/category/description)
    const productSellerIds = await Product.find({
      $or: [
        { name: re },
        { category: re },
        { description: re },
      ],
    }).distinct('sellerId');

    const filter = {
      $or: [
        { storeName: re },
        { 'location.city': re },
        { 'location.state': re },
        { businessCategory: re },
        { _id: { $in: [...new Set([...serviceSellerIds, ...productSellerIds])].filter(Boolean) } },
      ],
    };

    const sellers = await Seller.find(filter)
      .select('storeName storeLogo businessCategory location description email phone createdAt')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ sellers });
  } catch (e) {
    console.error('searchSellers error:', e);
    return res.status(500).json({ message: 'Failed to search sellers' });
  }
}

module.exports.searchSellers = searchSellers;
