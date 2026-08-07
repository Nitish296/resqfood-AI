const { validationResult } = require('express-validator');

/**
 * Wrapper middleware for express-validator.
 * Runs provided validations and formats errors if any exist.
 *
 * @param {import('express-validator').ValidationChain[]} validations - Array of validation chains
 * @returns {import('express').RequestHandler} Express middleware function
 */
const validate = (validations) => async (req, res, next) => {
  // Run all validations
  await Promise.all(validations.map(validation => validation.run(req)));

  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    // Return 400 Bad Request with formatted validation errors
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  next();
};

module.exports = { validate };
