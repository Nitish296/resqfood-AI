const Notification = require('../models/Notification');
const User = require('../models/User');
const { ROLES } = require('../utils/constants');

let io = null;

const setIO = (ioInstance) => {
  io = ioInstance;
};

const getIO = () => io;

/**
 * Create a new notification
 * @param {string} userId
 * @param {string} message
 * @param {string} type
 * @param {string} entityType
 * @param {string} entityId
 * @returns {Promise<Object>}
 */
const createNotification = async (userId, message, type, entityType, entityId) => {
  const notification = await Notification.create({
    userId,
    message,
    type,
    entityType,
    entityId
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }

  return notification;
};

/**
 * Notify nearby NGOs about a new donation
 * @param {Object} location - { lat, lng }
 * @param {string} message
 * @param {string} entityType
 * @param {string} entityId
 * @param {number} radiusKm
 */
const notifyNearbyNGOs = async (location, message, entityType, entityId, radiusKm = 50) => {
  const maxDistance = radiusKm * 1000;
  
  const ngos = await User.find({
    role: ROLES.NGO,
    'location.coordinates': {
      $nearSphere: {
        $geometry: {
          type: 'Point',
          coordinates: [location.lng, location.lat]
        },
        $maxDistance: maxDistance
      }
    }
  });

  const promises = ngos.map(ngo => 
    createNotification(ngo._id, message, 'NEW_DONATION', entityType, entityId)
  );

  await Promise.all(promises);
};

/**
 * Get notifications for a user
 * @param {string} userId
 * @returns {Promise<Array>}
 */
const getUserNotifications = async (userId) => {
  return Notification.find({ userId, isRead: false }).sort({ createdAt: -1 });
};

/**
 * Mark a notification as read
 * @param {string} notificationId
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const markAsRead = async (notificationId, userId) => {
  return Notification.findOneAndUpdate(
    { _id: notificationId, userId },
    { isRead: true },
    { returnDocument: 'after' }
  );
};

module.exports = {
  setIO,
  getIO,
  createNotification,
  notifyNearbyNGOs,
  getUserNotifications,
  markAsRead
};
