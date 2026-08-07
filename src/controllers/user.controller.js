const User = require('../models/User');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Get current user
 */
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id).select('-passwordHash');
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  ApiResponse.success(res, 'User retrieved successfully', user);
};

/**
 * Update current user
 */
const updateMe = async (req, res) => {
  const { username, organizationName, contactNumber, location } = req.body;
  const updates = {};
  
  if (username) updates.username = username;
  if (organizationName) updates.organizationName = organizationName;
  if (contactNumber) updates.contactNumber = contactNumber;
  if (location && location.latitude && location.longitude) {
    updates.location = {
      type: 'Point',
      coordinates: [location.longitude, location.latitude]
    };
  }

  const user = await User.findByIdAndUpdate(req.user.id, updates, { returnDocument: 'after', runValidators: true }).select('-passwordHash');
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  ApiResponse.success(res, 'User updated successfully', user);
};

module.exports = {
  getMe,
  updateMe
};
