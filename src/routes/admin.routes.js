/**
 * @fileoverview Admin routes
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');

/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Admin can view all registered users
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an Admin)
 */
router.get('/users', authenticate, authorize('Admin'), adminController.getAllUsers);

/**
 * @openapi
 * /api/admin/users/{id}/verify:
 *   put:
 *     summary: Verify a user
 *     description: Admin can verify NGOs or other users
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User verified successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an Admin)
 *       404:
 *         description: User not found
 */
router.put('/users/:id/verify', authenticate, authorize('Admin'), adminController.verifyUser);

/**
 * @openapi
 * /api/admin/donations:
 *   get:
 *     summary: Get all donations
 *     description: Admin can view all system donations
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all donations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an Admin)
 */
router.get('/donations', authenticate, authorize('Admin'), adminController.getAllDonations);

module.exports = router;
