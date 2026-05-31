const mongoose = require('mongoose');

// ─────────────────────────────────────────────────────────────────────────────
// VendorLedger — append-only money movements against a vendor (Company) wallet.
//
// Used by Policy 2 (Voluntary Refund): when a customer's refund is approved,
// the 80% refund amount is DEBITED from the vendor's wallet (Company.walletBalance)
// and a 'refund_debit' row is written here so the vendor — and Super Admin — can
// see exactly why their balance changed.
//
// `balanceAfter` snapshots the wallet balance immediately after this entry so the
// ledger is auditable on its own without replaying every row.
// ─────────────────────────────────────────────────────────────────────────────
const vendorLedgerSchema = new mongoose.Schema(
  {
    companyId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Company',
      required: true,
      index:    true,
    },
    type: {
      type:     String,
      enum:     ['refund_debit', 'commission_credit', 'adjustment'],
      required: true,
    },
    // Positive = credit (money in), Negative = debit (money out).
    amount:       { type: Number, required: true },
    balanceAfter: { type: Number, required: true },

    bookingId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Booking',       default: null },
    refundRequestId: { type: mongoose.Schema.Types.ObjectId, ref: 'RefundRequest', default: null },
    notes:           { type: String, default: '' },
  },
  { timestamps: true }
);

vendorLedgerSchema.index({ companyId: 1, createdAt: -1 });

module.exports = mongoose.model('VendorLedger', vendorLedgerSchema);
