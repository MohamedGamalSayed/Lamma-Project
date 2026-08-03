const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const {
  createChannel,
  listChannels,
  getChannelMessages,
} = require('../controllers/channelController');

router.use(requireAuth);

router.post('/servers/:serverId/channels', createChannel);
router.get('/servers/:serverId/channels', listChannels);
router.get('/channels/:channelId/messages', getChannelMessages);

module.exports = router;
