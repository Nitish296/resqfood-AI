/**
 * @fileoverview Integration tests for Notification endpoints
 * @description Tests notification retrieval and mark-as-read functionality
 */

const request = require('supertest');
const app = require('../../src/app');
const { createTestUser } = require('../setup');
const Notification = require('../../src/models/Notification');

describe('Notification API', () => {
  let userToken, userId;

  beforeEach(async () => {
    const { user, token } = await createTestUser();
    userToken = token;
    userId = user._id;
  });

  /**
   * Helper: Create test notifications directly in DB
   */
  const createTestNotification = async (overrides = {}) => {
    return await Notification.create({
      userId,
      message: 'Test notification',
      type: 'Update',
      entityType: 'Donation',
      isRead: false,
      ...overrides,
    });
  };

  // ============================================================
  // GET /api/notifications/me
  // ============================================================
  describe('GET /api/notifications/me', () => {
    it('should return unread notifications for current user', async () => {
      await createTestNotification({ message: 'Notification 1' });
      await createTestNotification({ message: 'Notification 2' });
      await createTestNotification({ message: 'Read one', isRead: true });

      const res = await request(app)
        .get('/api/notifications/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      // Should only return unread notifications
      expect(res.body.data.length).toBe(2);
    });

    it('should return empty array if no notifications', async () => {
      const res = await request(app)
        .get('/api/notifications/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data).toEqual([]);
    });

    it('should fail without auth', async () => {
      await request(app).get('/api/notifications/me').expect(401);
    });

    it('should not return other users notifications', async () => {
      const { user: otherUser } = await createTestUser();
      await createTestNotification({
        userId: otherUser._id,
        message: 'Other user notification',
      });
      await createTestNotification({ message: 'My notification' });

      const res = await request(app)
        .get('/api/notifications/me')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].message).toBe('My notification');
    });
  });

  // ============================================================
  // PUT /api/notifications/:id/read
  // ============================================================
  describe('PUT /api/notifications/:id/read', () => {
    it('should mark notification as read', async () => {
      const notification = await createTestNotification();

      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);

      // Verify in database
      const updated = await Notification.findById(notification._id);
      expect(updated.isRead).toBe(true);
    });

    it('should fail with non-existent notification ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      const res = await request(app)
        .put(`/api/notifications/${fakeId}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail for other users notification', async () => {
      const { user: otherUser, token: otherToken } = await createTestUser();
      const notification = await createTestNotification({
        userId: otherUser._id,
      });

      // Try to mark another user's notification as read using first user's token
      const res = await request(app)
        .put(`/api/notifications/${notification._id}/read`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
