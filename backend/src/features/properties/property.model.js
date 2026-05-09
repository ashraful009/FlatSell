const mongoose = require('mongoose');

// ── Flat Type Sub-document (Apartments) ───────────────────────────────────────
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

// ── Villa Details Sub-document ────────────────────────────────────────────────
const villaDetailsSchema = new mongoose.Schema(
  {
    // Location
    area:             { type: String, default: '' },
    roadAccess:       { type: String, default: '' },   // distance from main road
    neighborhood:     { type: String, enum: ['Residential', 'Resort'], default: 'Residential' },

    // Property Overview
    totalLandSize:    { type: Number, default: 0 },    // in Katha
    totalFloors:      { type: Number, default: 0 },
    bedrooms:         { type: Number, default: 0 },
    bathrooms:        { type: Number, default: 0 },
    living:           { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    dining:           { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    kitchen:          { type: String, enum: ['Yes', 'No'], default: 'Yes' },
    description:      { type: String, default: '' },

    // Construction Details
    constructionYear: { type: Number, default: 0 },
    developerName:    { type: String, default: '' },
    materialsQuality: { type: String, default: '' },   // Tiles, Fittings, Wood, etc.
    earthquakeResistant: { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Features & Amenities
    privatePool:      { type: String, enum: ['Yes', 'No'], default: 'No' },
    garden:           { type: String, enum: ['Yes', 'No'], default: 'No' },
    garage:           { type: String, enum: ['Yes', 'No'], default: 'No' },
    rooftopTerrace:   { type: String, enum: ['Yes', 'No'], default: 'No' },
    servantRoom:      { type: String, enum: ['Yes', 'No'], default: 'No' },
    securitySystem:   { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Price & Financial
    totalPrice:       { type: Number, default: 0 },
  },
  { _id: false }
);

// ── Land Details Sub-document ─────────────────────────────────────────────────
const landDetailsSchema = new mongoose.Schema(
  {
    // Location
    area:              { type: String, default: '' },
    roadAccess:        { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Land Size & Measurement
    totalSize:         { type: Number, default: 0 },   // in Katha
    plotShape:         { type: String, enum: ['Square', 'Rectangle', 'Irregular'], default: 'Rectangle' },

    // Land Type & Usage
    landType:          { type: String, enum: ['Residential', 'Commercial', 'Agricultural'], default: 'Residential' },
    fillingStatus:     { type: String, enum: ['Low land', 'Ready to use'], default: 'Ready to use' },
    constructionReady: { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Legal Information
    khatianNumber:     { type: String, default: '' },
    dagNumber:         { type: String, default: '' },
    landOwnership:     { type: String, enum: ['Single owner', 'Multiple owners'], default: 'Single owner' },
    anyDispute:        { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Utilities & Facilities
    electricityLine:   { type: String, enum: ['Yes', 'No'], default: 'No' },
    gasWaterConnection:{ type: String, enum: ['Yes', 'No'], default: 'No' },
    drainageSystem:    { type: String, enum: ['Yes', 'No'], default: 'No' },

    // Nearby Facilities
    nearbySchool:      { type: String, default: '' },
    nearbyHospital:    { type: String, default: '' },
    nearbyMarket:      { type: String, default: '' },
    futureDevelopment: { type: String, default: '' },

    // Price Info
    totalPrice:        { type: Number, default: 0 },
  },
  { _id: false }
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
      enum:     ['apartment', 'villa', 'land'],
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

    // ── Building Config (drives Unit auto-generation — Apartments) ────────────
    totalFloors:   { type: Number, min: 1, default: 1 },
    unitsPerFloor: { type: Number, min: 1, default: 1 },

    // ── Flat Types (Apartments) ───────────────────────────────────────────────
    flatTypes: [flatTypeSchema],

    // ── Villa Details (Villas category only) ──────────────────────────────────
    villaDetails: { type: villaDetailsSchema, default: undefined },

    // ── Land Details (Land category only) ─────────────────────────────────────
    landDetails: { type: landDetailsSchema, default: undefined },

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
