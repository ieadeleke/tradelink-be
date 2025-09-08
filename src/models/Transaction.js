const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller', required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: 'NGN' },
    status: { type: String, enum: ['paid', 'failed'], required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Transaction', transactionSchema);

