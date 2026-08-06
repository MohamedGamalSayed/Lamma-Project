const pool = require('../config/db');

// Helper: check the user is actually a member of the server before
// letting them see/create channels in it. Reused by both functions below.
async function assertMembership(userId, serverId) {
  const result = await pool.query(
    'SELECT role FROM memberships WHERE user_id = $1 AND server_id = $2',
    [userId, serverId]
  );
  return result.rows[0] || null; // returns { role } or null if not a member
}

async function createChannel(req, res) {
  try {
    const userId = req.user.id;
    const serverId = parseInt(req.params.serverId, 10);
    const { name, type = 'text' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'channel name is required' });
    }

    const membership = await assertMembership(userId, serverId);
    if (!membership) {
      return res.status(403).json({ error: 'you are not a member of this server' });
    }
    // Only owner/admin can create channels — members can just chat
    if (membership.role === 'member') {
      return res.status(403).json({ error: 'only admins/owner can create channels' });
    }

    const result = await pool.query(
      'INSERT INTO channels (server_id, name, type) VALUES ($1, $2, $3) RETURNING *',
      [serverId, name.trim(), type]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'could not create channel' });
  }
}

async function listChannels(req, res) {
  try {
    const userId = req.user.id;
    const serverId = parseInt(req.params.serverId, 10);

    const membership = await assertMembership(userId, serverId);
    if (!membership) {
      return res.status(403).json({ error: 'you are not a member of this server' });
    }

    const result = await pool.query(
      'SELECT * FROM channels WHERE server_id = $1 ORDER BY created_at ASC',
      [serverId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('List channels error:', err);
    res.status(500).json({ error: 'could not list channels' });
  }
}

// Get message history for a channel (used when a user first opens a channel,
// before any new live messages arrive over the socket). Also attaches any
// existing reactions, grouped by emoji, so a page refresh doesn't lose them.
async function getChannelMessages(req, res) {
  try {
    const channelId = parseInt(req.params.channelId, 10);

    const messagesResult = await pool.query(
      `SELECT m.*, u.username
       FROM messages m
       JOIN users u ON u.id = m.user_id
       WHERE m.channel_id = $1
       ORDER BY m.created_at ASC
       LIMIT 100`,
      [channelId]
    );

    const messages = messagesResult.rows;
    if (messages.length === 0) {
      return res.json([]);
    }

    const messageIds = messages.map((m) => m.id);
    const reactionsResult = await pool.query(
      `SELECT r.message_id, r.emoji, r.user_id, u.username
       FROM reactions r
       JOIN users u ON u.id = r.user_id
       WHERE r.message_id = ANY($1)`,
      [messageIds]
    );

    // Group into { [messageId]: [{ emoji, count, users }] } so the frontend
    // can render "👍 3" badges without doing the counting itself.
    const reactionsByMessage = {};
    for (const row of reactionsResult.rows) {
      if (!reactionsByMessage[row.message_id]) reactionsByMessage[row.message_id] = {};
      const byEmoji = reactionsByMessage[row.message_id];
      if (!byEmoji[row.emoji]) byEmoji[row.emoji] = { emoji: row.emoji, count: 0, users: [] };
      byEmoji[row.emoji].count += 1;
      byEmoji[row.emoji].users.push(row.username);
    }

    const withReactions = messages.map((m) => ({
      ...m,
      reactions: reactionsByMessage[m.id] ? Object.values(reactionsByMessage[m.id]) : [],
    }));

    res.json(withReactions);
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'could not load messages' });
  }
}

module.exports = { createChannel, listChannels, getChannelMessages, assertMembership };
