const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

router.post('/register', ctrl.register);
router.get('/verify-email/:token', ctrl.verifyEmail);
router.post('/login', ctrl.login);
router.post('/forgot-password', ctrl.forgotPassword);
router.post('/resend-verification', ctrl.resendVerification);
router.post('/logout', ctrl.logout);

// Align with two frontend shapes
router.put('/reset-password', authRequired, ctrl.resetPasswordAuthenticated);

module.exports = router;
