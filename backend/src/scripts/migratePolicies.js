/**
 * One-time migration / backfill for the three booking-policy systems.
 *
 *   Run with:  node src/scripts/migratePolicies.js
 *
 * It is idempotent — safe to run multiple times. It:
 *   1. Seeds the singleton PlatformSettings document with defaults.
 *   2. Backfills `lastPaymentDate` on already-paid bookings (so the Policy-1
 *      inactivity clock has a sensible baseline for existing data).
 *   3. Ensures every Company has a numeric `walletBalance` (defaults to 0).
 *   4. Syncs Mongoose indexes for the new/updated schemas.
 *
 * MongoDB has no rigid schema, so "migration" here means data backfill + index
 * sync rather than column DDL.
 */
require('dotenv').config();
const mongoose = require('mongoose');

const connectDB        = require('../config/db');
const PlatformSettings = require('../features/settings/platformSettings.model');
const Booking          = require('../features/bookings/booking.model');
const Company          = require('../features/companies/company.model');

const run = async () => {
  await connectDB();

  // 1. Seed settings ----------------------------------------------------------
  const settings = await PlatformSettings.getSettings();
  console.log('✅ PlatformSettings ready:', {
    inactivityCancelMonths:     settings.inactivityCancelMonths,
    inactivityWarnMonths:       settings.inactivityWarnMonths,
    refundWindowDays:           settings.refundWindowDays,
    refundRetentionPercentage:  settings.refundRetentionPercentage,
    maxActiveBookingsPerVendor: settings.maxActiveBookingsPerVendor,
    maxTotalActiveBookings:     settings.maxTotalActiveBookings,
  });

  // 2. Backfill lastPaymentDate ----------------------------------------------
  // For bookings that have a payment but no recorded lastPaymentDate, fall back
  // to updatedAt (closest proxy for the last activity), else createdAt.
  const paidWithoutDate = await Booking.find({
    paymentStatus: { $in: ['booking_paid', 'fully_paid'] },
    $or: [{ lastPaymentDate: null }, { lastPaymentDate: { $exists: false } }],
  }).select('updatedAt createdAt');

  let backfilled = 0;
  for (const b of paidWithoutDate) {
    b.lastPaymentDate = b.updatedAt || b.createdAt;
    await b.save();
    backfilled += 1;
  }
  console.log(`✅ Backfilled lastPaymentDate on ${backfilled} paid booking(s).`);

  // 3. Initialise wallet balances --------------------------------------------
  const walletResult = await Company.updateMany(
    { $or: [{ walletBalance: null }, { walletBalance: { $exists: false } }] },
    { $set: { walletBalance: 0 } }
  );
  console.log(`✅ Initialised walletBalance on ${walletResult.modifiedCount} company/companies.`);

  // 4. Sync indexes -----------------------------------------------------------
  await Promise.all([
    Booking.syncIndexes(),
    Company.syncIndexes(),
    PlatformSettings.syncIndexes(),
  ]);
  console.log('✅ Indexes synced (Booking, Company, PlatformSettings).');

  await mongoose.disconnect();
  console.log('🎉 Policy migration complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
