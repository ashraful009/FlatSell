const Booking               = require('./booking.model');
const BookingLimitOverride  = require('../overrides/bookingLimitOverride.model');
const PlatformSettings      = require('../settings/platformSettings.model');

// ─────────────────────────────────────────────────────────────────────────────
// Policy 3 — Booking Limits Per User
//
// "Active booking" = not cancelled/rejected AND not yet fully paid.
//   status ∈ {pending, confirmed}  AND  paymentStatus ≠ fully_paid
//
// Rules:
//   • Per-vendor: a user may hold up to `maxActiveBookingsPerVendor` (default 2)
//     active bookings with the SAME vendor — but only while NONE of them has a
//     confirmed payment. Once at least one is paid (booking_paid/fully_paid),
//     the cap no longer blocks (the exception in the spec).
//   • Total: a user may hold up to `maxTotalActiveBookings` (default 5) active
//     bookings across ALL vendors, unless a Super Admin override raises the cap.
// ─────────────────────────────────────────────────────────────────────────────

const ACTIVE_STATUS_FILTER = {
  status:        { $in: ['pending', 'confirmed'] },
  paymentStatus: { $ne: 'fully_paid' },
};

const PAID_STATUSES = ['booking_paid', 'fully_paid'];

/**
 * Compute a user's current booking-limit picture (optionally for a target vendor).
 *
 * @param {string} userId
 * @param {string} [companyId] - the vendor the user is trying to book from
 * @returns {Promise<Object>} a rich status object (see fields below)
 */
const getLimitStatus = async (userId, companyId = null) => {
  const settings        = await PlatformSettings.getSettings();
  const perVendorLimit  = settings.maxActiveBookingsPerVendor;
  const baseTotalLimit  = settings.maxTotalActiveBookings;

  const override   = await BookingLimitOverride.findOne({ userId });
  const totalLimit = override ? override.overrideLimit : baseTotalLimit;

  const activeForUser = await Booking.find({ customerId: userId, ...ACTIVE_STATUS_FILTER })
    .select('companyId paymentStatus');

  const totalActive = activeForUser.length;

  let vendorActive = 0;
  let vendorPaid   = 0;
  if (companyId) {
    const sameVendor = activeForUser.filter((b) => String(b.companyId) === String(companyId));
    vendorActive = sameVendor.length;
    vendorPaid   = sameVendor.filter((b) => PAID_STATUSES.includes(b.paymentStatus)).length;
  }

  return {
    totalActive,
    totalLimit,
    hasOverride:     !!override,
    overrideLimit:   override ? override.overrideLimit : null,
    perVendorLimit,
    vendorActive,
    vendorPaid,
    remaining:       Math.max(0, totalLimit - totalActive),
  };
};

/**
 * Decide whether a NEW booking from `companyId` is allowed for `userId`.
 *
 * @returns {Promise<{ allowed: boolean, reason?: string, code?: string, status: Object }>}
 *   code: 'VENDOR_LIMIT' | 'TOTAL_LIMIT' (when blocked)
 */
const canCreateBooking = async (userId, companyId) => {
  const status = await getLimitStatus(userId, companyId);

  // ── Total cap (across all vendors) ───────────────────────────────────────
  if (status.totalActive >= status.totalLimit) {
    return {
      allowed: false,
      code:    'TOTAL_LIMIT',
      reason:  `You have reached the maximum of ${status.totalLimit} active bookings. Please contact the Super Admin to book more.`,
      status,
    };
  }

  // ── Per-vendor cap (with the "one already paid" exception) ────────────────
  if (
    companyId &&
    status.vendorActive >= status.perVendorLimit &&
    status.vendorPaid === 0
  ) {
    return {
      allowed: false,
      code:    'VENDOR_LIMIT',
      reason:  `You already have ${status.perVendorLimit} active bookings with this vendor. Please complete payment on one to proceed.`,
      status,
    };
  }

  return { allowed: true, status };
};

module.exports = {
  getLimitStatus,
  canCreateBooking,
  ACTIVE_STATUS_FILTER,
};
