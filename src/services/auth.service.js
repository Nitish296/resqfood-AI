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

/**
 * Login or register a user via Google OAuth idToken
 * @param {string} idToken - Google ID token from the frontend
 * @param {string} [role] - Role to assign if creating a new user (default: 'Donor')
 * @returns {Promise<Object>}
 */
const googleLogin = async (idToken, role = 'Donor') => {
  const { OAuth2Client } = require('google-auth-library');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID environment variable is required');

  const client = new OAuth2Client(clientId);

  // Verify the Google idToken
  let ticket;
  try {
    ticket = await client.verifyIdToken({
      idToken,
      audience: clientId,
    });
  } catch (error) {
    throw ApiError.unauthorized('Invalid Google token');
  }

  const payload = ticket.getPayload();
  const { sub: googleId, email, name, picture } = payload;

  if (!email) {
    throw ApiError.badRequest('Google account does not have an email');
  }

  // Check if user already exists (by googleId or email)
  let user = await User.findOne({ $or: [{ googleId }, { email }] });

  if (user) {
    // Link googleId if user registered via email/password before
    if (!user.googleId) {
      user.googleId = googleId;
      await user.save();
    }
  } else {
    // Sanitize Google name into a valid username (no spaces, lowercase, alphanumeric + underscore)
    let baseUsername = (name || email.split('@')[0])
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .slice(0, 20);
    if (baseUsername.length < 3) baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');

    // Handle duplicate username by appending random suffix
    let username = baseUsername;
    let exists = await User.findOne({ username });
    while (exists) {
      username = `${baseUsername}_${Math.random().toString(36).substring(2, 6)}`;
      exists = await User.findOne({ username });
    }

    // Create a new user from Google profile
    user = await User.create({
      username,
      email,
      googleId,
      role,
      isVerified: true, // Google-verified emails are trusted
    });
  }

  const token = generateToken(user._id, user.role, user.email);
  const refreshToken = generateRefreshToken(user._id);

  return { user, token, refreshToken };
};

/**
 * Refresh access token
 * @param {string} refreshToken
 * @returns {Promise<Object>}
 */
const refreshTokens = async (refreshTokenStr) => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) throw new Error('JWT_REFRESH_SECRET environment variable is required');
    
    const decoded = jwt.verify(refreshTokenStr, secret);
    const user = await User.findById(decoded.sub);
    
    if (!user) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    
    const token = generateToken(user._id, user.role, user.email);
    const refreshToken = generateRefreshToken(user._id);
    
    return { user, token, refreshToken };
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    throw error;
  }
};

module.exports = {
  register,
  login,
  googleLogin,
  generateToken,
  generateRefreshToken,
  refreshTokens
};
