/**
 * @fileoverview Integration tests for Authentication endpoints
 * @description Tests POST /api/auth/register, POST /api/auth/login,
 * GET /api/users/me, and PUT /api/users/me
 */

const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');
const { createTestUser } = require('../setup');

describe('Authentication API', () => {
  // ============================================================
  // POST /api/auth/register
  // ============================================================
  describe('POST /api/auth/register', () => {
    const validUser = {
      username: 'testdonor',
      email: 'donor@test.com',
      password: 'Test@12345',
      role: 'Donor',
    };

    it('should register a new Donor user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('userId');
      expect(res.body.data).toHaveProperty('token');
    });

    it('should register a new NGO user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testngo',
          email: 'ngo@test.com',
          password: 'Test@12345',
          role: 'NGO',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
    });

    it('should register a Volunteer with location', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testvolunteer',
          email: 'vol@test.com',
          password: 'Test@12345',
          role: 'Volunteer',
          location: { latitude: 12.9716, longitude: 77.5946 },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
    });

    it('should fail with duplicate email', async () => {
      await request(app).post('/api/auth/register').send(validUser);
      const res = await request(app)
        .post('/api/auth/register')
        .send(validUser);

      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('should fail with weak password (no uppercase)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'weak1@test.com', password: 'test@12345' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with weak password (no special char)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'weak2@test.com', password: 'Test12345' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'missing@test.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid email format', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'notanemail' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    it('should fail with invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ ...validUser, email: 'role@test.com', role: 'SuperAdmin' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // POST /api/auth/login
  // ============================================================
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        username: 'loginuser',
        email: 'login@test.com',
        password: 'Test@12345',
        role: 'Donor',
      });
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'Test@12345' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('role', 'Donor');
    });

    it('should fail with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com', password: 'WrongPass@123' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'noone@test.com', password: 'Test@12345' });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'login@test.com' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });

  // ============================================================
  // GET /api/users/me
  // ============================================================
  describe('GET /api/users/me', () => {
    it('should return user profile with valid token', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email');
      expect(res.body.data).not.toHaveProperty('passwordHash');
    });

    it('should fail without token', async () => {
      const res = await request(app).get('/api/users/me');
      expect(res.status).toBe(401);
    });

    it('should fail with invalid token', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalidtoken123');
      expect(res.status).toBe(401);
    });
  });

  // ============================================================
  // PUT /api/users/me
  // ============================================================
  describe('PUT /api/users/me', () => {
    it('should update user profile successfully', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ contactNumber: '+91-9876543210', organizationName: 'Test Org' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should do partial update (only contactNumber)', async () => {
      const { token } = await createTestUser();

      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ contactNumber: '+91-1111111111' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
