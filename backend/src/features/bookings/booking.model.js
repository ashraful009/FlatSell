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

    // ── Installment Plan (snapshot — line items live in `installments` coll.)
    // When active, the customer pays the remaining `dueAmount` in N
    // monthly installments instead of one lump-sum "due" payment.
    installmentPlan: {
      active:                   { type: Boolean, default: false },
      totalCount:               { type: Number,  default: 0     },  // 1–24
      extraChargePercentage:    { type: Number,  default: 0     },  // 0, 7, or 12
      baseAmountPerInstallment: { type: Number,  default: 0     },  // floor(dueAmount / N)
      totalDueAmount:           { type: Number,  default: 0     },  // dueAmount at plan creation
      createdAt:                { type: Date                    },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Booking', bookingSchema);
