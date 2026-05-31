const mongoose       = require('mongoose');
const RefundRequest  = require('./refundRequest.model');
const Booking        = require('../bookings/booking.model');
const Unit           = require('../units/unit.model');
const Company        = require('../companies/company.model');
const VendorLedger   = require('../vendorLedger/vendorLedger.model');
const Commission     = require('../commissions/commission.model');
const PlatformSettings = require('../settings/platformSettings.model');
const { logAudit }     = require('../audit/audit.service');
const { isWithinRefundWindow, daysBetween } = require('../../utils/dateUtils');
const {
  sendRefundApprovedEmail,
  sendVendorRefundDeductionEmail,
} = require('../../utils/sendEmail');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Customer requests a voluntary refund for their booking
// @route   POST /api/bookings/:id/request-refund
// @access  Protected (booking owner)
// ─────────────────────────────────────────────────────────────────────────────
const requestRefund = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid booking id.' });
  }

  const settings        = await PlatformSettings.getSettings();
  const windowDays      = settings.refundWindowDays;
  const retentionPct    = settings.refundRetentionPercentage;

  const booking = await Booking.findById(id)
    .populate('propertyId', 'title category city address')
    .populate('companyId',  'name email')
    .populate('customerId', 'name email');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }
  if (String(booking.customerId?._id) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized for this booking.' });
  }

  // ── Guard rails ────────────────────────────────────────────────────────
  if (booking.refundStatus && booking.refundStatus !== 'none') {
    return res.status(400).json({ success: false, message: 'A refund has already been requested for this booking.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'This booking is already cancelled and is not eligible for a refund.' });
  }

  // ── Window check (within 1 month of booking date) ───────────────────────
  if (!isWithinRefundWindow(booking.createdAt, windowDays)) {
    const elapsed = daysBetween(booking.createdAt);
    return res.status(400).json({
      success: false,
      message: `Refund period has expired. Refunds are only accepted within ${windowDays} days of booking (it has been ${elapsed} days). No refund can be issued.`,
    });
  }

  // ── Amount maths ─────────────────────────────────────────────────────────
  const amountPaid = booking.bookingAmount || 0;
  if (amountPaid <= 0) {
    return res.status(400).json({ success: false, message: 'No payment has been made on this booking, so there is nothing to refund.' });
  }
  const retentionAmount = Math.round(amountPaid * (retentionPct / 100));
  const refundAmount    = amountPaid - retentionAmount; // remaining 80%

  // ── Create the refund record (auto-approved; deduction happens now) ──────
  const refund = await RefundRequest.create({
    bookingId:           booking._id,
    customerId:          booking.customerId._id,
    companyId:           booking.companyId._id,
    amountPaid,
    refundAmount,
    retentionAmount,
    retentionPercentage: retentionPct,
    status:              'approved',
    processedAt:         new Date(),
    processedBy:         null, // system auto-approval
    notes:               'Auto-approved on request per Policy 2.',
  });

  // Fetch Super Admin platform commission (margin) for this booking
  const commission = await Commission.findOne({ bookingId: booking._id });
  const commissionAmount = commission ? commission.commissionAmount : 0;

  // Total amount deducted from vendor wallet: refund to customer (80%) + platform margin
  const totalVendorDeduction = refundAmount + commissionAmount;

  // ── Debit the VENDOR's wallet (not the platform) + write ledger ──────────
  const company = await Company.findById(booking.companyId._id);
  let newBalance = 0;
  if (company) {
    company.walletBalance = (company.walletBalance || 0) - totalVendorDeduction;
    newBalance = company.walletBalance;
    await company.save();

    await VendorLedger.create({
      companyId:       company._id,
      type:            'refund_debit',
      amount:          -totalVendorDeduction,
      balanceAfter:    newBalance,
      bookingId:       booking._id,
      refundRequestId: refund._id,
      notes:           `Refund to customer: ৳${refundAmount.toLocaleString()} + Platform Commission Paid: ৳${commissionAmount.toLocaleString()}`,
    });
  }

  // ── Update the booking ────────────────────────────────────────────────────
  booking.refundStatus       = 'approved';
  booking.refundRequestedAt  = refund.requestedAt;
  booking.refundAmount       = refundAmount;
  booking.retentionAmount    = retentionAmount;
  booking.status             = 'cancelled';
  booking.cancellationReason = 'refund_requested';
  booking.cancelledAt        = new Date();
  booking.noRefund           = false;
  await booking.save();

  // ── Release the unit ──────────────────────────────────────────────────────
  const unit = await Unit.findById(booking.unitId);
  if (unit && unit.status !== 'sold') {
    unit.status   = 'available';
    unit.bookedBy = null;
    await unit.save();
  }

  // ── Audit trail ────────────────────────────────────────────────────────────
  await logAudit({
    action:      'refund_requested',
    userId:      booking.customerId._id,
    bookingId:   booking._id,
    performedBy: req.user._id,
    notes:       `Refund requested & approved: paid ${amountPaid}, retained ${retentionAmount} (${retentionPct}%), refunded ${refundAmount} from vendor wallet.`,
    meta:        { amountPaid, refundAmount, retentionAmount, retentionPct, vendorBalanceAfter: newBalance },
  });

  // ── Notifications (fire-and-forget) ──────────────────────────────────────
  sendRefundApprovedEmail({
    customer:        booking.customerId,
    property:        booking.propertyId,
    refundAmount,
    retentionAmount,
    amountPaid,
  }).catch((e) => console.error('❌ Refund (customer) email failed:', e.message));

  if (booking.companyId?.email) {
    sendVendorRefundDeductionEmail({
      vendorEmail:   booking.companyId.email,
      companyName:   booking.companyId.name,
      property:      booking.propertyId,
      customerName:  booking.customerId.name,
      refundAmount,
      walletBalance: newBalance,
    }).catch((e) => console.error('❌ Refund (vendor) email failed:', e.message));
  }

  res.status(200).json({
    success: true,
    message: `Refund approved. ৳${refundAmount.toLocaleString()} (80%) will be refunded; ৳${retentionAmount.toLocaleString()} (${retentionPct}%) is retained.`,
    data:    { refund, booking },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Super Admin — list all refund requests (read-only oversight)
// @route   GET /api/refunds
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllRefunds = async (req, res) => {
  const { status } = req.query;
  const query = {};
  if (status && ['pending', 'approved', 'rejected', 'completed'].includes(status)) {
    query.status = status;
  }

  const refunds = await RefundRequest.find(query)
    .populate('customerId', 'name email')
    .populate('companyId',  'name email')
    .populate({ path: 'bookingId', select: 'propertyId unitId', populate: { path: 'propertyId', select: 'title' } })
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { refunds, count: refunds.length } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Vendor — incoming refund deductions for their own company
// @route   GET /api/refunds/vendor
// @access  Company Admin / seller
// ─────────────────────────────────────────────────────────────────────────────
const getVendorRefunds = async (req, res) => {
  const company = await Company.findOne({ ownerId: req.user._id });
  if (!company) {
    return res.status(403).json({ success: false, message: 'Company not found for this user.' });
  }

  const refunds = await RefundRequest.find({ companyId: company._id })
    .populate('customerId', 'name email')
    .populate({ path: 'bookingId', select: 'propertyId', populate: { path: 'propertyId', select: 'title' } })
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: { refunds, walletBalance: company.walletBalance || 0, count: refunds.length },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Super Admin — mark a refund as completed (money disbursed)
// @route   PATCH /api/refunds/:id/complete
// @access  Super Admin
// NOTE: The 20% deduction rule is NOT editable here — only the lifecycle status.
// ─────────────────────────────────────────────────────────────────────────────
const completeRefund = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid refund id.' });
  }

  const refund = await RefundRequest.findById(id);
  if (!refund) {
    return res.status(404).json({ success: false, message: 'Refund request not found.' });
  }
  if (refund.status === 'completed') {
    return res.status(400).json({ success: false, message: 'Refund is already completed.' });
  }

  refund.status      = 'completed';
  refund.processedAt = new Date();
  refund.processedBy = req.user._id;
  await refund.save();

  await Booking.findByIdAndUpdate(refund.bookingId, { refundStatus: 'completed' });

  await logAudit({
    action:      'refund_completed',
    userId:      refund.customerId,
    bookingId:   refund.bookingId,
    performedBy: req.user._id,
    notes:       `Refund of ${refund.refundAmount} marked completed (disbursed).`,
  });

  res.status(200).json({ success: true, message: 'Refund marked as completed.', data: { refund } });
};

module.exports = {
  requestRefund,
  getAllRefunds,
  getVendorRefunds,
  completeRefund,
};
