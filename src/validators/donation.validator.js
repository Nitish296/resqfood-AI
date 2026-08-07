const { body, query } = require('express-validator');
const { UNITS } = require('../utils/constants');

const createDonationValidation = [
  body('foodType')
    .trim()
    .notEmpty().withMessage('Food type is required'),
  body('quantity')
    .isFloat({ min: 0.1 }).withMessage('Quantity must be at least 0.1'),
  body('unit')
    .isIn([UNITS.KG, UNITS.MEALS, UNITS.SERVINGS, UNITS.ITEMS]).withMessage('Invalid unit'),
  body('expiryTime')
    .isISO8601().withMessage('Valid expiry time required')
    .custom(value => new Date(value) > new Date()).withMessage('Expiry time must be in the future'),
  body('pickupLocation.address')
    .trim()
    .notEmpty().withMessage('Pickup address is required'),
  body('pickupLocation.latitude')
    .isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  body('pickupLocation.longitude')
    .isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  body('photoUrl')
    .optional()
    .isURL().withMessage('Invalid photo URL')
];

const availableDonationsValidation = [
  query('latitude')
    .isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('longitude')
    .isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 100 }).withMessage('Radius must be between 0.1 and 100 km'),
  query('foodType')
    .optional()
    .trim()
];

module.exports = {
  createDonationValidation,
  availableDonationsValidation
};
