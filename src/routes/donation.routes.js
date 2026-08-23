/**
 * @fileoverview Donation routes
 */

const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donation.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validate } = require('../middleware/validate');
const { createDonationValidation, availableDonationsValidation } = require('../validators/donation.validator');
const upload = require('../middleware/upload');

/**
 * @openapi
 * /api/donations/:
 *   post:
 *     summary: Create a food donation
 *     description: Allows a Donor to post food for donation
 *     tags:
 *       - Donations
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - foodItems
 *               - pickupLocation
 *             properties:
 *               foodItems:
 *                 type: array
 *                 items:
 *                   type: object
 *               pickupLocation:
 *                 type: object
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Image of the food donation
 *     responses:
 *       201:
 *         description: Donation created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Donor)
 */
router.post('/', authenticate, authorize('Donor'), (req, res, next) => {
  // Only process upload if content-type is multipart/form-data
  if (req.is('multipart/form-data')) {
    return upload.single('image')(req, res, next);
  }
  next();
}, validate(createDonationValidation), donationController.createDonation);

/**
 * @openapi
 * /api/donations/donor:
 *   get:
 *     summary: Get donor's donations
 *     description: Retrieves all donations created by the authenticated Donor
 *     tags:
 *       - Donations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of donations
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Donor)
 */
router.get('/donor', authenticate, authorize('Donor'), donationController.getDonorDonations);

/**
 * @openapi
 * /api/donations/available:
 *   get:
 *     summary: Get available donations
 *     description: Retrieves available donations for NGOs to accept
 *     tags:
 *       - Donations
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *       - in: query
 *         name: lng
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: List of available donations
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an NGO)
 */
router.get('/available', authenticate, authorize('NGO'), validate(availableDonationsValidation), donationController.getAvailableDonations);

/**
 * @openapi
 * /api/donations/{id}:
 *   get:
 *     summary: Get donation by ID
 *     description: Retrieves details of a specific donation
 *     tags:
 *       - Donations
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
 *         description: Donation details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Donation not found
 */
router.get('/:id', authenticate, donationController.getDonationById);

/**
 * @openapi
 * /api/donations/{id}/accept:
 *   post:
 *     summary: Accept a donation
 *     description: Allows an NGO to accept an available donation
 *     tags:
 *       - Donations
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
 *         description: Donation accepted successfully
 *       400:
 *         description: Donation not available
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an NGO)
 *       404:
 *         description: Donation not found
 */
router.post('/:id/accept', authenticate, authorize('NGO'), donationController.acceptDonation);

/**
 * @openapi
 * /api/donations/{id}/cancel:
 *   put:
 *     summary: Cancel a donation
 *     description: Allows a Donor to cancel their own pending donation
 *     tags:
 *       - Donations
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
 *         description: Donation cancelled successfully
 *       400:
 *         description: Only pending donations can be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Donor or not your donation)
 *       404:
 *         description: Donation not found
 */
router.put('/:id/cancel', authenticate, authorize('Donor'), donationController.cancelDonation);

module.exports = router;
