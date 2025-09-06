const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/service.controller');

router.get('/all', ctrl.listAll);
router.post('/create', authRequired, ctrl.uploadServiceImage, ctrl.createService);
router.get('/seller/:sellerId', ctrl.listBySeller);
router.get('/:id', ctrl.getService);
router.delete('/:id', authRequired, ctrl.removeService);
router.patch('/:id/services-offered', authRequired, ctrl.updateServicesOffered);
router.patch('/:id/working-hours', authRequired, ctrl.updateWorkingHours);
router.patch('/:id/reviews', authRequired, ctrl.updateReviews);

module.exports = router;
