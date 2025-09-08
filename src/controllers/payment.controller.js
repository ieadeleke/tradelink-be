const Order = require('../models/Order');
const Product = require('../models/Product');
const Seller = require('../models/Seller');
const Transaction = require('../models/Transaction');
const { sendOrderPaidEmail } = require('../utils/mailer');

// POST /api/v1/payments/initiate (Paystack)
// Creates a pending order and returns checkout payload incl. reference
async function initiatePayment(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!productId) return res.status(400).json({ message: 'productId is required' });
    const product = await Product.findById(productId).populate('sellerId');
    if (!product) return res.status(404).json({ message: 'Product not found' });
    const sellerId = product.sellerId?._id;
    if (!sellerId) return res.status(400).json({ message: 'Product has no seller' });
    const amount = Number(product.price) * Number(quantity || 1);
    const reference = `PSK-${Date.now()}-${Math.floor(Math.random() * 99999)}`;
    const order = await Order.create({
      productId: product._id,
      sellerId,
      buyerId: req.user._id,
      amount,
      currency: 'NGN',
      quantity: Number(quantity || 1),
      status: 'pending',
      tx_ref: reference,
      meta: {}
    });
    return res.json({
      orderId: String(order._id),
      reference,
      amount,
      currency: 'NGN',
      customer: { name: req.user.name, email: req.user.email },
      product: { name: product.name },
      publicKey: process.env.PAYSTACK_PUBLIC_KEY || null,
    });
  } catch (e) {
    console.error('initiatePayment error', e);
    return res.status(500).json({ message: 'Failed to initiate payment' });
  }
}

// POST /api/v1/payments/webhook
// (Legacy Flutterwave webhook retained for backwards-compat)
async function flutterwaveWebhook(req, res) {
  try {
    const hash = req.headers['verif-hash'];
    if (!hash || hash !== process.env.FLW_HASH) {
      return res.status(401).json({ message: 'Invalid hash' });
    }
    const event = req.body;
    const txRef = event?.data?.tx_ref || event?.data?.txRef;
    const status = event?.data?.status || event?.status;
    const flw_tx_id = String(event?.data?.id || '');
    if (!txRef) return res.json({ received: true });
    const order = await Order.findOne({ tx_ref: txRef });
    if (!order) return res.json({ received: true });
    if (status === 'successful' || status === 'success') {
      order.status = 'paid';
      order.flw_tx_id = flw_tx_id;
      await order.save();
      // decrement product quantity (best-effort, not below 0)
      try {
        await Product.updateOne(
          { _id: order.productId },
          { $inc: { quantity: -Math.abs(order.quantity || 1) } }
        );
      } catch (_) {}
      await Transaction.create({
        sellerId: order.sellerId,
        orderId: order._id,
        productId: order.productId,
        amount: order.amount,
        currency: order.currency,
        status: 'paid',
      });
      // notify seller by email (best-effort)
      try {
        const seller = await Seller.findById(order.sellerId);
        const product = await Product.findById(order.productId);
        if (seller?.email) {
          await sendOrderPaidEmail(seller.email, {
            sellerName: seller.storeName,
            productName: product?.name || 'Product',
            amount: order.amount,
            currency: order.currency || 'NGN',
          });
        }
      } catch (mailErr) {
        console.warn('Order email failed', mailErr?.message);
      }
    } else if (status === 'failed') {
      order.status = 'failed';
      order.flw_tx_id = flw_tx_id;
      await order.save();
    }
    return res.json({ received: true });
  } catch (e) {
    console.error('flw webhook error', e);
    return res.json({ received: true });
  }
}

// POST /api/v1/payments/paystack/webhook
// Verifies x-paystack-signature and marks order paid/failed
const crypto = require('crypto');
async function paystackWebhook(req, res) {
  try {
    const signature = req.headers['x-paystack-signature'];
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!signature || !secret) return res.status(401).json({ message: 'Unauthorized' });
    const hash = crypto
      .createHmac('sha512', secret)
      .update(JSON.stringify(req.body))
      .digest('hex');
    if (hash !== signature) return res.status(401).json({ message: 'Invalid signature' });

    const event = req.body;
    const data = event?.data || {};
    const reference = data?.reference;
    if (!reference) return res.json({ received: true });
    const order = await Order.findOne({ tx_ref: reference });
    if (!order) return res.json({ received: true });

    if (event?.event === 'charge.success' || data?.status === 'success') {
      order.status = 'paid';
      order.flw_tx_id = String(data?.id || data?.transaction || '');
      await order.save();
      try {
        await Product.updateOne(
          { _id: order.productId },
          { $inc: { quantity: -Math.abs(order.quantity || 1) } }
        );
      } catch (_) {}
      await Transaction.create({
        sellerId: order.sellerId,
        orderId: order._id,
        productId: order.productId,
        amount: order.amount,
        currency: order.currency,
        status: 'paid',
      });
      try {
        const seller = await require('../models/Seller').findById(order.sellerId);
        const product = await require('../models/Product').findById(order.productId);
        if (seller?.email) {
          await sendOrderPaidEmail(seller.email, {
            sellerName: seller.storeName,
            productName: product?.name || 'Product',
            amount: order.amount,
            currency: order.currency || 'NGN',
          });
        }
      } catch (mailErr) {
        console.warn('Order email failed', mailErr?.message);
      }
    } else {
      order.status = 'failed';
      await order.save();
    }
    return res.json({ received: true });
  } catch (e) {
    console.error('paystack webhook error', e);
    return res.json({ received: true });
  }
}

module.exports = { initiatePayment, flutterwaveWebhook, paystackWebhook };
