const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');

router.get('/get/profile', authRequired, ctrl.getProfile);
router.put('/profile/update', authRequired, ctrl.updateProfile);
router.put('/change-password', authRequired, ctrl.changePassword);
router.delete('/delete/profile', authRequired, ctrl.deleteProfile);

// Buyer orders
router.get('/orders', authRequired, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const Product = require('../models/Product');
    const orders = await Order.find({ buyerId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    const productIds = [...new Set(orders.map(o => String(o.productId)))];
    const products = await Product.find({ _id: { $in: productIds } }, { name: 1, productImg: 1 }).lean();
    const pmap = new Map(products.map(p => [String(p._id), p]));
    const shaped = orders.map(o => ({
      _id: String(o._id),
      productId: String(o.productId),
      productName: pmap.get(String(o.productId))?.name || 'Product',
      productImg: pmap.get(String(o.productId))?.productImg || '',
      amount: o.amount,
      currency: o.currency || 'NGN',
      quantity: o.quantity || 1,
      status: o.status,
      createdAt: o.createdAt,
      reference: o.tx_ref,
    }));
    res.json({ orders: shaped });
  } catch (e) {
    res.status(500).json({ message: 'Failed to load orders' });
  }
});

module.exports = router;
