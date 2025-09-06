const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/service.controller');

router.get('/all', ctrl.listAll);
router.post('/create', authRequired, ctrl.uploadServiceImage, ctrl.createService);
router.get('/seller/:sellerId', ctrl.listBySeller);
router.get('/:id', ctrl.getService);
router.delete('/:id', authRequired, ctrl.removeService);

module.exports = router;
