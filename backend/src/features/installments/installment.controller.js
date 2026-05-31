const mongoose    = require('mongoose');
const stripe      = require('stripe')(process.env.STRIPE_SECRET_KEY);

const Installment = require('./installment.model');
const Booking     = require('../bookings/booking.model');
const Unit        = require('../units/unit.model');

const generateInstallmentInvoicePDF  = require('../../utils/generateInstallmentInvoicePDF');
const { sendInstallmentPaymentEmail } = require('../../utils/sendEmail');

// ─────────────────────────────────────────────────────────────────────────────
// Policy constants
// ─────────────────────────────────────────────────────────────────────────────
const MAX_INSTALLMENTS = 24;
const LATE_FEE_BDT     = 5000;

/** Resolve tier → extra-charge percentage. */
const tierExtraPercentage = (n) => {
  if (n <= 4)  return 0;
  if (n <= 12) return 7;
  return 12;            // 13–24
};

/**
 * 15th of the month that is `offset` months after `baseDate`.
 * Example: baseDate=2026-05-17, offset=0 → 2026-05-15; offset=2 → 2026-07-15.
 * Uses local-time month math so day boundaries match the user's calendar view.
 */
const dueDateForMonthOffset = (baseDate, offset) => {
  const d = new Date(baseDate.getFullYear(), baseDate.getMonth() + offset, 15, 23, 59, 59, 999);
  return d;
};

/** True if `now` is strictly after the end of `dueDate` (the cut-off has passed). */
const isOverdue = (dueDate, now = new Date()) => now.getTime() > new Date(dueDate).getTime();

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create an installment plan for a booking and pre-generate all rows
// @route   POST /api/installments/setup
// @body    { bookingId, totalInstallments }
// @access  Protected (booking owner)
// ─────────────────────────────────────────────────────────────────────────────
const setupInstallmentPlan = async (req, res) => {
  const { bookingId, totalInstallments } = req.body;

  if (!bookingId || !mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ success: false, message: 'A valid bookingId is required.' });
  }
  const n = Number(totalInstallments);
  if (!Number.isInteger(n) || n < 1) {
    return res.status(400).json({ success: false, message: 'totalInstallments must be a positive integer.' });
  }
  if (n > MAX_INSTALLMENTS) {
    return res.status(400).json({ success: false, message: `Maximum installment limit is ${MAX_INSTALLMENTS}.` });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'This booking has been cancelled. Installment plans cannot be created.' });
  }
  if (String(booking.customerId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized for this booking.' });
  }
  if (booking.paymentStatus !== 'booking_paid') {
    return res.status(400).json({
      success: false,
      message: 'Installments can only be set up after the booking money is paid and before full payment.',
    });
  }
  if (booking.installmentPlan?.active) {
    return res.status(400).json({ success: false, message: 'An installment plan is already active for this booking.' });
  }

  const dueAmount = (booking.totalPrice || 0) - (booking.bookingAmount || 0);
  if (dueAmount <= 0) {
    return res.status(400).json({ success: false, message: 'There is no remaining due amount to split into installments.' });
  }

  // ── Tier + per-installment amounts ──────────────────────────────────────
  const extraPct = tierExtraPercentage(n);
  const baseEach = Math.floor(dueAmount / n);

  // Build N installment seeds; the LAST row absorbs the rounding remainder so
  // the sum of principal portions equals `dueAmount` exactly.
  const today = new Date();
  const seeds = Array.from({ length: n }, (_, i) => {
    const isLast      = i === n - 1;
    const baseAmount  = isLast ? dueAmount - baseEach * (n - 1) : baseEach;
    const extraCharge = Math.round(baseAmount * extraPct / 100);
    return {
      bookingId:             booking._id,
      customerId:            booking.customerId,
      propertyId:            booking.propertyId,
      companyId:             booking.companyId,
      totalInstallments:     n,
      extraChargePercentage: extraPct,
      installmentNumber:     i + 1,
      dueDate:               dueDateForMonthOffset(today, i),
      baseAmount,
      extraCharge,
      amountDue:             baseAmount + extraCharge,
    };
  });

  // ── Persist plan + rows atomically (best-effort) ────────────────────────
  const session = await mongoose.startSession();
  let installments;
  try {
    await session.withTransaction(async () => {
      installments = await Installment.insertMany(seeds, { session });
      booking.installmentPlan = {
        active:                   true,
        totalCount:               n,
        extraChargePercentage:    extraPct,
        baseAmountPerInstallment: baseEach,
        totalDueAmount:           dueAmount,
        createdAt:                new Date(),
      };
      await booking.save({ session });
    });
  } catch (err) {
    // Standalone Mongo (no replica set) can't run transactions — fall back.
    if (err?.errorLabels?.includes('TransientTransactionError') ||
        err?.code === 20 || /Transaction numbers are only allowed/i.test(err?.message || '')) {
      installments = await Installment.insertMany(seeds);
      booking.installmentPlan = {
        active:                   true,
        totalCount:               n,
        extraChargePercentage:    extraPct,
        baseAmountPerInstallment: baseEach,
        totalDueAmount:           dueAmount,
        createdAt:                new Date(),
      };
      await booking.save();
    } else {
      session.endSession();
      throw err;
    }
  } finally {
    session.endSession();
  }

  res.status(201).json({
    success: true,
    message: `Installment plan created with ${n} installment${n > 1 ? 's' : ''}.`,
    data: {
      plan:         booking.installmentPlan,
      installments,
    },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    List all installments for a booking
// @route   GET /api/installments/booking/:bookingId
// @access  Protected (booking owner or Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
const getBookingInstallments = async (req, res) => {
  const { bookingId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(bookingId)) {
    return res.status(400).json({ success: false, message: 'Invalid bookingId.' });
  }

  const booking = await Booking.findById(bookingId);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found.' });
  }

  const isOwner = String(booking.customerId) === String(req.user._id);
  const isAdmin = req.user.roles?.includes('Super Admin');
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const installments = await Installment.find({ bookingId }).sort({ installmentNumber: 1 });

  // Decorate each row with computed "isOverdue" + "lateFeeIfPaidNow" so the UI
  // can show the warning without re-implementing the rule.
  const decorated = installments.map((i) => {
    const overdue = i.status === 'pending' && isOverdue(i.dueDate);
    return {
      ...i.toObject(),
      isOverdue:         overdue,
      lateFeeIfPaidNow:  overdue ? LATE_FEE_BDT : 0,
      payableNow:        i.status === 'paid' ? 0 : i.amountDue + (overdue ? LATE_FEE_BDT : 0),
    };
  });

  res.status(200).json({
    success: true,
    data: { plan: booking.installmentPlan, installments: decorated, bookingStatus: booking.status },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a Stripe Checkout session for a single installment
//          (auto-appends the 5,000 BDT late fee if past due date)
// @route   POST /api/installments/:id/pay-session
// @access  Protected (booking owner)
// ─────────────────────────────────────────────────────────────────────────────
const createInstallmentPaymentSession = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid installment id.' });
  }

  const installment = await Installment.findById(id);
  if (!installment) {
    return res.status(404).json({ success: false, message: 'Installment not found.' });
  }
  if (String(installment.customerId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized for this installment.' });
  }
  if (installment.status === 'paid') {
    return res.status(400).json({ success: false, message: 'This installment is already paid.' });
  }

  const booking = await Booking.findById(installment.bookingId).populate('propertyId', 'title');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Parent booking not found.' });
  }
  if (booking.status === 'cancelled') {
    return res.status(400).json({ success: false, message: 'This booking has been cancelled. Payments are no longer accepted.' });
  }

  const overdue       = isOverdue(installment.dueDate);
  const lateFee       = overdue ? LATE_FEE_BDT : 0;
  const chargeAmount  = installment.amountDue + lateFee;

  // Stripe BDT limit handling (mirrors the existing booking/due flow)
  let stripeCurrency   = 'bdt';
  let stripeUnitAmount = chargeAmount * 100;
  if (chargeAmount > 999999) {
    stripeCurrency   = 'usd';
    stripeUnitAmount = Math.round(chargeAmount / 120) * 100;
  }

  try {
    const clientUrl  = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&type=installment`;
    const cancelUrl  = `${clientUrl}/customer-dashboard?canceled=true`;

    const propTitle  = booking.propertyId?.title || 'Property';
    const lateNote   = overdue ? ` (incl. ৳${LATE_FEE_BDT.toLocaleString()} late fee)` : '';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode:                 'payment',
      customer_email:       req.user.email,
      line_items: [{
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name:        `Installment ${installment.installmentNumber}/${installment.totalInstallments} — ${propTitle}`,
            description: `Due ${new Date(installment.dueDate).toLocaleDateString('en-BD')}${lateNote}`,
          },
          unit_amount: stripeUnitAmount,
        },
        quantity: 1,
      }],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata: {
        type:           'installment',
        installmentId:  installment._id.toString(),
        bookingId:      installment.bookingId.toString(),
        userId:         req.user._id.toString(),
        exactBdtAmount: chargeAmount.toString(),
        lateFeeApplied: lateFee.toString(),
      },
    });

    installment.stripeSessionId = session.id;
    await installment.save();

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId:   session.id,
      meta: {
        amountDue:   installment.amountDue,
        lateFee,
        chargeAmount,
        overdue,
      },
    });
  } catch (error) {
    console.error('Stripe Installment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create installment payment session.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Confirm an installment payment from a successful Stripe redirect
// @route   POST /api/installments/confirm
// @body    { sessionId }
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const confirmInstallmentPayment = async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId is required.' });
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch (e) {
    return res.status(400).json({ success: false, message: 'Invalid Stripe session.' });
  }

  if (session.payment_status !== 'paid') {
    return res.status(400).json({ success: false, message: 'Payment not successful.' });
  }
  if (session.metadata?.type !== 'installment' || !session.metadata?.installmentId) {
    return res.status(400).json({ success: false, message: 'Session is not for an installment payment.' });
  }

  const installment = await Installment.findById(session.metadata.installmentId);
  if (!installment) {
    return res.status(404).json({ success: false, message: 'Installment not found.' });
  }

  if (installment.status === 'paid') {
    return res.status(200).json({
      success: true,
      message: 'Installment already confirmed.',
      data: { installment },
    });
  }

  // Reconstruct the BDT amount that was paid (handle USD fallback for large amts)
  let paidBdt = session.amount_total / 100;
  if (session.metadata?.exactBdtAmount) {
    paidBdt = Number(session.metadata.exactBdtAmount);
  } else if (session.currency?.toLowerCase() === 'usd') {
    paidBdt = paidBdt * 120;
  }
  const lateFeeApplied = Number(session.metadata?.lateFeeApplied || 0);

  installment.status     = 'paid';
  installment.paidAt     = new Date();
  installment.paidAmount = paidBdt;
  installment.lateFee    = lateFeeApplied;
  await installment.save();

  // ── Roll up: principal portion advances the booking's bookingAmount ─────
  const booking = await Booking.findById(installment.bookingId);
  if (booking) {
    booking.bookingAmount = (booking.bookingAmount || 0) + installment.baseAmount;
    booking.lastPaymentDate = new Date(); // Policy 1: reset the inactivity clock

    // Check if all installments for this booking are paid
    const remaining = await Installment.countDocuments({
      bookingId: booking._id,
      status:    'pending',
    });

    if (remaining === 0 || booking.bookingAmount >= booking.totalPrice) {
      booking.paymentStatus = 'fully_paid';
      const unit = await Unit.findById(booking.unitId);
      if (unit) {
        unit.status = 'sold';
        await unit.save();
      }
    }
    await booking.save();
  }

  // ── Fire-and-forget: invoice PDF + email ────────────────────────────────
  try {
    const fullBooking = await Booking.findById(installment.bookingId)
      .populate('propertyId', 'title category city address')
      .populate('companyId',  'name email phone')
      .populate('customerId', 'name email phone');

    if (fullBooking) {
      const pdfBuffer = await generateInstallmentInvoicePDF({
        booking:     fullBooking,
        installment,
        property:    fullBooking.propertyId,
        company:     fullBooking.companyId,
        customer:    fullBooking.customerId,
      });

      sendInstallmentPaymentEmail({
        customer:    fullBooking.customerId,
        property:    fullBooking.propertyId,
        company:     fullBooking.companyId,
        booking:     fullBooking,
        installment,
        pdfBuffer,
      }).catch((e) => console.error('❌ Installment email error:', e.message));
    }
  } catch (e) {
    console.error('❌ Installment PDF/Email error (non-fatal):', e.message);
  }

  res.status(200).json({
    success: true,
    message: `Installment ${installment.installmentNumber} confirmed.`,
    data: { installment },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Download the invoice PDF for a single paid installment
// @route   GET /api/installments/:id/invoice
// @access  Protected (booking owner or Super Admin)
// ─────────────────────────────────────────────────────────────────────────────
const downloadInstallmentInvoice = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: 'Invalid installment id.' });
  }

  const installment = await Installment.findById(id);
  if (!installment) {
    return res.status(404).json({ success: false, message: 'Installment not found.' });
  }
  if (installment.status !== 'paid') {
    return res.status(400).json({ success: false, message: 'Invoice is only available after the installment is paid.' });
  }

  const isOwner = String(installment.customerId) === String(req.user._id);
  const isAdmin = req.user.roles?.includes('Super Admin');
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized.' });
  }

  const booking = await Booking.findById(installment.bookingId)
    .populate('propertyId', 'title category city address')
    .populate('companyId',  'name email phone')
    .populate('customerId', 'name email phone');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Parent booking not found.' });
  }

  const pdfBuffer = await generateInstallmentInvoicePDF({
    booking,
    installment,
    property: booking.propertyId,
    company:  booking.companyId,
    customer: booking.customerId,
  });

  const filename = `FlatSell-Installment-${installment.installmentNumber}-${installment._id.toString().slice(-8).toUpperCase()}.pdf`;
  res.setHeader('Content-Type',        'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length',      pdfBuffer.length);
  res.end(pdfBuffer);
};

module.exports = {
  setupInstallmentPlan,
  getBookingInstallments,
  createInstallmentPaymentSession,
  confirmInstallmentPayment,
  downloadInstallmentInvoice,
};
