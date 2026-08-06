const jwt = require('jsonwebtoken');
const pool = require('../config/db');

// Tracks the single active socket id per user, so a new connection from the
// same user can replace (rather than pile up alongside) the old one.
const activeSockets = new Map(); // userId -> socketId

// This function gets called once from index.js, passing in the Socket.IO
// server instance. It sets up everything related to real-time chat.
function setupSocket(io) {
  // --- Authenticate every socket connection using the same JWT from login ---
  // The frontend will connect like: io(url, { auth: { token: "..." } })
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error('no token provided'));
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, username }
      next();
    } catch (err) {
      next(new Error('invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.user.username} (${socket.id})`);

    // If this user already has a live connection elsewhere, disconnect it.
    // Prevents the same user racking up duplicate sockets (and duplicate
    // broadcasts) when they reconnect, e.g. by pressing "Connect" again.
    const existingSocketId = activeSockets.get(socket.user.id);
    if (existingSocketId && existingSocketId !== socket.id) {
      const existingSocket = io.sockets.sockets.get(existingSocketId);
      if (existingSocket) {
        existingSocket.emit('force_disconnect', { reason: 'connected elsewhere' });
        existingSocket.disconnect(true);
      }
    }
    activeSockets.set(socket.user.id, socket.id);

    // Frontend calls this when the user opens a channel.
    // "Rooms" in Socket.IO let us broadcast only to people viewing that
    // specific channel, not every connected user everywhere.
    socket.on('join_channel', (channelId) => {
      socket.join(`channel_${channelId}`);
    });

    socket.on('leave_channel', (channelId) => {
      socket.leave(`channel_${channelId}`);
    });

    // Frontend calls this when the user sends a message
    socket.on('send_message', async ({ channelId, content, attachmentUrl }) => {
      try {
        if (!content && !attachmentUrl) return; // ignore empty messages

        const result = await pool.query(
          `INSERT INTO messages (channel_id, user_id, content, attachment_url)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [channelId, socket.user.id, content || null, attachmentUrl || null]
        );

        const message = {
          ...result.rows[0],
          username: socket.user.username, // attach for display, avoids extra query
        };

        // Broadcast to everyone in that channel's room (including sender,
        // so their own UI updates from the same source of truth)
        io.to(`channel_${channelId}`).emit('new_message', message);
      } catch (err) {
        console.error('Send message error:', err);
        socket.emit('message_error', { error: 'could not send message' });
      }
    });

    // Frontend calls this when a user clicks an emoji on a message.
    // We look up which channel the message belongs to so we broadcast only
    // to people viewing that channel (same room pattern as send_message).
    socket.on('add_reaction', async ({ messageId, emoji }) => {
      try {
        if (!messageId || !emoji) return;

        const msgResult = await pool.query('SELECT channel_id FROM messages WHERE id = $1', [messageId]);
        if (msgResult.rows.length === 0) return;
        const channelId = msgResult.rows[0].channel_id;

        // ON CONFLICT DO NOTHING: same user clicking the same emoji twice is a no-op,
        // not an error (the UNIQUE constraint on message_id/user_id/emoji handles this)
        await pool.query(
          `INSERT INTO reactions (message_id, user_id, emoji)
           VALUES ($1, $2, $3)
           ON CONFLICT (message_id, user_id, emoji) DO NOTHING`,
          [messageId, socket.user.id, emoji]
        );

        io.to(`channel_${channelId}`).emit('reaction_added', {
          messageId,
          emoji,
          userId: socket.user.id,
          username: socket.user.username,
        });
      } catch (err) {
        console.error('Add reaction error:', err);
      }
    });

    // Frontend calls this when a user clicks an emoji they've already reacted with
    // (toggling it off).
    socket.on('remove_reaction', async ({ messageId, emoji }) => {
      try {
        if (!messageId || !emoji) return;

        const msgResult = await pool.query('SELECT channel_id FROM messages WHERE id = $1', [messageId]);
        if (msgResult.rows.length === 0) return;
        const channelId = msgResult.rows[0].channel_id;

        await pool.query(
          'DELETE FROM reactions WHERE message_id = $1 AND user_id = $2 AND emoji = $3',
          [messageId, socket.user.id, emoji]
        );

        io.to(`channel_${channelId}`).emit('reaction_removed', {
          messageId,
          emoji,
          userId: socket.user.id,
        });
      } catch (err) {
        console.error('Remove reaction error:', err);
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.username}`);
      // Only clear the map entry if it still points at this socket — avoids
      // a race where an old socket's disconnect fires after a newer one
      // already registered and would otherwise wipe out the new entry.
      if (activeSockets.get(socket.user.id) === socket.id) {
        activeSockets.delete(socket.user.id);
      }
    });
  });
}

module.exports = setupSocket;
