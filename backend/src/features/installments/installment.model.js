const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// Installment Schema
// ─────────────────────────────────────────────────────────────────────────────
// One document per scheduled installment. Pre-generated up-front when the
// customer locks in their installment plan, so the full schedule is queryable
// and individual line items can be paid independently.
//
// Tier policy (extraChargePercentage):
//   1–4   installments → 0%
//   5–12  installments → 7%
//   13–24 installments → 12%
//
// Late fee: a flat 5,000 BDT is appended at payment time if the current date
// is past the installment's `dueDate` (the 15th of its month).
// ─────────────────────────────────────────────────────────────────────────────

const installmentSchema = new mongoose.Schema(
  {
    // ── References ─────────────────────────────────────────────────────────
    bookingId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Booking',
      required: true,
      index:    true,
    },
    customerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    propertyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Property',
      required: true,
    },
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
    },

    // ── Plan-wide info (denormalised for quick reads) ──────────────────────
    totalInstallments:     { type: Number, required: true, min: 1, max: 24 },
    extraChargePercentage: { type: Number, required: true, default: 0      },

    // ── This installment's slot in the schedule ────────────────────────────
    installmentNumber: { type: Number, required: true, min: 1 },   // 1-based
    dueDate:           { type: Date,   required: true        },   // 15th of month

    // ── Amounts ────────────────────────────────────────────────────────────
    baseAmount:   { type: Number, required: true },   // principal portion (counts toward bookingAmount)
    extraCharge:  { type: Number, default: 0     },   // service fee for installment plan
    amountDue:    { type: Number, required: true },   // baseAmount + extraCharge (charged amount, before late fee)

    // ── Payment state ──────────────────────────────────────────────────────
    status:          { type: String, enum: ['pending', 'paid'], default: 'pending', index: true },
    paidAt:          { type: Date,   default: null },
    paidAmount:      { type: Number, default: 0   }, // what was actually paid (amountDue + lateFee)
    lateFee:         { type: Number, default: 0   }, // 0 or 5,000
    stripeSessionId: { type: String, default: null },
  },
  { timestamps: true }
);

// Each booking has a unique installmentNumber per row
installmentSchema.index({ bookingId: 1, installmentNumber: 1 }, { unique: true });

module.exports = mongoose.model('Installment', installmentSchema);
