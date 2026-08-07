require('dotenv').config();

const http = require('http');
const app = require('./src/app');
const { connectDB } = require('./src/config/db');
const { initSocket } = require('./src/socket/socketHandler');

const PORT = process.env.PORT || 5000;

/**
 * Start the ResQFood AI server
 */
const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('[Server] MongoDB connected successfully');

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO
    const io = initSocket(server);
    app.set('io', io);
    console.log('[Server] Socket.IO initialized');

    // Start listening
    server.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`  ResQFood AI API Server`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Port: ${PORT}`);
      console.log(`  API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`  Health: http://localhost:${PORT}/health`);
      console.log(`========================================\n`);
    });

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n[Server] ${signal} received. Starting graceful shutdown...`);
      server.close(() => {
        console.log('[Server] HTTP server closed');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    console.error('[Server] Failed to start:', error.message);
    process.exit(1);
  }
};

startServer();
