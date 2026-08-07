const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

/**
 * Middleware to authenticate requests using JWT.
 * Validates the Authorization header and attaches the decoded user to req.user.
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next middleware function
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw ApiError.unauthorized('Authentication required. Missing or malformed token.');
  }

  const token = authHeader.split(' ')[1];

  if (!token) {
    throw ApiError.unauthorized('Authentication required. Missing or malformed token.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user info to request
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Token has expired. Please authenticate again.');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw ApiError.unauthorized('Invalid token. Authentication failed.');
    }
    
    // Catch-all for other verification errors
    throw ApiError.unauthorized('Authentication failed.');
  }
};

module.exports = { authenticate };
