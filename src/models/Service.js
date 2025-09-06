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
    // Array of strings describing specific services offered
    servicesOffered: { type: [String], default: [] },
    // Working hours per day, simple structure
    workingHours: {
      type: [
        new mongoose.Schema(
          {
            day: { type: String },
            open: { type: String }, // e.g. "09:00"
            close: { type: String }, // e.g. "17:00"
            closed: { type: Boolean, default: false },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    // Lightweight embedded reviews
    reviews: {
      type: [
        new mongoose.Schema(
          {
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            rating: { type: Number, min: 1, max: 5 },
            comment: { type: String },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: false }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Service', serviceSchema);
