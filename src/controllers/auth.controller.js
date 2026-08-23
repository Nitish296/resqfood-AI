const authService = require('../services/auth.service');
const ApiResponse = require('../utils/ApiResponse');

/**
 * Register user
 */
const register = async (req, res) => {
  const { username, email, password, role, location } = req.body;

  // Build user data - map 'password' to 'passwordHash' for the User model
  const userData = { username, email, passwordHash: password, role };

  // Convert location from { latitude, longitude } to GeoJSON Point
  if (location && location.latitude && location.longitude) {
    userData.location = {
      type: 'Point',
      coordinates: [parseFloat(location.longitude), parseFloat(location.latitude)],
    };
  }

  const result = await authService.register(userData);
  
  ApiResponse.created(res, 'User registered successfully', {
    userId: result.user._id,
    token: result.token,
    refreshToken: result.refreshToken
  });
};

/**
 * Login user
 */
const login = async (req, res) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  
  ApiResponse.success(res, 'Login successful', {
    userId: result.user._id,
    role: result.user.role,
    token: result.token,
    refreshToken: result.refreshToken
  });
};

/**
 * Google OAuth Login
 */
const googleLogin = async (req, res) => {
  const { idToken, role } = req.body;
  const result = await authService.googleLogin(idToken, role);

  ApiResponse.success(res, 'Google login successful', {
    userId: result.user._id,
    role: result.user.role,
    token: result.token,
    refreshToken: result.refreshToken
  });
};

/**
 * Refresh token
 */
const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshTokens(refreshToken);
  
  ApiResponse.success(res, 'Token refreshed', {
    token: result.token,
    refreshToken: result.refreshToken
  });
};

module.exports = {
  register,
  login,
  googleLogin,
  refreshToken
};
