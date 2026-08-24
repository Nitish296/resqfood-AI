const Donation = require('../models/Donation');
const Request = require('../models/Request');
const ApiError = require('../utils/ApiError');
const { DONATION_STATUS, REQUEST_STATUS } = require('../utils/constants');

/**
 * Create a new donation
 * @param {string} donorId
 * @param {Object} data
 * @returns {Promise<Object>}
 */
const createDonation = async (donorId, data) => {
  const donationData = {
    ...data,
    donorId,
    pickupLocation: {
      type: 'Point',
      coordinates: [data.pickupLocation.longitude, data.pickupLocation.latitude],
      address: data.pickupLocation.address
    }
  };

  const donation = await Donation.create(donationData);
  return donation;
};

/**
 * Get donations by donor ID
 * @param {string} donorId
 * @param {string} [statusFilter]
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<Object>}
 */
const getDonorDonations = async (donorId, statusFilter, page = 1, limit = 10) => {
  const query = { donorId };
  if (statusFilter) {
    query.status = statusFilter;
  }
  const skip = (page - 1) * limit;
  const total = await Donation.countDocuments(query);
  const data = await Donation.find(query).skip(skip).limit(limit).sort({ createdAt: -1 });
  return { data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
};

/**
 * Get donation by ID
 * @param {string} donationId
 * @returns {Promise<Object>}
 */
const getDonationById = async (donationId) => {
  const donation = await Donation.findById(donationId).populate('donorId', 'username email organizationName contactNumber');
  if (!donation) {
    throw ApiError.notFound('Donation not found');
  }
  return donation;
};

/**
 * Get available donations near a location
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @param {string} [foodType]
 * @param {number} [page=1]
 * @param {number} [limit=10]
 * @returns {Promise<Object>}
 */
const getAvailableDonations = async (lat, lng, radiusKm = 100, foodType, page = 1, limit = 10) => {
  const maxDistance = radiusKm * 1000;
  
  const query = {
    status: DONATION_STATUS.PENDING,
    expiryTime: { $gt: new Date() },
    'pickupLocation.coordinates': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: maxDistance
      }
    }
  };

  if (foodType) {
    query.foodType = { $regex: foodType, $options: 'i' };
  }

  const skip = (parseInt(page) || 1 - 1) * (parseInt(limit) || 10);
  const limitNum = parseInt(limit) || 10;
  const pageNum = parseInt(page) || 1;
  
  // $nearSphere doesn't support countDocuments, so we fetch and count
  const allDonations = await Donation.find(query).populate('donorId', 'username email organizationName contactNumber');
  const total = allDonations.length;
  const data = allDonations.slice((pageNum - 1) * limitNum, (pageNum - 1) * limitNum + limitNum);
  
  return { data, pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) } };
};

/**
 * Accept a donation by NGO
 * @param {string} donationId
 * @param {string} ngoId
 * @returns {Promise<Object>}
 */
const acceptDonation = async (donationId, ngoId) => {
  // Atomic update: only succeeds if status is still PENDING
  const donation = await Donation.findOneAndUpdate(
    { _id: donationId, status: DONATION_STATUS.PENDING },
    { status: DONATION_STATUS.ACCEPTED, acceptedByNgoId: ngoId },
    { returnDocument: 'after' }
  );

  if (!donation) {
    // Either not found or already accepted by another NGO
    const exists = await Donation.findById(donationId);
    if (!exists) throw ApiError.notFound('Donation not found');
    throw ApiError.badRequest('Donation is no longer available');
  }

  const request = await Request.create({
    donationId,
    ngoId,
    status: REQUEST_STATUS.ACCEPTED,
    statusTimestamps: {
      acceptedAt: new Date()
    }
  });

  return { donation, request };
};

/**
 * Cancel a donation by donor
 * @param {string} donationId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const cancelDonation = async (donationId, userId) => {
  const donation = await Donation.findById(donationId);
  if (!donation) {
    throw ApiError.notFound('Donation not found');
  }
  if (donation.donorId.toString() !== userId) {
    throw ApiError.forbidden('You can only cancel your own donations');
  }
  if (donation.status !== DONATION_STATUS.PENDING) {
    throw ApiError.badRequest('Only pending donations can be cancelled');
  }
  donation.status = DONATION_STATUS.CANCELLED;
  await donation.save();
  return donation;
};

module.exports = {
  createDonation,
  getDonorDonations,
  getDonationById,
  getAvailableDonations,
  acceptDonation,
  cancelDonation
};
