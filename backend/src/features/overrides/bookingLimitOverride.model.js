const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// BookingLimitOverride — a Super Admin grant that raises a user's total active
// booking cap above the platform default (Policy 3).
//
// One active override per user (unique). `overrideLimit` replaces the global
// `maxTotalActiveBookings` for that user.
// ─────────────────────────────────────────────────────────────────────────────
const bookingLimitOverrideSchema = new mongoose.Schema(
  {
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      unique:   true,
      index:    true,
    },
    overrideLimit: { type: Number, required: true, min: 1, max: 1000 },
    grantedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    grantedAt:     { type: Date,   default: Date.now },
    reason:        { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookingLimitOverride', bookingLimitOverrideSchema);
