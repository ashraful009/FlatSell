const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // ── References ──────────────────────────────────────────────────────────
    propertyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Property',
      required: true,
    },
    unitId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Unit',
      required: true,
    },
    customerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
    },

    // ── Details ─────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'rejected', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type:    String,
      enum:    ['unpaid', 'booking_paid', 'fully_paid'],
      default: 'unpaid',
    },
    message: {
      type:    String,
      trim:    true,
      default: '',
    },
    
    // ── Financial Tracking ──────────────────────────────────────────────────
    totalPrice: {
      type:    Number,
      default: null,
    },
    bookingMoneyPercentage: {
      type:    Number,
      default: 20,
    },
    bookingAmount: {
      type:    Number,
      default: null,
    },

    // ── KYC Data ────────────────────────────────────────────────────────────
    kycData: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Document uploads (Cloudinary URLs) ──────────────────────────────────
    documents: {
      type:    mongoose.Schema.Types.Mixed,
      default: null,
    },

    // ── Stripe Session References ───────────────────────────────────────────
    bookingStripeSessionId: {
      type:    String,
      default: null,
    },
    duePaymentStripeSessionId: {
      type:    String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
