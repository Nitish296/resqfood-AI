const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/errorHandler');
const ApiError = require('./utils/ApiError');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const donationRoutes = require('./routes/donation.routes');
const requestRoutes = require('./routes/request.routes');
const adminRoutes = require('./routes/admin.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({ contentSecurityPolicy: false })); // Disable CSP for Swagger UI

// CORS
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// ============================================================
// Rate Limiting
// ============================================================
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});

app.use(globalLimiter);

const path = require('path');

// ============================================================
// Body Parsing & Logging
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Serve Google Client ID to frontend (injected into page)
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  res.send(`window.GOOGLE_CLIENT_ID = "${clientId}";`);
});

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev', {
    skip: (req) => req.url === '/health',
  }));
}

// ============================================================
// Health Check
// ============================================================
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResQFood AI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// ============================================================
// API Documentation (Swagger)
// ============================================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ResQFood AI API Documentation',
}));

// ============================================================
// API Root Info
// ============================================================
app.get('/api', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to ResQFood AI API',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    health: `${req.protocol}://${req.get('host')}/health`,
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      donations: '/api/donations',
      requests: '/api/requests',
      admin: '/api/admin',
      notifications: '/api/notifications'
    }
  });
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationRoutes);

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res, next) => {
  next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

// ============================================================
// Global Error Handler
// ============================================================
app.use(errorHandler);

module.exports = app;
