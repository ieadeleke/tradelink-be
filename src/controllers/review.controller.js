const Review = require('../models/Review');
const Seller = require('../models/Seller');

// POST /api/v1/reviews
async function createReview(req, res) {
  try {
    const { sellerId, rating, comment } = req.body;
    if (!sellerId) return res.status(400).json({ message: 'sellerId is required' });
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ message: 'rating must be between 1 and 5' });
    }
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: 'Seller not found' });

    const review = await Review.create({
      sellerId,
      userId: req.user._id,
      rating: numRating,
      comment,
    });
    return res.status(201).json({ message: 'Review created', data: review });
  } catch (e) {
    console.error('createReview error:', e);
    return res.status(500).json({ message: 'Failed to create review' });
  }
}

module.exports = { createReview };

