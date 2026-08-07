const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

/**
 * Register a new user
 * @param {Object} userData
 * @returns {Promise<Object>}
 */
const register = async (userData) => {
  try {
    const user = await User.create(userData);
    const token = generateToken(user._id, user.role, user.email);
    const refreshToken = generateRefreshToken(user._id);
    return { user, token, refreshToken };
  } catch (error) {
    if (error.code === 11000) {
      throw ApiError.badRequest('Email already exists');
    }
    throw error;
  }
};

/**
 * Login user
 * @param {string} email
 * @param {string} password
 * @returns {Promise<Object>}
 */
const login = async (email, password) => {
  const user = await User.findByEmail(email);
  if (!user) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw ApiError.unauthorized('Invalid credentials');
  }

  const token = generateToken(user._id, user.role, user.email);
  const refreshToken = generateRefreshToken(user._id);

  return { user, token, refreshToken };
};

/**
 * Generate access token
 * @param {string} userId
 * @param {string} role
 * @param {string} email
 * @returns {string}
 */
const generateToken = (userId, role, email) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required');
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  return jwt.sign({ sub: userId, role, email }, secret, { expiresIn });
};

/**
 * Generate refresh token
 * @param {string} userId
 * @returns {string}
 */
const generateRefreshToken = (userId) => {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is required');
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  return jwt.sign({ sub: userId }, secret, { expiresIn });
};

module.exports = {
  register,
  login,
  generateToken,
  generateRefreshToken
};
