const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// PlatformSettings — single global document holding every tunable policy value.
//
// All three booking policies read their thresholds from here so the Super Admin
// can change them at runtime (e.g. 3 months → 2 months, 20% → 15%, limit 5 → 10)
// WITHOUT a code change or redeploy.
//
// There is only ever ONE document (a singleton). Use `getSettings()` to read it —
// it lazily creates the document with sensible defaults on first access.
// ─────────────────────────────────────────────────────────────────────────────
const platformSettingsSchema = new mongoose.Schema(
  {
    // A fixed key guarantees the singleton (unique index → only one row).
    key: { type: String, default: 'global', unique: true, immutable: true },

    // ── Policy 1 — Auto-Cancellation for Payment Inactivity ──────────────────
    inactivityCancelMonths:  { type: Number, default: 3, min: 1, max: 24 }, // cancel after N months of no payment
    inactivityWarnMonths:    { type: Number, default: 2, min: 1, max: 24 }, // send warning at N months

    // ── Policy 2 — Voluntary Refund ──────────────────────────────────────────
    refundWindowDays:           { type: Number, default: 30, min: 1, max: 365 }, // "within 1 month"
    refundRetentionPercentage:  { type: Number, default: 20, min: 0, max: 100 }, // non-refundable %

    // ── Policy 3 — Booking Limits ────────────────────────────────────────────
    maxActiveBookingsPerVendor: { type: Number, default: 2, min: 1, max: 50 },
    maxTotalActiveBookings:     { type: Number, default: 5, min: 1, max: 100 },

    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

const PlatformSettings = mongoose.model('PlatformSettings', platformSettingsSchema);

/**
 * Fetch the singleton settings document, creating it with defaults if missing.
 * Always returns a live Mongoose document.
 */
PlatformSettings.getSettings = async function () {
  let settings = await this.findOne({ key: 'global' });
  if (!settings) {
    settings = await this.create({ key: 'global' });
  }
  return settings;
};

module.exports = PlatformSettings;
