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
      index:    true,
    },
    // companyId IS the vendor. Indexed for fast booking-limit lookups (Policy 3).
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },

    // ── Details ─────────────────────────────────────────────────────────────
    status: {
      type:    String,
      enum:    ['pending', 'confirmed', 'rejected', 'cancelled'],
      default: 'pending',
      index:   true,
    },
    paymentStatus: {
      type:    String,
      enum:    ['unpaid', 'booking_paid', 'fully_paid'],
      default: 'unpaid',
      index:   true,
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

    // ── Payment activity tracking (Policy 1 — Auto-Cancellation) ────────────
    // Updated to `now` on every successful payment (booking money, due payment,
    // or installment). When unset, the booking's createdAt is treated as the
    // baseline for the inactivity clock.
    lastPaymentDate:     { type: Date, default: null },
    // Set when the 2-month inactivity warning email has been sent, so the cron
    // does not spam the customer every day.
    inactivityWarningSentAt: { type: Date, default: null },
    // Timestamp of the last time the daily cron evaluated this booking.
    autoCancelCheckedAt: { type: Date, default: null },

    // ── Cancellation metadata (Policy 1 & 2) ────────────────────────────────
    cancellationReason: {
      type:    String,
      enum:    ['inactivity', 'manual', 'refund_requested', null],
      default: null,
    },
    cancelledAt: { type: Date, default: null },
    // true when the booking was cancelled with no money returned (inactivity).
    noRefund:    { type: Boolean, default: false },

    // ── Refund tracking (Policy 2 — Voluntary Refund) ───────────────────────
    refundPolicyAccepted: { type: Boolean, default: false }, // acknowledged at checkout
    refundRequestedAt:    { type: Date,    default: null },
    refundStatus: {
      type:    String,
      enum:    ['none', 'pending', 'approved', 'rejected', 'completed'],
      default: 'none',
    },
    refundAmount:    { type: Number, default: 0 }, // 80% of amount paid
    retentionAmount: { type: Number, default: 0 }, // 20% retained
  },
  { timestamps: true }
);

// Compound index for the daily auto-cancellation scan (active, unsettled bookings)
bookingSchema.index({ status: 1, paymentStatus: 1 });
// Compound index for Policy 3 per-user / per-vendor active-booking counts
bookingSchema.index({ customerId: 1, companyId: 1, status: 1, paymentStatus: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
