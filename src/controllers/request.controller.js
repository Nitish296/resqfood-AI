const requestService = require('../services/request.service');
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const { NOTIFICATION_TYPE, ENTITY_TYPE } = require('../utils/constants');

/**
 * Get available requests for volunteers
 */
const getAvailableRequests = async (req, res) => {
  const { latitude, longitude, radius } = req.query;
  const requests = await requestService.getAvailableRequests(
    parseFloat(latitude),
    parseFloat(longitude),
    radius ? parseFloat(radius) : undefined
  );
  ApiResponse.success(res, 'Available requests retrieved successfully', requests);
};

/**
 * Get requests assigned to or accepted by the NGO
 */
const getNgoRequests = async (req, res) => {
  const requests = await requestService.getNgoRequests(req.user.id);
  ApiResponse.success(res, 'Requests retrieved successfully', requests);
};

/**
 * Assign volunteer to request
 */
const assignVolunteer = async (req, res) => {
  const request = await requestService.assignVolunteer(req.params.id, req.user.id);
  
  await notificationService.createNotification(
    request.ngoId,
    'A volunteer has been assigned to your request',
    NOTIFICATION_TYPE.UPDATE,
    ENTITY_TYPE.REQUEST,
    request._id
  );

  ApiResponse.success(res, 'Volunteer assigned successfully', request);
};

/**
 * Mark request as picked up
 */
const markPickedUp = async (req, res) => {
  const request = await requestService.markPickedUp(req.params.id, req.user.id);
  
  await notificationService.createNotification(
    request.ngoId,
    'The volunteer has picked up the donation',
    NOTIFICATION_TYPE.UPDATE,
    ENTITY_TYPE.REQUEST,
    request._id
  );

  ApiResponse.success(res, 'Request marked as picked up', request);
};

/**
 * Mark request as delivered
 */
const markDelivered = async (req, res) => {
  const request = await requestService.markDelivered(req.params.id, req.user.id);
  
  await notificationService.createNotification(
    request.ngoId,
    'The volunteer has delivered the donation',
    NOTIFICATION_TYPE.UPDATE,
    ENTITY_TYPE.REQUEST,
    request._id
  );

  ApiResponse.success(res, 'Request marked as delivered', request);
};

module.exports = {
  getAvailableRequests,
  getNgoRequests,
  assignVolunteer,
  markPickedUp,
  markDelivered
};
