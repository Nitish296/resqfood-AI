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
 * @returns {Promise<Array>}
 */
const getDonorDonations = async (donorId, statusFilter) => {
  const query = { donorId };
  if (statusFilter) {
    query.status = statusFilter;
  }
  return Donation.find(query).sort({ createdAt: -1 });
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
 * @returns {Promise<Array>}
 */
const getAvailableDonations = async (lat, lng, radiusKm = 10, foodType) => {
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

  return Donation.find(query).populate('donorId', 'username email organizationName contactNumber');
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

module.exports = {
  createDonation,
  getDonorDonations,
  getDonationById,
  getAvailableDonations,
  acceptDonation
};
