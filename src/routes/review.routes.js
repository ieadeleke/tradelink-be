const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/review.controller');

// Create a new review for a seller
router.post('/', authRequired, ctrl.createReview);

module.exports = router;

