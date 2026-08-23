const donationService = require('../services/donation.service');
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const { NOTIFICATION_TYPE, ENTITY_TYPE } = require('../utils/constants');

/**
 * Create a new donation
 */
const createDonation = async (req, res) => {
  const donationData = { ...req.body };
  if (req.file) {
    donationData.imageUrl = req.file.path;
  }
  const donation = await donationService.createDonation(req.user.id, donationData);
  
  // Optionally notify nearby NGOs
  // notificationService.notifyNearbyNGOs({lat: req.body.pickupLocation.latitude, lng: req.body.pickupLocation.longitude}, 'New donation available nearby', NOTIFICATION_TYPE.DONATION, ENTITY_TYPE.DONATION, donation._id);

  ApiResponse.created(res, 'Donation created successfully', { donationId: donation._id });
};

/**
 * Get donations for the logged in donor
 */
const getDonorDonations = async (req, res) => {
  const { status, page, limit } = req.query;
  const result = await donationService.getDonorDonations(req.user.id, status, page, limit);
  res.status(200).json({ success: true, message: 'Donations retrieved successfully', data: result.data, pagination: result.pagination });
};

/**
 * Get donation by ID
 */
const getDonationById = async (req, res) => {
  const donation = await donationService.getDonationById(req.params.id);
  ApiResponse.success(res, 'Donation retrieved successfully', donation);
};

/**
 * Get available donations near location
 */
const getAvailableDonations = async (req, res) => {
  const { latitude, longitude, radius, foodType, page, limit } = req.query;
  const result = await donationService.getAvailableDonations(
    parseFloat(latitude),
    parseFloat(longitude),
    radius ? parseFloat(radius) : undefined,
    foodType,
    page,
    limit
  );
  res.status(200).json({ success: true, message: 'Available donations retrieved successfully', data: result.data, pagination: result.pagination });
};

/**
 * Accept a donation
 */
const acceptDonation = async (req, res) => {
  const { donation, request } = await donationService.acceptDonation(req.params.id, req.user.id);
  
  await notificationService.createNotification(
    donation.donorId,
    'Your donation has been accepted by an NGO',
    NOTIFICATION_TYPE.UPDATE,
    ENTITY_TYPE.DONATION,
    donation._id
  );

  ApiResponse.success(res, 'Donation accepted successfully', { requestId: request._id });
};

/**
 * Cancel a donation
 */
const cancelDonation = async (req, res) => {
  const donation = await donationService.cancelDonation(req.params.id, req.user.id);
  ApiResponse.success(res, 'Donation cancelled successfully', donation);
};

module.exports = {
  createDonation,
  getDonorDonations,
  getDonationById,
  getAvailableDonations,
  acceptDonation,
  cancelDonation
};
