/**
 * @fileoverview Test environment setup using mongodb-memory-server
 * @description Provides in-memory MongoDB instance for test isolation
 * and helper functions for creating test data.
 */

// Set test environment variables BEFORE requiring any modules
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only-min-256-bit';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Start in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Clear all collections after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// Disconnect and stop server after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ============================================================
// Test Helper Functions
// ============================================================

const User = require('../src/models/User');
const { generateToken } = require('../src/services/auth.service');

/**
 * Create a test user and return the user object with auth token
 * @param {Object} overrides - Override default user data
 * @returns {Promise<{user: Object, token: string}>}
 */
const createTestUser = async (overrides = {}) => {
  const timestamp = Date.now() + Math.random().toString(36).substring(2, 8);
  const defaultData = {
    username: `testuser_${timestamp}`,
    email: `test_${timestamp}@example.com`,
    passwordHash: 'Test@12345',
    role: 'Donor',
    isVerified: true,
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore [lng, lat]
    },
    ...overrides,
  };

  const user = await User.create(defaultData);
  const token = generateToken(user._id.toString(), user.role, user.email);
  return { user, token };
};

/**
 * Create a test donation directly in the database
 * @param {string} donorId - Donor's user ID
 * @param {Object} overrides - Override default donation data
 * @returns {Promise<Object>} Created donation document
 */
const createTestDonation = async (donorId, overrides = {}) => {
  const Donation = require('../src/models/Donation');
  const defaultData = {
    donorId,
    foodType: 'Cooked Meals',
    description: 'Test donation',
    quantity: 10,
    unit: 'meals',
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h from now
    pickupLocation: {
      address: '123 Test Street, Bangalore',
      type: 'Point',
      coordinates: [77.5946, 12.9716], // Bangalore [lng, lat]
    },
    status: 'Pending',
    ...overrides,
  };

  return await Donation.create(defaultData);
};

module.exports = { createTestUser, createTestDonation };
