/**
 * @file Request.js
 * @description Mongoose model for tracking accepted donations.
 */

const mongoose = require('mongoose');
const { REQUEST_STATUS } = require('../utils/constants');

const requestSchema = new mongoose.Schema({
  donationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Donation',
    required: true,
    unique: true
  },
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  volunteerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  status: {
    type: String,
    enum: Object.values(REQUEST_STATUS),
    default: REQUEST_STATUS.ACCEPTED,
    index: true
  },
  statusTimestamps: {
    acceptedAt: {
      type: Date,
      default: Date.now
    },
    assignedAt: {
      type: Date
    },
    pickedUpAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    }
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Request', requestSchema);
