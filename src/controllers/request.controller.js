const requestService = require('../services/request.service');
const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const { NOTIFICATION_TYPE, ENTITY_TYPE } = require('../utils/constants');

/**
 * Get available requests for volunteers
 */
const getAvailableRequests = async (req, res) => {
  const { latitude, longitude, radius, page, limit } = req.query;
  const result = await requestService.getAvailableRequests(
    parseFloat(latitude),
    parseFloat(longitude),
    radius ? parseFloat(radius) : undefined,
    page,
    limit
  );
  res.status(200).json({ success: true, message: 'Available requests retrieved successfully', data: result.data, pagination: result.pagination });
};

/**
 * Get requests assigned to or accepted by the NGO
 */
const getNgoRequests = async (req, res) => {
  const { page, limit } = req.query;
  const result = await requestService.getNgoRequests(req.user.id, page, limit);
  res.status(200).json({ success: true, message: 'Requests retrieved successfully', data: result.data, pagination: result.pagination });
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

/**
 * Cancel request by NGO
 */
const cancelRequest = async (req, res) => {
  const request = await requestService.cancelRequest(req.params.id, req.user.id);
  ApiResponse.success(res, 'Request cancelled successfully', request);
};

module.exports = {
  getAvailableRequests,
  getNgoRequests,
  assignVolunteer,
  markPickedUp,
  markDelivered,
  cancelRequest
};
