const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/seller.controller');

router.get('/only/profile', authRequired, ctrl.onlyProfile);
router.get('/get/profile', authRequired, ctrl.getFullProfile);
router.post('/profile/full', authRequired, ctrl.profileFullMiddleware, ctrl.profileFull);
router.get('/dashboard', authRequired, ctrl.dashboard);
// Public seller profile (for buyers)
router.get('/public/:sellerId', ctrl.getSellerPublic);

module.exports = router;
