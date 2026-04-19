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
      enum:    ['unpaid', 'paid'],
      default: 'unpaid',
    },
    message: {
      type:    String,
      trim:    true,
      default: '',
    },
    
    // ── Amount (Optional/Future for online payments) ────────────────────────
    bookingAmount: {
      type:    Number,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
