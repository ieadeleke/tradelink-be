const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/user.controller');

router.get('/get/profile', authRequired, ctrl.getProfile);
router.put('/profile/update', authRequired, ctrl.updateProfile);
router.put('/change-password', authRequired, ctrl.changePassword);
router.delete('/delete/profile', authRequired, ctrl.deleteProfile);

module.exports = router;

