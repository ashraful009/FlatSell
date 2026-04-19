const mongoose = require('mongoose');

// ── Flat Type Sub-document ────────────────────────────────────────────────────
const flatTypeSchema = new mongoose.Schema(
  {
    label:       { type: String, default: '' },  // e.g. "Type A 1200 sft"
    sqft:        { type: Number, default: 0  },  // square feet
    pricePerUnit:{ type: Number, default: 0  },  // per unit price
    bedrooms:    { type: Number, default: 0  },
    bathrooms:   { type: Number, default: 0  },
    kitchen:     { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    dining:      { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    drawing:     { type: String, enum: ['Yes', 'No'], default: 'No'  },
    parking:     { type: String, enum: ['Yes', 'No'], default: 'No'  },
    description: { type: String, default: '' },
  },
  { _id: true }
);

// ── Main Property Schema ──────────────────────────────────────────────────────
const propertySchema = new mongoose.Schema(
  {
    // ── Core Info ─────────────────────────────────────────────────────────────
    title: {
      type:     String,
      required: [true, 'Property title is required'],
      trim:     true,
    },
    description: {
      type:     String,
      required: [true, 'Property description is required'],
    },
    price: {
      type:     Number,
      required: [true, 'Price is required'],
      min:      [0, 'Price cannot be negative'],
    },

    // ── Category ──────────────────────────────────────────────────────────────
    category: {
      type:     String,
      enum:     ['Apartments', 'Villas', 'Commercial', 'Land', 'Office'],
      required: true,
    },

    // ── Media ─────────────────────────────────────────────────────────────────
    mainImage:     { type: String, default: '' },   // homepage cover image
    galleryImages: [String],                         // up to 10, for property details

    // ── Ownership ─────────────────────────────────────────────────────────────
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
    },
    addedBy: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Status Lifecycle ──────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    isActive:       { type: Boolean, default: true  }, // vendor can hide/show
    approvedAt:     { type: Date },
    rejectedReason: { type: String, default: '' },

    // ── Location & Address ────────────────────────────────────────────────────
    address:  { type: String, required: true, trim: true },
    city:     { type: String, required: true, trim: true },

    // ── Property Overview Fields ───────────────────────────────────────────────
    totalUnitsCount: { type: Number, default: 0    }, // explicit total units
    landSize:        { type: String, default: ''   }, // e.g. "5 Katha"
    handoverTime:    { type: String, default: ''   }, // e.g. "Q4 2026"

    // ── Building Config (drives Unit auto-generation) ─────────────────────────
    totalFloors:   { type: Number, required: true, min: 1, default: 1 },
    unitsPerFloor: { type: Number, required: true, min: 1, default: 1 },

    // ── Flat Types (Apartments / Villas) ──────────────────────────────────────
    flatTypes: [flatTypeSchema],

    // ── Map Location ──────────────────────────────────────────────────────────
    location: {
      lat: { type: Number, default: 0 },
      lng: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index for fast public listing
propertySchema.index({ status: 1, isActive: 1, category: 1, city: 1 });

module.exports = mongoose.model('Property', propertySchema);
