const express = require('express');
const router = express.Router();
const { signup, login } = require('../controllers/authController');
const requireAuth = require('../middleware/authMiddleware');
const pool = require('../config/db');

router.post('/signup', signup);
router.post('/login', login);

// Simple protected route to prove the whole flow works end to end:
// call this with your JWT and it should return your own user info.
router.get('/me', requireAuth, async (req, res) => {
  const result = await pool.query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [req.user.id]
  );
  res.json(result.rows[0]);
});

module.exports = router;
