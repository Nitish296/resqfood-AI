const { body } = require('express-validator');
const { ROLES } = require('../utils/constants');

const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/\d/).withMessage('Password must contain a digit')
    .matches(/[!@#$%^&*]/).withMessage('Password must contain a special character'),
  body('role')
    .isIn([ROLES.DONOR, ROLES.NGO, ROLES.VOLUNTEER]).withMessage('Role must be Donor, NGO, or Volunteer'),
  body('location.latitude')
    .optional()
    .isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  body('location.longitude')
    .optional()
    .isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude')
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Valid email is required')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
];

const refreshTokenValidation = [
  body('refreshToken')
    .notEmpty().withMessage('Refresh token is required')
];

module.exports = {
  registerValidation,
  loginValidation,
  refreshTokenValidation
};
