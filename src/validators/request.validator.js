const { query } = require('express-validator');

const availableRequestsValidation = [
  query('latitude')
    .isFloat({ min: -90, max: 90 }).withMessage('Valid latitude required'),
  query('longitude')
    .isFloat({ min: -180, max: 180 }).withMessage('Valid longitude required'),
  query('radius')
    .optional()
    .isFloat({ min: 0.1, max: 5000 }).withMessage('Radius must be between 0.1 and 5000 km')
];

module.exports = {
  availableRequestsValidation
};
