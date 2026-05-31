const Booking          = require('../features/bookings/booking.model');
const Unit             = require('../features/units/unit.model');
const PlatformSettings = require('../features/settings/platformSettings.model');
const { logAudit }     = require('../features/audit/audit.service');
const { monthsBetween } = require('../utils/dateUtils');
const {
  sendInactivityWarningEmail,
  sendAutoCancellationEmail,
} = require('../utils/sendEmail');

// ─────────────────────────────────────────────────────────────────────────────
// Policy 1 — Auto-Cancellation for Payment Inactivity
//
// Runs daily. For every active, not-yet-fully-paid booking it computes how many
// whole months have passed with no payment and applies the policy:
//
//   • Rule A — "no payment at all": booking is still `unpaid` (never made any
//     payment). Inactivity clock starts at the booking's createdAt.
//   • Rule B — "installment plan stopped": an installment plan is active but the
//     customer has stopped paying. Clock starts at the last payment date.
//
//   ≥ inactivityWarnMonths  → send a one-time warning email ("cancelled in 30 days")
//   ≥ inactivityCancelMonths → cancel the booking with NO refund + release the unit
//
// Thresholds come from PlatformSettings so the Super Admin can retune them with
// no code change. All times use the server clock (see utils/dateUtils).
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolve the inactivity baseline + whether this booking is in scope for Policy 1.
 * @returns {{ inScope: boolean, reference: Date, rule: 'A'|'B'|null }}
 */
const resolveInactivity = (booking) => {
  // Rule A — never paid anything.
  if (booking.paymentStatus === 'unpaid') {
    return { inScope: true, reference: booking.createdAt, rule: 'A' };
  }
  // Rule B — on an installment plan but stalled.
  if (booking.installmentPlan?.active && booking.paymentStatus !== 'fully_paid') {
    const reference =
      booking.lastPaymentDate ||
      booking.installmentPlan.createdAt ||
      booking.createdAt;
    return { inScope: true, reference, rule: 'B' };
  }
  // Everything else (e.g. booking money paid, no installment plan) is not covered.
  return { inScope: false, reference: null, rule: null };
};

const cancelForInactivity = async (booking, monthsInactive) => {
  booking.status             = 'cancelled';
  booking.cancellationReason = 'inactivity';
  booking.cancelledAt        = new Date();
  booking.noRefund           = true;
  booking.autoCancelCheckedAt = new Date();
  await booking.save();

  // Release the unit so it can be re-listed.
  const unit = await Unit.findById(booking.unitId);
  if (unit && unit.status !== 'sold') {
    unit.status   = 'available';
    unit.bookedBy = null;
    await unit.save();
  }

  await logAudit({
    action:    'auto_cancel_inactivity',
    userId:    booking.customerId?._id || booking.customerId,
    bookingId: booking._id,
    performedBy: null, // system
    notes:     `Auto-cancelled (no refund) after ${monthsInactive} months of payment inactivity.`,
    meta:      { monthsInactive },
  });

  // Notify the customer (fire-and-forget — never let email failure abort the run).
  if (booking.customerId?.email) {
    sendAutoCancellationEmail({
      customer: booking.customerId,
      property: booking.propertyId,
      monthsInactive,
    }).catch((e) => console.error('❌ Auto-cancel email failed:', e.message));
  }
};

const warnInactivity = async (booking, cancelMonths) => {
  booking.inactivityWarningSentAt = new Date();
  booking.autoCancelCheckedAt     = new Date();
  await booking.save();

  await logAudit({
    action:    'inactivity_warning_sent',
    userId:    booking.customerId?._id || booking.customerId,
    bookingId: booking._id,
    performedBy: null,
    notes:     'Sent 2-month inactivity warning (cancellation in ~30 days).',
  });

  if (booking.customerId?.email) {
    // Roughly one month until the cancel threshold (kept generic via 30 days).
    sendInactivityWarningEmail({
      customer: booking.customerId,
      property: booking.propertyId,
      daysUntilCancel: 30,
    }).catch((e) => console.error('❌ Inactivity warning email failed:', e.message));
  }
};

/**
 * The daily job entry point. Returns a small summary for logging/tests.
 */
const runAutoCancelInactiveBookings = async () => {
  const settings     = await PlatformSettings.getSettings();
  const cancelMonths = settings.inactivityCancelMonths;
  const warnMonths   = settings.inactivityWarnMonths;

  const candidates = await Booking.find({
    status:        { $in: ['pending', 'confirmed'] },
    paymentStatus: { $ne: 'fully_paid' },
    cancellationReason: null,
  })
    .populate('customerId', 'name email')
    .populate('propertyId', 'title');

  let warned = 0;
  let cancelled = 0;
  let checked = 0;

  for (const booking of candidates) {
    try {
      const { inScope, reference } = resolveInactivity(booking);
      if (!inScope) continue;

      checked += 1;
      const monthsInactive = monthsBetween(reference, new Date());

      if (monthsInactive >= cancelMonths) {
        await cancelForInactivity(booking, monthsInactive);
        cancelled += 1;
      } else if (monthsInactive >= warnMonths && !booking.inactivityWarningSentAt) {
        await warnInactivity(booking, cancelMonths);
        warned += 1;
      } else {
        booking.autoCancelCheckedAt = new Date();
        await booking.save();
      }
    } catch (err) {
      console.error(`❌ Auto-cancel check failed for booking ${booking._id}:`, err.message);
    }
  }

  const summary = { scanned: candidates.length, checked, warned, cancelled };
  console.log(`🕒 [Policy 1] Inactivity scan complete:`, summary);
  return summary;
};

module.exports = { runAutoCancelInactiveBookings, resolveInactivity };
