/**
 * @fileoverview Integration tests for Admin endpoints
 * @description Tests admin user management, verification, and donation oversight
 */

const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestDonation } = require('../setup');

describe('Admin API', () => {
  let adminToken;
  let donorToken;

  beforeEach(async () => {
    const admin = await createTestUser({ role: 'Admin' });
    adminToken = admin.token;

    const donor = await createTestUser({ role: 'Donor' });
    donorToken = donor.token;
  });

  // ============================================================
  // GET /api/admin/users
  // ============================================================
  describe('GET /api/admin/users', () => {
    it('should return all users for admin', async () => {
      // Admin + donor already created in beforeEach
      await createTestUser({ role: 'NGO' });

      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by role', async () => {
      await createTestUser({ role: 'NGO' });
      await createTestUser({ role: 'Volunteer' });

      const res = await request(app)
        .get('/api/admin/users?role=NGO')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((u) => u.role === 'NGO')).toBe(true);
    });

    it('should filter by isVerified', async () => {
      await createTestUser({ role: 'NGO', isVerified: false });

      const res = await request(app)
        .get('/api/admin/users?isVerified=false')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((u) => u.isVerified === false)).toBe(true);
    });

    it('should fail for non-admin', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(403);
    });
  });

  // ============================================================
  // PUT /api/admin/users/:id/verify
  // ============================================================
  describe('PUT /api/admin/users/:id/verify', () => {
    it('should verify user', async () => {
      const { user } = await createTestUser({
        role: 'NGO',
        isVerified: false,
      });

      const res = await request(app)
        .put(`/api/admin/users/${user._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail for non-admin', async () => {
      const { user } = await createTestUser({ role: 'NGO' });

      await request(app)
        .put(`/api/admin/users/${user._id}/verify`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(403);
    });

    it('should fail with non-existent user ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .put(`/api/admin/users/${fakeId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================================
  // GET /api/admin/donations
  // ============================================================
  describe('GET /api/admin/donations', () => {
    it('should return all donations', async () => {
      const { user: donor } = await createTestUser({ role: 'Donor' });
      await createTestDonation(donor._id);
      await createTestDonation(donor._id);

      const res = await request(app)
        .get('/api/admin/donations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    it('should filter by status', async () => {
      const { user: donor } = await createTestUser({ role: 'Donor' });
      await createTestDonation(donor._id, { status: 'Pending' });
      await createTestDonation(donor._id, { status: 'Delivered' });

      const res = await request(app)
        .get('/api/admin/donations?status=Delivered')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].status).toBe('Delivered');
    });

    it('should fail for non-admin', async () => {
      await request(app)
        .get('/api/admin/donations')
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(403);
    });
  });
});
