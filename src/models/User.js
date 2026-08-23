/**
 * @file User.js
 * @description Mongoose model for users (Donors, NGOs, Volunteers, Admins).
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
  },
  passwordHash: {
    type: String,
    required: false // Optional for Google OAuth users
  },
  googleId: {
    type: String,
    sparse: true
  },
  role: {
    type: String,
    enum: Object.values(ROLES),
    required: true
  },
  organizationName: {
    type: String
  },
  location: {
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
  contactNumber: {
    type: String
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function (doc, ret) {
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    }
  }
});

// Pre-save hook for hashing password (Mongoose 9.x async pattern - no next())
userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  const salt = await bcrypt.genSalt(12);
  this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Instance method for password comparison
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email });
};

module.exports = mongoose.model('User', userSchema);
