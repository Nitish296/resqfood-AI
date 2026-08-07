const donationService = require('../services/donation.service');
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const { NOTIFICATION_TYPE, ENTITY_TYPE } = require('../utils/constants');

/**
 * Create a new donation
 */
const createDonation = async (req, res) => {
  const donation = await donationService.createDonation(req.user.id, req.body);
  
  // Optionally notify nearby NGOs
  // notificationService.notifyNearbyNGOs({lat: req.body.pickupLocation.latitude, lng: req.body.pickupLocation.longitude}, 'New donation available nearby', NOTIFICATION_TYPE.DONATION, ENTITY_TYPE.DONATION, donation._id);

  ApiResponse.created(res, 'Donation created successfully', { donationId: donation._id });
};

/**
 * Get donations for the logged in donor
 */
const getDonorDonations = async (req, res) => {
  const donations = await donationService.getDonorDonations(req.user.id, req.query.status);
  ApiResponse.success(res, 'Donations retrieved successfully', donations);
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
  const { latitude, longitude, radius, foodType } = req.query;
  const donations = await donationService.getAvailableDonations(
    parseFloat(latitude),
    parseFloat(longitude),
    radius ? parseFloat(radius) : undefined,
    foodType
  );
  ApiResponse.success(res, 'Available donations retrieved successfully', donations);
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

module.exports = {
  createDonation,
  getDonorDonations,
  getDonationById,
  getAvailableDonations,
  acceptDonation
};
