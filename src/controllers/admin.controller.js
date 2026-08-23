const User = require('../models/User');
const Donation = require('../models/Donation');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Get all users
 */
const getAllUsers = async (req, res) => {
  const { role, isVerified, page: queryPage, limit: queryLimit } = req.query;
  const filter = {};
  
  if (role) filter.role = role;
  if (isVerified !== undefined) filter.isVerified = isVerified === 'true';
  
  const page = parseInt(queryPage) || 1;
  const limit = parseInt(queryLimit) || 10;
  const skip = (page - 1) * limit;
  const total = await User.countDocuments(filter);
  const data = await User.find(filter).select('-passwordHash').skip(skip).limit(limit).sort({ createdAt: -1 });
  
  res.status(200).json({ success: true, message: 'Users retrieved successfully', data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
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
  const { status, donorId, ngoId, page: queryPage, limit: queryLimit } = req.query;
  const filter = {};
  
  if (status) filter.status = status;
  if (donorId) filter.donorId = donorId;
  if (ngoId) filter.acceptedByNgoId = ngoId;
  
  const page = parseInt(queryPage) || 1;
  const limit = parseInt(queryLimit) || 10;
  const skip = (page - 1) * limit;
  const total = await Donation.countDocuments(filter);
  const data = await Donation.find(filter)
    .populate('donorId', 'username email organizationName')
    .populate('acceptedByNgoId', 'username email organizationName')
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });
    
  res.status(200).json({ success: true, message: 'Donations retrieved successfully', data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
};

module.exports = {
  getAllUsers,
  verifyUser,
  getAllDonations
};
