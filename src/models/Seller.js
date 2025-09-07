const mongoose = require('mongoose');

const sellerSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    storeName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    address: { type: String },
    description: { type: String },
    businessCategory: { type: String },
    businessLevel: { type: String },
    storeLogo: { type: String },
    location: {
      city: { type: String },
      state: { type: String },
    },
    workingHours: {
      mon: { type: String },
      tue: { type: String },
      wed: { type: String },
      thu: { type: String },
      fri: { type: String },
      sat: { type: String },
      sun: { type: String },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Seller', sellerSchema);
