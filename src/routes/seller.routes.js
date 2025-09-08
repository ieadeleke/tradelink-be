const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/seller.controller');

router.get('/only/profile', authRequired, ctrl.onlyProfile);
router.get('/get/profile', authRequired, ctrl.getFullProfile);
router.post('/profile/full', authRequired, ctrl.profileFullMiddleware, ctrl.profileFull);
router.get('/dashboard', authRequired, ctrl.dashboard);
// Seller transactions
router.get('/transactions', authRequired, async (req, res) => {
  try {
    const Transaction = require('../models/Transaction');
    if (!req.user.sellerId) return res.json({ transactions: [] });
    const items = await Transaction.find({ sellerId: req.user.sellerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    res.json({ transactions: items });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load transactions' });
  }
});

// Seller orders
router.get('/orders', authRequired, async (req, res) => {
  try {
    if (!req.user.sellerId) return res.json({ orders: [] });
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const orders = await Order.find({ sellerId: req.user.sellerId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    // attach product name
    const productIds = [...new Set(orders.map(o => String(o.productId)))];
    const products = await Product.find({ _id: { $in: productIds } }, { name: 1 }).lean();
    const nameMap = new Map(products.map(p => [String(p._id), p.name]));
    const shaped = orders.map(o => ({
      _id: String(o._id),
      productId: String(o.productId),
      productName: nameMap.get(String(o.productId)) || 'Product',
      amount: o.amount,
      currency: o.currency || 'NGN',
      quantity: o.quantity || 1,
      status: o.status,
      createdAt: o.createdAt,
      tx_ref: o.tx_ref,
    }));
    res.json({ orders: shaped });
  } catch (e) {
    console.error('seller orders error', e);
    res.status(500).json({ message: 'Failed to load orders' });
  }
});
// Public seller profile (for buyers)
router.get('/public/:sellerId', ctrl.getSellerPublic);
// Search sellers (public)
router.get('/search', ctrl.searchSellers);

module.exports = router;
