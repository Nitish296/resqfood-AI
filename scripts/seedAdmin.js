require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { connectDB } = require('../src/config/db');
const User = require('../src/models/User');

const ADMIN_DATA = {
  username: process.env.ADMIN_USERNAME || 'admin',
  email: process.env.ADMIN_EMAIL || 'admin@resqfood.com',
  passwordHash: process.env.ADMIN_PASSWORD || 'Admin@123456',
  role: 'Admin',
  isVerified: true,
  organizationName: 'ResQFood AI Platform',
};

const seedAdmin = async () => {
  try {
    await connectDB();
    console.log('[Seed] Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'Admin' });
    if (existingAdmin) {
      console.log('[Seed] Admin user already exists:');
      console.log(`  Email: ${existingAdmin.email}`);
      console.log(`  Username: ${existingAdmin.username}`);
      await mongoose.connection.close();
      process.exit(0);
    }

    // Create admin user (password will be hashed by pre-save hook)
    const admin = await User.create(ADMIN_DATA);
    console.log('[Seed] Admin user created successfully:');
    console.log(`  ID: ${admin._id}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Username: ${admin.username}`);
    console.log(`  Role: ${admin.role}`);

    await mongoose.connection.close();
    console.log('[Seed] Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('[Seed] Error:', error.message);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedAdmin();
