const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Keep uploads in memory (not written to disk) and stream them straight to
// Cloudinary. 8MB cap keeps this fine for the free tier.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

function uploadToCloudinary(buffer, resourceType) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { resource_type: resourceType, folder: 'chatapp' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// POST /api/media/upload — multipart form, field name "file"
async function uploadAttachment(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'no file provided' });
    }

    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');
    if (!isImage && !isVideo) {
      return res.status(400).json({ error: 'only image or video files are supported' });
    }

    const result = await uploadToCloudinary(req.file.buffer, isVideo ? 'video' : 'image');

    res.json({
      url: result.secure_url,
      type: isVideo ? 'video' : 'image',
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'could not upload file' });
  }
}

// GET /api/media/gifs/search?q=cats
async function searchGifs(req, res) {
  try {
    const q = (req.query.q || '').trim();
    if (!q) {
      return res.status(400).json({ error: 'query param "q" is required' });
    }

    const url = `https://api.giphy.com/v1/gifs/search?api_key=${process.env.GIPHY_API_KEY}&q=${encodeURIComponent(q)}&limit=12&rating=g`;
    const giphyRes = await fetch(url);

    if (!giphyRes.ok) {
      throw new Error(`Giphy responded ${giphyRes.status}`);
    }

    const data = await giphyRes.json();
    const gifs = (data.data || []).map((g) => ({
      id: g.id,
      title: g.title,
      preview: g.images.fixed_width_small.url, // small, for the search results grid
      url: g.images.fixed_width.url, // the one we actually send as the attachment
    }));

    res.json(gifs);
  } catch (err) {
    console.error('GIF search error:', err);
    res.status(500).json({ error: 'could not search gifs' });
  }
}

module.exports = { upload, uploadAttachment, searchGifs };
