require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const serverRoutes = require('./routes/serverRoutes');
const channelRoutes = require('./routes/channelRoutes');
const setupSocket = require('./sockets/chatSocket');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Chat app backend is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/servers', serverRoutes);
app.use('/api', channelRoutes); // channel routes already include "/servers/:id/channels" in their path

// Wrap the Express app in a plain HTTP server so Socket.IO can attach to
// the same server (both HTTP requests and WebSocket connections share port 5000)
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: { origin: '*' }, // fine for local development; tighten this for production
});

setupSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO ready for real-time connections`);
});
