const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { createServer, listMyServers, joinServer } = require('../controllers/serverController');

// All routes here require login — applied once to the whole router
router.use(requireAuth);

router.post('/', createServer);
router.get('/', listMyServers);
router.post('/:serverId/join', joinServer);

module.exports = router;
