const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/payment.controller');

router.post('/initiate', authRequired, ctrl.initiatePayment);
// Legacy flutterwave webhook (kept for compatibility)
router.post('/webhook', ctrl.flutterwaveWebhook);
// Paystack webhook
router.post('/paystack/webhook', ctrl.paystackWebhook);

module.exports = router;
