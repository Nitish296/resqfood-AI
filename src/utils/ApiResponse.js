/**
 * @file ApiResponse.js
 * @description Standardized response wrapper for API responses.
 */

class ApiResponse {
  /**
   * @param {number} statusCode - HTTP status code
   * @param {string} message - Response message
   * @param {any} data - Response data payload
   */
  constructor(statusCode, message, data = null) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
  }

  /**
   * @returns {boolean} True if status code is < 400
   */
  get success() {
    return this.statusCode < 400;
  }

  /**
   * Send a successful response
   * @param {import('express').Response} res - Express response object
   * @param {string} message - Success message
   * @param {any} data - Response data
   */
  static success(res, message, data = null) {
    const response = new ApiResponse(200, message, data);
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data
    });
  }

  /**
   * Send a created response
   * @param {import('express').Response} res - Express response object
   * @param {string} message - Creation success message
   * @param {any} data - Response data
   */
  static created(res, message, data = null) {
    const response = new ApiResponse(201, message, data);
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data
    });
  }

  /**
   * Send an error response (can be used for custom error formatting if not using centralized error handler)
   * @param {import('express').Response} res - Express response object
   * @param {number} statusCode - HTTP error status code
   * @param {string} message - Error message
   */
  static error(res, statusCode, message) {
    const response = new ApiResponse(statusCode, message);
    return res.status(response.statusCode).json({
      success: response.success,
      message: response.message,
      data: response.data
    });
  }
}

module.exports = ApiResponse;
