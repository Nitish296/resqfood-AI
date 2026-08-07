const notificationService = require('../services/notification.service');
const ApiResponse = require('../utils/ApiResponse');
const ApiError = require('../utils/ApiError');

/**
 * Get notifications for current user
 */
const getMyNotifications = async (req, res) => {
  const notifications = await notificationService.getUserNotifications(req.user.id);
  ApiResponse.success(res, 'Notifications retrieved successfully', notifications);
};

/**
 * Mark a notification as read
 */
const markNotificationRead = async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }
  ApiResponse.success(res, 'Notification marked as read', notification);
};

module.exports = {
  getMyNotifications,
  markNotificationRead
};
