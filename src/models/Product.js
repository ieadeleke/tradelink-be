const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, default: 0 },
    description: { type: String },
    productImg: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);

