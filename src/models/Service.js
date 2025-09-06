const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seller' },
    name: { type: String, required: true },
    category: { type: String },
    price: { type: Number },
    description: { type: String },
    serviceImg: { type: String },
    email: { type: String },
    storeName: { type: String },
    location: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);

