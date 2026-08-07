/**
 * @fileoverview Integration tests for Donation endpoints
 * @description Tests donation CRUD, geospatial matching, and NGO acceptance
 */

const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestDonation } = require('../setup');

describe('Donation API', () => {
  let donorToken, donorUser;
  let ngoToken, ngoUser;

  beforeEach(async () => {
    const donor = await createTestUser({ role: 'Donor' });
    donorToken = donor.token;
    donorUser = donor.user;

    const ngo = await createTestUser({
      role: 'NGO',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    });
    ngoToken = ngo.token;
    ngoUser = ngo.user;
  });

  const validDonation = {
    foodType: 'Cooked Meals',
    quantity: 25,
    unit: 'meals',
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    pickupLocation: {
      address: '100 MG Road, Bangalore',
      latitude: 12.9716,
      longitude: 77.5946,
    },
    photoUrl: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
  };

  // ============================================================
  // POST /api/donations
  // ============================================================
  describe('POST /api/donations', () => {
    it('should create donation with valid data (Donor)', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send(validDonation)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('donationId');
    });

    it('should fail for NGO role', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${ngoToken}`)
        .send(validDonation)
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    it('should fail without auth token', async () => {
      await request(app)
        .post('/api/donations')
        .send(validDonation)
        .expect(401);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ foodType: 'Test' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with past expiryTime', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({
          ...validDonation,
          expiryTime: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
        })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid quantity', async () => {
      const res = await request(app)
        .post('/api/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .send({ ...validDonation, quantity: -5 })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/donations/donor
  // ============================================================
  describe('GET /api/donations/donor', () => {
    it('should return donor donations', async () => {
      await createTestDonation(donorUser._id);
      await createTestDonation(donorUser._id);

      const res = await request(app)
        .get('/api/donations/donor')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      await createTestDonation(donorUser._id, { status: 'Pending' });
      await createTestDonation(donorUser._id, { status: 'Delivered' });

      const res = await request(app)
        .get('/api/donations/donor?status=Pending')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
    });

    it('should return empty array for new donor', async () => {
      const res = await request(app)
        .get('/api/donations/donor')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });

  // ============================================================
  // GET /api/donations/:id
  // ============================================================
  describe('GET /api/donations/:id', () => {
    it('should return donation details', async () => {
      const donation = await createTestDonation(donorUser._id);

      const res = await request(app)
        .get(`/api/donations/${donation._id}`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('foodType', 'Cooked Meals');
    });

    it('should fail with non-existent ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/donations/${fakeId}`)
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with invalid ID format', async () => {
      const res = await request(app)
        .get('/api/donations/invalidid')
        .set('Authorization', `Bearer ${donorToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================================
  // GET /api/donations/available (NGO)
  // ============================================================
  describe('GET /api/donations/available', () => {
    it('should return nearby pending donations', async () => {
      // Create donation near Bangalore
      await createTestDonation(donorUser._id, {
        pickupLocation: {
          address: 'Near Bangalore',
          type: 'Point',
          coordinates: [77.6000, 12.9750],
        },
      });

      const res = await request(app)
        .get('/api/donations/available?latitude=12.9716&longitude=77.5946&radius=10')
        .set('Authorization', `Bearer ${ngoToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should not return already accepted donations', async () => {
      await createTestDonation(donorUser._id, { status: 'Accepted' });

      const res = await request(app)
        .get('/api/donations/available?latitude=12.9716&longitude=77.5946&radius=50')
        .set('Authorization', `Bearer ${ngoToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(0);
    });

    it('should fail without latitude/longitude', async () => {
      const res = await request(app)
        .get('/api/donations/available')
        .set('Authorization', `Bearer ${ngoToken}`)
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // POST /api/donations/:id/accept (NGO)
  // ============================================================
  describe('POST /api/donations/:id/accept', () => {
    it('should accept a pending donation', async () => {
      const donation = await createTestDonation(donorUser._id);

      const res = await request(app)
        .post(`/api/donations/${donation._id}/accept`)
        .set('Authorization', `Bearer ${ngoToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('requestId');
    });

    it('should fail if donation already accepted', async () => {
      const donation = await createTestDonation(donorUser._id);

      // First acceptance
      await request(app)
        .post(`/api/donations/${donation._id}/accept`)
        .set('Authorization', `Bearer ${ngoToken}`);

      // Second acceptance
      const res = await request(app)
        .post(`/api/donations/${donation._id}/accept`)
        .set('Authorization', `Bearer ${ngoToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail for Donor role', async () => {
      const donation = await createTestDonation(donorUser._id);

      const res = await request(app)
        .post(`/api/donations/${donation._id}/accept`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});
