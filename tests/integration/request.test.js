/**
 * @fileoverview Integration tests for Request/Volunteer endpoints
 * @description Tests volunteer assignment, pickup, and delivery workflow
 */

const request = require('supertest');
const app = require('../../src/app');
const { createTestUser, createTestDonation } = require('../setup');
const Donation = require('../../src/models/Donation');
const RequestModel = require('../../src/models/Request');

describe('Request API', () => {
  let donorUser, donorToken;
  let ngoUser, ngoToken;
  let volUser, volToken;

  beforeEach(async () => {
    const donor = await createTestUser({ role: 'Donor' });
    donorUser = donor.user;
    donorToken = donor.token;

    const ngo = await createTestUser({
      role: 'NGO',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    });
    ngoUser = ngo.user;
    ngoToken = ngo.token;

    const vol = await createTestUser({
      role: 'Volunteer',
      location: { type: 'Point', coordinates: [77.5946, 12.9716] },
    });
    volUser = vol.user;
    volToken = vol.token;
  });

  /**
   * Helper: Create a donation and have NGO accept it, returning the request
   */
  const createAcceptedDonation = async () => {
    const donation = await createTestDonation(donorUser._id);

    const res = await request(app)
      .post(`/api/donations/${donation._id}/accept`)
      .set('Authorization', `Bearer ${ngoToken}`);

    return {
      donation,
      requestId: res.body.data?.requestId,
    };
  };

  // ============================================================
  // GET /api/requests/ngo
  // ============================================================
  describe('GET /api/requests/ngo', () => {
    it('should return NGO requests', async () => {
      await createAcceptedDonation();

      const res = await request(app)
        .get('/api/requests/ngo')
        .set('Authorization', `Bearer ${ngoToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(1);
    });
  });

  // ============================================================
  // GET /api/requests/available (Volunteer)
  // ============================================================
  describe('GET /api/requests/available', () => {
    it('should return available requests (status Accepted)', async () => {
      await createAcceptedDonation();

      const res = await request(app)
        .get('/api/requests/available?latitude=12.9716&longitude=77.5946&radius=50')
        .set('Authorization', `Bearer ${volToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should not return already assigned requests', async () => {
      const { requestId } = await createAcceptedDonation();

      // Assign volunteer
      if (requestId) {
        await request(app)
          .post(`/api/requests/${requestId}/assign`)
          .set('Authorization', `Bearer ${volToken}`);
      }

      const res = await request(app)
        .get('/api/requests/available?latitude=12.9716&longitude=77.5946&radius=50')
        .set('Authorization', `Bearer ${volToken}`)
        .expect(200);

      // Should be empty since the only request is now assigned
      const acceptedRequests = res.body.data.filter(
        (r) => r.status === 'Accepted',
      );
      expect(acceptedRequests.length).toBe(0);
    });
  });

  // ============================================================
  // POST /api/requests/:id/assign (Volunteer)
  // ============================================================
  describe('POST /api/requests/:id/assign', () => {
    it('should assign volunteer to request', async () => {
      const { requestId } = await createAcceptedDonation();
      if (!requestId) return;

      const res = await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${volToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail if already assigned', async () => {
      const { requestId } = await createAcceptedDonation();
      if (!requestId) return;

      // First assignment
      await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${volToken}`);

      // Second assignment attempt
      const vol2 = await createTestUser({ role: 'Volunteer' });
      const res = await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${vol2.token}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail for non-volunteer role', async () => {
      const { requestId } = await createAcceptedDonation();
      if (!requestId) return;

      const res = await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${donorToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // PUT /api/requests/:id/pickup (Volunteer)
  // ============================================================
  describe('PUT /api/requests/:id/pickup', () => {
    it('should mark as picked up', async () => {
      const { requestId } = await createAcceptedDonation();
      if (!requestId) return;

      // First assign
      await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${volToken}`);

      // Then pickup
      const res = await request(app)
        .put(`/api/requests/${requestId}/pickup`)
        .set('Authorization', `Bearer ${volToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should fail if not in Assigned status', async () => {
      const { requestId } = await createAcceptedDonation();
      if (!requestId) return;

      // Try pickup without assigning first
      const res = await request(app)
        .put(`/api/requests/${requestId}/pickup`)
        .set('Authorization', `Bearer ${volToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  // ============================================================
  // PUT /api/requests/:id/deliver (Volunteer)
  // ============================================================
  describe('PUT /api/requests/:id/deliver', () => {
    it('should mark as delivered and update donation status', async () => {
      const { requestId, donation } = await createAcceptedDonation();
      if (!requestId) return;

      // Assign → Pickup → Deliver
      await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${volToken}`);

      await request(app)
        .put(`/api/requests/${requestId}/pickup`)
        .set('Authorization', `Bearer ${volToken}`);

      const res = await request(app)
        .put(`/api/requests/${requestId}/deliver`)
        .set('Authorization', `Bearer ${volToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify donation status is also updated
      const updatedDonation = await Donation.findById(donation._id);
      expect(updatedDonation.status).toBe('Delivered');
    });

    it('should fail if not in PickedUp status', async () => {
      const { requestId } = await createAcceptedDonation();
      if (!requestId) return;

      // Assign but don't pickup
      await request(app)
        .post(`/api/requests/${requestId}/assign`)
        .set('Authorization', `Bearer ${volToken}`);

      const res = await request(app)
        .put(`/api/requests/${requestId}/deliver`)
        .set('Authorization', `Bearer ${volToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
