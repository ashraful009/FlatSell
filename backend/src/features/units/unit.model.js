const mongoose = require('mongoose');

const unitSchema = new mongoose.Schema(
  {
    // ── Relationship ────────────────────────────────────────
    propertyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Property',
      required: true,
    },

    // ── Identity ────────────────────────────────────────────
    floor:      { type: Number, required: true, min: 1 },
    unitNumber: { type: String, required: true, trim: true }, // e.g. "3A", "3B"

    // ── Status Lifecycle ────────────────────────────────────
    status: {
      type:    String,
      enum:    ['available', 'booked', 'sold'],
      default: 'available',
    },

    // ── Details (editable by Company Admin / Seller) ────────
    price:    { type: Number,   default: null   }, // overrides property base price
    size:     { type: String,   default: ''     }, // e.g. "1200 sqft"
    type: {
      type:    String,
      enum:    ['1BHK', '2BHK', '3BHK', '4BHK', 'studio', 'penthouse', 'commercial'],
      default: '2BHK',
    },
    facing:   { type: String, default: '' }, // e.g. "North", "East"
    features: [String], // e.g. ['Balcony', 'Corner unit', 'Lake view']

    // ── Booking Reference (Phase 9) ─────────────────────────
    bookedBy: {
      type:    mongoose.Schema.Types.ObjectId,
      ref:     'User',
      default: null,
    },
  },
  { timestamps: true }
);

// Prevent duplicate unit numbers on the same floor of the same property
unitSchema.index({ propertyId: 1, floor: 1, unitNumber: 1 }, { unique: true });

module.exports = mongoose.model('Unit', unitSchema);
