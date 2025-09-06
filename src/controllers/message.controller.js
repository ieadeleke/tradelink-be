const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');

// GET /api/v1/messages/get/conversations
async function getConversations(req, res) {
  const convs = await Conversation.find({ participants: req.user._id }).sort({ updatedAt: -1 });
  const result = [];
  for (const c of convs) {
    const otherId = c.participants.find((p) => String(p) !== String(req.user._id));
    const other = otherId ? await User.findById(otherId) : null;
    result.push({
      id: String(c._id),
      name: other?.name || 'Customer',
      lastMessage: c.lastMessage || '',
      userId: other ? String(other._id) : undefined,
      unreadCount: await Message.countDocuments({ conversationId: c._id, recipientId: req.user._id, isRead: false }),
    });
  }
  return res.json({ conversations: result });
}

// GET /api/v1/messages/get/all/conversations/:userId
async function getConversationMessages(req, res) {
  const { userId } = req.params;
  let conv = await Conversation.findOne({ participants: { $all: [req.user._id, userId] } });
  if (!conv) return res.json({ messages: [] });
  const msgs = await Message.find({ conversationId: conv._id }).sort({ createdAt: 1 });
  return res.json({ messages: msgs });
}

// PATCH /api/v1/messages/read/:messageId
async function markRead(req, res) {
  const { messageId } = req.params;
  await Message.updateOne({ _id: messageId, recipientId: req.user._id }, { $set: { isRead: true } });
  return res.json({ message: 'Read' });
}

// POST /api/v1/messages/send
async function sendMessage(req, res) {
  const { recipientId, content, conversationId } = req.body;
  if (!recipientId || !content) return res.status(400).json({ message: 'Missing fields' });
  let conv = conversationId ? await Conversation.findById(conversationId) : null;
  if (!conv) {
    conv = await Conversation.findOne({ participants: { $all: [req.user._id, recipientId] } });
  }
  if (!conv) {
    conv = await Conversation.create({ participants: [req.user._id, recipientId], lastMessage: content });
  }
  const msg = await Message.create({ conversationId: conv._id, senderId: req.user._id, recipientId, content });
  conv.lastMessage = content;
  await conv.save();
  return res.status(201).json({ message: { id: String(msg._id) } });
}

module.exports = { getConversations, getConversationMessages, markRead, sendMessage };

