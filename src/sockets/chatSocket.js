const jwt = require('jsonwebtoken');
const pool = require('../config/db');

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

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.user.username}`);
    });
  });
}

module.exports = setupSocket;
