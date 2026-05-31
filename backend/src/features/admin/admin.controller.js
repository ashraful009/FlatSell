const mongoose             = require('mongoose');
const Booking              = require('../bookings/booking.model');
const User                 = require('../auth/user.model');
const BookingLimitOverride = require('../overrides/bookingLimitOverride.model');
const AuditLog             = require('../audit/auditLog.model');
const PlatformSettings     = require('../settings/platformSettings.model');
const { logAudit }         = require('../audit/audit.service');
const { ACTIVE_STATUS_FILTER } = require('../bookings/bookingLimits.service');
const { runAutoCancelInactiveBookings } = require('../../jobs/autoCancelInactiveBookings');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Grant / update a per-user booking-limit override (Policy 3)
// @route   POST /api/admin/users/:id/booking-override
// @body    { overrideLimit, reason }
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const grantBookingOverride = async (req, res) => {
  const { id } = req.params;
  const { overrideLimit, reason } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user id.' });
  }
  const limit = Number(overrideLimit);
  if (!Number.isInteger(limit) || limit < 1) {
    return res.status(400).json({ success: false, message: 'overrideLimit must be a positive integer.' });
  }

  const user = await User.findById(id).select('name email');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found.' });
  }

  const override = await BookingLimitOverride.findOneAndUpdate(
    { userId: id },
    { overrideLimit: limit, grantedBy: req.user._id, grantedAt: new Date(), reason: reason || '' },
    { new: true, upsert: true, runValidators: true }
  );

  await logAudit({
    action:      'booking_limit_override_granted',
    userId:      id,
    performedBy: req.user._id,
    notes:       `Override limit set to ${limit}. Reason: ${reason || '—'}`,
    meta:        { overrideLimit: limit },
  });

  res.status(200).json({
    success: true,
    message: `Booking limit override granted: ${user.name} can now hold up to ${limit} active bookings.`,
    data:    { override },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Revoke a user's booking-limit override
// @route   DELETE /api/admin/users/:id/booking-override
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const revokeBookingOverride = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid user id.' });
  }

  const removed = await BookingLimitOverride.findOneAndDelete({ userId: id });
  if (!removed) {
    return res.status(404).json({ success: false, message: 'No override exists for this user.' });
  }

  await logAudit({
    action:      'booking_limit_override_revoked',
    userId:      id,
    performedBy: req.user._id,
    notes:       'Booking limit override revoked.',
  });

  res.status(200).json({ success: true, message: 'Override revoked.' });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Users who have reached (or exceeded) their active-booking limit
// @route   GET /api/admin/booking-limits
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getUsersAtLimit = async (req, res) => {
  const settings  = await PlatformSettings.getSettings();
  const baseLimit = settings.maxTotalActiveBookings;

  // Count active bookings grouped by customer.
  const grouped = await Booking.aggregate([
    { $match: ACTIVE_STATUS_FILTER },
    { $group: { _id: '$customerId', activeCount: { $sum: 1 } } },
    { $sort: { activeCount: -1 } },
  ]);

  // Attach user info + any override, then keep only those at/over their cap.
  const overrides = await BookingLimitOverride.find().lean();
  const overrideMap = new Map(overrides.map((o) => [String(o.userId), o]));

  const userIds = grouped.map((g) => g._id);
  const users   = await User.find({ _id: { $in: userIds } }).select('name email phone').lean();
  const userMap = new Map(users.map((u) => [String(u._id), u]));

  const result = grouped
    .map((g) => {
      const ov    = overrideMap.get(String(g._id));
      const limit = ov ? ov.overrideLimit : baseLimit;
      return {
        userId:      g._id,
        user:        userMap.get(String(g._id)) || null,
        activeCount: g.activeCount,
        limit,
        hasOverride: !!ov,
        overrideLimit: ov ? ov.overrideLimit : null,
        atLimit:     g.activeCount >= limit,
      };
    })
    .filter((r) => r.atLimit);

  res.status(200).json({ success: true, data: { users: result, baseLimit, count: result.length } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Read the audit trail (policy actions)
// @route   GET /api/admin/audit?action=&limit=
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAuditLog = async (req, res) => {
  const { action } = req.query;
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  const query = {};
  if (action) query.action = action;

  const logs = await AuditLog.find(query)
    .populate('userId',      'name email')
    .populate('performedBy', 'name email')
    .sort('-createdAt')
    .limit(limit);

  res.status(200).json({ success: true, data: { logs, count: logs.length } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Manually trigger the Policy-1 inactivity scan (on-demand)
// @route   POST /api/admin/run-inactivity-scan
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const runInactivityScan = async (req, res) => {
  const summary = await runAutoCancelInactiveBookings();
  await logAudit({
    action:      'inactivity_scan_manual_run',
    performedBy: req.user._id,
    notes:       `Manual inactivity scan. ${JSON.stringify(summary)}`,
    meta:        summary,
  });
  res.status(200).json({ success: true, message: 'Inactivity scan completed.', data: { summary } });
};

module.exports = {
  grantBookingOverride,
  revokeBookingOverride,
  getUsersAtLimit,
  getAuditLog,
  runInactivityScan,
};
