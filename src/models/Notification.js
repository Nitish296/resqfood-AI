/**
 * @file Notification.js
 * @description Mongoose model for in-app notifications.
 */

const mongoose = require('mongoose');
const { NOTIFICATION_TYPE, ENTITY_TYPE } = require('../utils/constants');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: Object.values(NOTIFICATION_TYPE),
    default: NOTIFICATION_TYPE.UPDATE
  },
  entityType: {
    type: String,
    enum: Object.values(ENTITY_TYPE)
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
