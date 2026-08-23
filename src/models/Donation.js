/**
 * @file Donation.js
 * @description Mongoose model for food donations.
 */

const mongoose = require('mongoose');
const { DONATION_STATUS, UNITS } = require('../utils/constants');

const donationSchema = new mongoose.Schema({
  donorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  foodType: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 0.1
  },
  unit: {
    type: String,
    enum: Object.values(UNITS),
    required: true
  },
  expiryTime: {
    type: Date,
    required: true,
    index: true
  },
  pickupLocation: {
    address: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      index: '2dsphere'
    }
  },
  photoUrl: {
    type: String
  },
  imageUrl: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: Object.values(DONATION_STATUS),
    default: DONATION_STATUS.PENDING,
    index: true
  },
  acceptedByNgoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

donationSchema.index({ status: 1, expiryTime: 1 });

module.exports = mongoose.model('Donation', donationSchema);
