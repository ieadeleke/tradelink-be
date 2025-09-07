const router = require('express').Router();
const { authRequired } = require('../middleware/auth');
const ctrl = require('../controllers/message.controller');

router.get('/get/conversations', authRequired, ctrl.getConversations);
router.get('/get/all/conversations/:userId', authRequired, ctrl.getConversationMessages);
// Alias for clarity: returns both sent and received messages
router.get('/history/:userId', authRequired, ctrl.getConversationMessages);
// Inbox for current user (messages received)
router.get('/inbox', authRequired, ctrl.getInbox);
router.patch('/read/:messageId', authRequired, ctrl.markRead);
router.post('/send', authRequired, ctrl.sendMessage);
// Explicit reply endpoint for sellers (same behavior as send)
router.post('/reply', authRequired, ctrl.replyMessage);

module.exports = router;
