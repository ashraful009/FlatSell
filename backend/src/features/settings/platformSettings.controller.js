const PlatformSettings = require('./platformSettings.model');
const { logAudit }     = require('../audit/audit.service');

// Fields the Super Admin is allowed to change. NOTE: the 20% retention is listed
// here so it IS tunable from settings (the requirement: "change 20% to 15%"),
// but it can never be changed on a per-refund basis — only globally, here.
const EDITABLE_FIELDS = [
  'inactivityCancelMonths',
  'inactivityWarnMonths',
  'refundWindowDays',
  'refundRetentionPercentage',
  'maxActiveBookingsPerVendor',
  'maxTotalActiveBookings',
];

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get the platform policy settings (singleton)
// @route   GET /api/settings
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getSettings = async (req, res) => {
  const settings = await PlatformSettings.getSettings();
  res.status(200).json({ success: true, data: { settings } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get the public, read-only subset of settings (for checkout copy etc.)
// @route   GET /api/settings/public
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getPublicSettings = async (req, res) => {
  const s = await PlatformSettings.getSettings();
  res.status(200).json({
    success: true,
    data: {
      settings: {
        inactivityCancelMonths:     s.inactivityCancelMonths,
        inactivityWarnMonths:       s.inactivityWarnMonths,
        refundWindowDays:           s.refundWindowDays,
        refundRetentionPercentage:  s.refundRetentionPercentage,
        maxActiveBookingsPerVendor: s.maxActiveBookingsPerVendor,
        maxTotalActiveBookings:     s.maxTotalActiveBookings,
      },
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update platform policy settings
// @route   PUT /api/settings
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const updateSettings = async (req, res) => {
  const settings = await PlatformSettings.getSettings();

  const changes = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) {
      const num = Number(req.body[field]);
      if (!Number.isFinite(num) || num < 0) return; // skip invalid
      if (settings[field] !== num) changes[field] = { from: settings[field], to: num };
      settings[field] = num;
    }
  });

  settings.updatedBy = req.user._id;
  await settings.save(); // schema min/max validators enforce sane bounds

  await logAudit({
    action:      'platform_settings_updated',
    performedBy: req.user._id,
    notes:       'Super Admin updated platform policy settings',
    meta:        changes,
  });

  res.status(200).json({
    success: true,
    message: 'Platform settings updated successfully',
    data:    { settings },
  });
};

module.exports = { getSettings, getPublicSettings, updateSettings };
