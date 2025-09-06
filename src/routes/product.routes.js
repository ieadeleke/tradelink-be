const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/product.controller');

router.get('/', ctrl.listProducts);
router.post('/', authRequired, ctrl.uploadProductImage, ctrl.createProduct);
router.get('/seller/:sellerId', ctrl.listBySeller);
router.get('/:id', ctrl.getProduct);
router.delete('/:id', authRequired, ctrl.removeProduct);

module.exports = router;
