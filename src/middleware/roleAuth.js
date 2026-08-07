const ApiError = require('../utils/ApiError');

/**
 * Middleware factory to authorize requests based on user roles.
 * Must be used after the authentication middleware.
 *
 * @param {...string} roles - Allowed roles for the route
 * @returns {import('express').RequestHandler} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      throw ApiError.unauthorized('User not authenticated properly.');
    }

    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden('Access denied. Insufficient permissions.');
    }

    next();
  };
};

module.exports = { authorize };
