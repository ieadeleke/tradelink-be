const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    buyerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    quantity: { type: Number, default: 1 },
    status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
    tx_ref: { type: String, index: true },
    flw_tx_id: { type: String },
    meta: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);

