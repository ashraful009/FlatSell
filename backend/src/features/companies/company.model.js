const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    // ── Basic Info ────────────────────────────────────────────
    name:        { type: String, required: true, trim: true },
    email:       { type: String, required: true, trim: true, lowercase: true },
    phone:       { type: String, required: true, trim: true },
    description: { type: String, required: true },

    // ── Location (from Leaflet/Nominatim) ────────────────────
    location: {
      address: { type: String, default: '' },
      lat:     { type: Number, default: 0 },
      lng:     { type: Number, default: 0 },
    },

    // ── Documents ─────────────────────────────────────────────
    // Cloudinary URL of the uploaded Trade License PDF
    tradeLicense: { type: String, required: true },

    // ── Ownership ─────────────────────────────────────────────
    ownerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Status Lifecycle ──────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    approvedAt:     { type: Date },
    rejectedReason: { type: String, default: '' },

    // ── Logo (set by Company Admin later) ────────────────────
    logo: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Company', companySchema);
