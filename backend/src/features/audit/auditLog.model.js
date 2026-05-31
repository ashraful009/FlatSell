const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// AuditLog — immutable trail of every policy action taken on the platform.
//
// Required by the "General Requirements" of all three booking policies:
//   action, user_id, booking_id, performed_by, timestamp, notes
//
// `performedBy` is null when the action is taken by the system (e.g. the daily
// auto-cancellation cron); otherwise it is the acting user (Super Admin, vendor…).
// ─────────────────────────────────────────────────────────────────────────────
const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type:     String,
      required: true,
      index:    true,
      // e.g. 'auto_cancel_inactivity', 'inactivity_warning_sent',
      //      'refund_requested', 'refund_completed',
      //      'booking_limit_override_granted', 'booking_limit_blocked'
    },
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null, index: true },
    bookingId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null, index: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    default: null }, // null = system
    notes:       { type: String, default: '' },
    // Free-form structured context (amounts, thresholds, etc.)
    meta:        { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true } // createdAt acts as the immutable `timestamp`
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
