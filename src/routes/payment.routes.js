const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/payment.controller');

router.post('/initiate', authRequired, ctrl.initiatePayment);
router.post('/webhook', ctrl.flutterwaveWebhook);

module.exports = router;

