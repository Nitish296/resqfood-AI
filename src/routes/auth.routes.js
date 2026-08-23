/**
 * @fileoverview Authentication routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { registerValidation, loginValidation, refreshTokenValidation } = require('../validators/auth.validator');

/**
 * @openapi
 * /api/auth/:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with role-specific details (Donor, NGO, Volunteer)
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - role
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *               role:
 *                 type: string
 *                 enum: [Donor, NGO, Volunteer]
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or Email already exists
 */
router.post('/register', validate(registerValidation), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticates a user and returns a token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validate(loginValidation), authController.login);

/**
 * @openapi
 * /api/auth/google:
 *   post:
 *     summary: Sign in with Google
 *     description: Authenticate using a Google OAuth idToken. Creates a new account if the user doesn't exist.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google OAuth ID token from frontend
 *               role:
 *                 type: string
 *                 enum: [Donor, NGO, Volunteer]
 *                 description: Role to assign for new users (default Donor)
 *     responses:
 *       200:
 *         description: Google login successful
 *       400:
 *         description: Missing idToken or invalid Google account
 *       401:
 *         description: Invalid Google token
 */
router.post('/google', authController.googleLogin);

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     description: Obtains a new access token and refresh token using a valid refresh token.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', validate(refreshTokenValidation), authController.refreshToken);

module.exports = router;
