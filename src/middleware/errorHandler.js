const ApiError = require('../utils/ApiError');

/**
 * Global error handler middleware for Express.
 * Handles ApiError, Mongoose errors, JWT errors, and default exceptions.
 *
 * @param {Error} err - Error object
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const errorHandler = (err, req, res, next) => {
  // Log error with timestamp
  console.error(`[${new Date().toISOString()}] Error:`, err);

  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle known error types
  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'ValidationError') { // Mongoose validation error
    statusCode = 400;
    const messages = Object.values(err.errors || {}).map(e => e.message);
    message = messages.join(', ') || 'Validation Error';
  } else if (err.name === 'CastError') { // Mongoose invalid ObjectId
    statusCode = 400;
    message = 'Invalid ID format';
  } else if (err.code === 11000) { // Mongoose duplicate key error
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `Duplicate value for ${field}`;
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    // Though usually handled in auth middleware, this is a fallback
    statusCode = 401;
    message = 'Invalid or expired token';
  }

  // Prepare response payload
  const response = {
    success: false,
    message
  };

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
