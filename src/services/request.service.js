const Request = require('../models/Request');
const Donation = require('../models/Donation');
const ApiError = require('../utils/ApiError');
const { REQUEST_STATUS, DONATION_STATUS } = require('../utils/constants');

/**
 * Get available requests near a location.
 * Uses a two-step query: first finds nearby donations, then finds matching requests.
 * (Cannot use $nearSphere inside populate.match — MongoDB doesn't support geo operators in populated sub-queries)
 * @param {number} lat
 * @param {number} lng
 * @param {number} radiusKm
 * @returns {Promise<Array>}
 */
const getAvailableRequests = async (lat, lng, radiusKm = 10) => {
  // Step 1: Find nearby donation IDs with accepted status (via their linked requests)
  const nearbyDonations = await Donation.find({
    'pickupLocation.coordinates': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat]
        },
        $maxDistance: radiusKm * 1000
      }
    }
  }).select('_id');

  const nearbyDonationIds = nearbyDonations.map(d => d._id);

  if (nearbyDonationIds.length === 0) {
    return [];
  }

  // Step 2: Find unassigned requests for those nearby donations
  const requests = await Request.find({
    status: REQUEST_STATUS.ACCEPTED,
    donationId: { $in: nearbyDonationIds }
  })
    .populate('donationId')
    .populate('ngoId', 'username organizationName contactNumber address');

  return requests;
};

/**
 * Get requests for an NGO
 * @param {string} ngoId
 * @returns {Promise<Array>}
 */
const getNgoRequests = async (ngoId) => {
  return Request.find({ ngoId })
    .populate('donationId')
    .populate('volunteerId', 'username contactNumber');
};

/**
 * Assign a volunteer to a request (atomic — prevents double-assignment)
 * @param {string} requestId
 * @param {string} volunteerId
 * @returns {Promise<Object>}
 */
const assignVolunteer = async (requestId, volunteerId) => {
  // Atomic: only succeeds if status is still ACCEPTED (no volunteer yet)
  const request = await Request.findOneAndUpdate(
    { _id: requestId, status: REQUEST_STATUS.ACCEPTED },
    {
      status: REQUEST_STATUS.ASSIGNED,
      volunteerId,
      'statusTimestamps.assignedAt': new Date()
    },
    { returnDocument: 'after' }
  );

  if (!request) {
    const exists = await Request.findById(requestId);
    if (!exists) throw ApiError.notFound('Request not found');
    throw ApiError.badRequest('Request is not available for assignment');
  }

  return request;
};

/**
 * Mark a request as picked up
 * @param {string} requestId
 * @param {string} volunteerId
 * @returns {Promise<Object>}
 */
const markPickedUp = async (requestId, volunteerId) => {
  const request = await Request.findById(requestId);
  if (!request) {
    throw ApiError.notFound('Request not found');
  }

  // Null safety: check volunteerId exists before comparing
  if (
    request.status !== REQUEST_STATUS.ASSIGNED ||
    !request.volunteerId ||
    request.volunteerId.toString() !== volunteerId
  ) {
    throw ApiError.badRequest('Invalid request or not assigned to you');
  }

  request.status = REQUEST_STATUS.PICKED_UP;
  request.statusTimestamps.pickedUpAt = new Date();
  await request.save();

  await Donation.findByIdAndUpdate(request.donationId, { status: DONATION_STATUS.PICKED_UP });

  return request;
};

/**
 * Mark a request as delivered
 * @param {string} requestId
 * @param {string} volunteerId
 * @returns {Promise<Object>}
 */
const markDelivered = async (requestId, volunteerId) => {
  const request = await Request.findById(requestId);
  if (!request) {
    throw ApiError.notFound('Request not found');
  }

  // Null safety: check volunteerId exists before comparing
  if (
    request.status !== REQUEST_STATUS.PICKED_UP ||
    !request.volunteerId ||
    request.volunteerId.toString() !== volunteerId
  ) {
    throw ApiError.badRequest('Invalid request or not picked up yet');
  }

  request.status = REQUEST_STATUS.DELIVERED;
  request.statusTimestamps.deliveredAt = new Date();
  await request.save();

  await Donation.findByIdAndUpdate(request.donationId, { status: DONATION_STATUS.DELIVERED });

  return request;
};

module.exports = {
  getAvailableRequests,
  getNgoRequests,
  assignVolunteer,
  markPickedUp,
  markDelivered
};
