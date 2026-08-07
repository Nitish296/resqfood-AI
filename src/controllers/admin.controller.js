const User = require('../models/User');
const Donation = require('../models/Donation');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  const { role, isVerified } = req.query;
  const filter = {};
  
  if (role) filter.role = role;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  
  const users = await User.find(filter).select('-passwordHash');
  ApiResponse.success(res, 'Users retrieved successfully', users);
};

/**
 * Verify a user (like an NGO)
 */
const verifyUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isVerified: true },
    { returnDocument: 'after' }
  ).select('-passwordHash');
  
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  ApiResponse.success(res, 'User verified successfully', user);
};

/**
 * Get all donations
 */
const getAllDonations = async (req, res) => {
  const { status, donorId, ngoId } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (donorId) filter.donorId = donorId;
  if (ngoId) filter.acceptedByNgoId = ngoId;
  
  const donations = await Donation.find(filter)
    .populate('donorId', 'username email organizationName')
    .populate('acceptedByNgoId', 'username email organizationName');
    
  ApiResponse.success(res, 'Donations retrieved successfully', donations);
};

module.exports = {
  getAllUsers,
  verifyUser,
  getAllDonations
};
