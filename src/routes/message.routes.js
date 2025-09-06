const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/message.controller');

router.get('/get/conversations', authRequired, ctrl.getConversations);
router.get('/get/all/conversations/:userId', authRequired, ctrl.getConversationMessages);
router.patch('/read/:messageId', authRequired, ctrl.markRead);
router.post('/send', authRequired, ctrl.sendMessage);

module.exports = router;

