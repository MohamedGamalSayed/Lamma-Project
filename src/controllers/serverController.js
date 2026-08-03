const pool = require('../config/db');

// Create a new server — the creator automatically becomes the owner
// and gets added as a member with role 'owner'.
async function createServer(req, res) {
  try {
    const { name } = req.body;
    const userId = req.user.id; // comes from authMiddleware, set from the JWT

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'server name is required' });
    }

    // Use a transaction: if either query fails, undo both (no orphaned server
    // with no owner membership).
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const serverResult = await client.query(
        'INSERT INTO servers (name, owner_id) VALUES ($1, $2) RETURNING *',
        [name.trim(), userId]
      );
      const server = serverResult.rows[0];

      await client.query(
        `INSERT INTO memberships (user_id, server_id, role) VALUES ($1, $2, 'owner')`,
        [userId, server.id]
      );

      // Every new server gets a default #general text channel so it's not empty
      const channelResult = await client.query(
        `INSERT INTO channels (server_id, name, type) VALUES ($1, 'general', 'text') RETURNING *`,
        [server.id]
      );

      await client.query('COMMIT');

      res.status(201).json({ server, defaultChannel: channelResult.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Create server error:', err);
    res.status(500).json({ error: 'could not create server' });
  }
}

// List all servers the logged-in user is a member of
async function listMyServers(req, res) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT s.*, m.role
       FROM servers s
       JOIN memberships m ON m.server_id = s.id
       WHERE m.user_id = $1
       ORDER BY s.created_at ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List servers error:', err);
    res.status(500).json({ error: 'could not list servers' });
  }
}

// Join an existing server by its id
async function joinServer(req, res) {
  try {
    const userId = req.user.id;
    const serverId = parseInt(req.params.serverId, 10);

    const serverCheck = await pool.query('SELECT id FROM servers WHERE id = $1', [serverId]);
    if (serverCheck.rows.length === 0) {
      return res.status(404).json({ error: 'server not found' });
    }

    const existing = await pool.query(
      'SELECT id FROM memberships WHERE user_id = $1 AND server_id = $2',
      [userId, serverId]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'already a member of this server' });
    }

    await pool.query(
      `INSERT INTO memberships (user_id, server_id, role) VALUES ($1, $2, 'member')`,
      [userId, serverId]
    );

    res.status(201).json({ message: 'joined server successfully' });
  } catch (err) {
    console.error('Join server error:', err);
    res.status(500).json({ error: 'could not join server' });
  }
}

module.exports = { createServer, listMyServers, joinServer };
