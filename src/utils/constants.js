/**
 * @file constants.js
 * @description Centralized constants for the ResQFood application.
 */

const ROLES = { DONOR: 'Donor', NGO: 'NGO', VOLUNTEER: 'Volunteer', ADMIN: 'Admin' };
const DONATION_STATUS = { PENDING: 'Pending', ACCEPTED: 'Accepted', PICKED_UP: 'PickedUp', DELIVERED: 'Delivered', EXPIRED: 'Expired', CANCELLED: 'Cancelled' };
const REQUEST_STATUS = { ACCEPTED: 'Accepted', ASSIGNED: 'Assigned', PICKED_UP: 'PickedUp', DELIVERED: 'Delivered', CANCELLED: 'Cancelled' };
const NOTIFICATION_TYPE = { ALERT: 'Alert', UPDATE: 'Update', SYSTEM: 'System' };
const ENTITY_TYPE = { DONATION: 'Donation', REQUEST: 'Request', USER: 'User' };
const UNITS = { KG: 'kg', MEALS: 'meals', SERVINGS: 'servings', ITEMS: 'items' };

module.exports = {
  ROLES,
  DONATION_STATUS,
  REQUEST_STATUS,
  NOTIFICATION_TYPE,
  ENTITY_TYPE,
  UNITS
};
