/**
 * @fileoverview Logistics/Request routes
 */

const express = require('express');
const router = express.Router();
const requestController = require('../controllers/request.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/roleAuth');
const { validate } = require('../middleware/validate');
const { availableRequestsValidation } = require('../validators/request.validator');

/**
 * @openapi
 * /api/requests/available:
 *   get:
 *     summary: Get available delivery requests
 *     description: Retrieves unassigned logistics requests for Volunteers
 *     tags:
 *       - Requests
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
 *         description: List of available delivery requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Volunteer)
 */
router.get('/available', authenticate, authorize('Volunteer'), validate(availableRequestsValidation), requestController.getAvailableRequests);

/**
 * @openapi
 * /api/requests/ngo:
 *   get:
 *     summary: Get NGO's requests
 *     description: Retrieves logistics requests related to the authenticated NGO
 *     tags:
 *       - Requests
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of NGO delivery requests
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an NGO)
 */
router.get('/ngo', authenticate, authorize('NGO'), requestController.getNgoRequests);

/**
 * @openapi
 * /api/requests/{id}/assign:
 *   post:
 *     summary: Assign a volunteer
 *     description: Volunteer accepts a delivery request
 *     tags:
 *       - Requests
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
 *         description: Volunteer assigned successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Volunteer)
 */
router.post('/:id/assign', authenticate, authorize('Volunteer'), requestController.assignVolunteer);

/**
 * @openapi
 * /api/requests/{id}/pickup:
 *   put:
 *     summary: Mark as picked up
 *     description: Volunteer marks a donation as picked up from the donor
 *     tags:
 *       - Requests
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
 *         description: Status updated to PickedUp
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Volunteer)
 */
router.put('/:id/pickup', authenticate, authorize('Volunteer'), requestController.markPickedUp);

/**
 * @openapi
 * /api/requests/{id}/deliver:
 *   put:
 *     summary: Mark as delivered
 *     description: Volunteer marks a donation as delivered to the NGO
 *     tags:
 *       - Requests
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
 *         description: Status updated to Delivered
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not a Volunteer)
 */
router.put('/:id/deliver', authenticate, authorize('Volunteer'), requestController.markDelivered);

/**
 * @openapi
 * /api/requests/{id}/cancel:
 *   put:
 *     summary: Cancel a request
 *     description: Allows an NGO to cancel their own accepted request
 *     tags:
 *       - Requests
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
 *         description: Request cancelled successfully
 *       400:
 *         description: Only accepted requests can be cancelled
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (Not an NGO or not your request)
 *       404:
 *         description: Request not found
 */
router.put('/:id/cancel', authenticate, authorize('NGO'), requestController.cancelRequest);

module.exports = router;
