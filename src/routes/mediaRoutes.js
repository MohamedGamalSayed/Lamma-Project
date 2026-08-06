const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/authMiddleware');
const { upload, uploadAttachment, searchGifs } = require('../controllers/mediaController');

router.use(requireAuth);

router.post('/upload', upload.single('file'), uploadAttachment);
router.get('/gifs/search', searchGifs);

module.exports = router;
