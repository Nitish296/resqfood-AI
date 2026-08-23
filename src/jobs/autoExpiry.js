const cron = require('node-cron');
const Donation = require('../models/Donation');

function startAutoExpiryCron() {
  // Run every 15 minutes
  cron.schedule('*/15 * * * *', async () => {
    try {
      const result = await Donation.updateMany(
        {
          status: { $in: ['Pending', 'Accepted'] },
          expiryTime: { $lt: new Date() },
        },
        { $set: { status: 'Expired' } }
      );
      if (result.modifiedCount > 0) {
        console.log(`[Auto-Expiry] Marked ${result.modifiedCount} donation(s) as expired`);
      }
    } catch (error) {
      console.error('[Auto-Expiry] Error:', error.message);
    }
  });
  console.log('[Auto-Expiry] Cron job started (every 15 minutes)');
}

module.exports = { startAutoExpiryCron };
