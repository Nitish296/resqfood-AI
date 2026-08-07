const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

/**
 * Initialize Socket.IO server
 * @param {import('http').Server} httpServer - HTTP server instance
 * @returns {import('socket.io').Server} Socket.IO server instance
 */
const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(',')
        : 'http://localhost:3000',
      credentials: true,
    },
  });

  // JWT Authentication middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
      || socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication token required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.sub,
        role: decoded.role,
        email: decoded.email,
      };
      next();
    } catch (err) {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    console.log(`[Socket.IO] User connected: ${userId}`);

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`[Socket.IO] User disconnected: ${userId} (${reason})`);
      socket.leave(`user:${userId}`);
    });
  });

  console.log('[Socket.IO] Server initialized');
  return io;
};

/**
 * Get the Socket.IO instance
 * @returns {import('socket.io').Server}
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized. Call initSocket() first.');
  }
  return io;
};

/**
 * Emit an event to a specific user
 * @param {string} userId - Target user ID
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToUser = (userId, event, data) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

/**
 * Emit an event to multiple users
 * @param {string[]} userIds - Array of target user IDs
 * @param {string} event - Event name
 * @param {object} data - Event data
 */
const emitToUsers = (userIds, event, data) => {
  if (io) {
    userIds.forEach((userId) => {
      io.to(`user:${userId}`).emit(event, data);
    });
  }
};

module.exports = { initSocket, getIO, emitToUser, emitToUsers };
