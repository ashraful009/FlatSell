const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// RefundRequest — one record per voluntary refund (Policy 2).
//
// A customer may request a refund within the configured window (default 1 month)
// of the booking date. A fixed, settings-controlled percentage (default 20%) is
// retained; the remaining 80% is refunded and DEBITED from the vendor's wallet.
//
// The deduction happens at request time, so a request is created already in the
// `approved` state; the Super Admin later marks it `completed` once the money has
// actually been disbursed. The 20%/80% split is never editable per-request.
// ─────────────────────────────────────────────────────────────────────────────
const refundRequestSchema = new mongoose.Schema(
  {
    bookingId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Booking',
      required: true,
      unique:   true, // one refund per booking
      index:    true,
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true, index: true },
    companyId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },

    requestedAt:     { type: Date,   default: Date.now },
    amountPaid:      { type: Number, required: true },           // total the customer had paid
    refundAmount:    { type: Number, required: true },           // 80% (returned)
    retentionAmount: { type: Number, required: true },           // 20% (kept)
    retentionPercentage: { type: Number, required: true },       // snapshot of the % at request time

    status: {
      type:    String,
      enum:    ['pending', 'approved', 'rejected', 'completed'],
      default: 'approved',
      index:   true,
    },
    processedAt: { type: Date, default: null },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    notes:       { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('RefundRequest', refundRequestSchema);
