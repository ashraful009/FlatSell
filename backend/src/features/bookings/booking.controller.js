const Booking   = require('./booking.model');
const Unit      = require('../units/unit.model');
const Property  = require('../properties/property.model');
const Company   = require('../companies/company.model');
const User      = require('../auth/user.model');
const Commission = require('../commissions/commission.model');
const generateInvoicePDF           = require('../../utils/generateInvoicePDF');
const generateReportPDF            = require('../../utils/generateReportPDF');
const { sendPaymentConfirmationEmail } = require('../../utils/sendEmail');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Request a booking for an available unit
// @route   POST /api/bookings
// @access  Protected (Any authenticated user can book)
// ─────────────────────────────────────────────────────────────────────────────
const createBooking = async (req, res) => {
  const { unitId, message } = req.body;

  if (!unitId) {
    return res.status(400).json({ success: false, message: 'unitId is required' });
  }

  // Find the unit and check its availability
  const unit = await Unit.findById(unitId).populate('propertyId');
  if (!unit) {
    return res.status(404).json({ success: false, message: 'Unit not found' });
  }

  if (unit.status !== 'available') {
    return res.status(400).json({ success: false, message: `Unit is already ${unit.status}` });
  }

  // Create the booking
  const booking = await Booking.create({
    propertyId: unit.propertyId._id,
    unitId:     unit._id,
    customerId: req.user._id,
    companyId:  unit.propertyId.companyId,
    message:    message || '',
  });

  // Temporarily mark the unit as booked so others can't request it simultaneously
  // (Vendor can confirm or reject it later)
  unit.status = 'booked';
  unit.bookedBy = req.user._id;
  await unit.save();

  res.status(201).json({
    success: true,
    message: 'Booking request sent successfully! The company will review it shortly.',
    data: { booking },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user's bookings (Customer)
// @route   GET /api/bookings/my
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const getMyBookings = async (req, res) => {
  const bookings = await Booking.find({ customerId: req.user._id })
    .populate({
      path: 'propertyId',
      select: 'title address city mainImage galleryImages category price villaDetails landDetails flatTypes',
    })
    .populate({
      path: 'unitId',
      select: 'floor unitNumber type price',
    })
    .populate('companyId', 'name phone email')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { bookings } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get company bookings (Company Admin / Seller)
// @route   GET /api/bookings/company
// @access  Company Admin / Seller
// ─────────────────────────────────────────────────────────────────────────────
const getCompanyBookings = async (req, res) => {
  // Find the company owned by this user
  const company = await Company.findOne({ ownerId: req.user._id });
  if (!company) {
    return res.status(403).json({ success: false, message: 'Company not found' });
  }

  const bookings = await Booking.find({ companyId: company._id })
    .populate('customerId', 'name email phone avatar')
    .populate('propertyId', 'title')
    .populate('unitId', 'floor unitNumber')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { bookings } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update booking status (Company Admin / Seller)
// @route   PUT /api/bookings/:id/status
// @access  Company Admin / Seller
// ─────────────────────────────────────────────────────────────────────────────
const updateBookingStatus = async (req, res) => {
  const { status } = req.body;

  if (!['confirmed', 'rejected', 'cancelled'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid booking status' });
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  booking.status = status;
  await booking.save();

  // If rejected or cancelled, release the unit back to 'available'
  if (status === 'rejected' || status === 'cancelled') {
    const unit = await Unit.findById(booking.unitId);
    if (unit) {
      unit.status = 'available';
      unit.bookedBy = null;
      await unit.save();
    }
  }

  // If confirmed, you could theoretically change it to 'sold' depending on business logic, 
  // but we'll leave it as 'booked' and let them manually mark as 'sold' once payment is done.

  res.status(200).json({
    success: true,
    message: `Booking ${status} successfully`,
    data: { booking },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Confirm booking from Stripe checkout success
// @route   POST /api/bookings/confirm
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const confirmStripeBooking = async (req, res) => {
  const { sessionId } = req.body;

  if (!sessionId) {
    return res.status(400).json({ success: false, message: 'sessionId is required' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({ success: false, message: 'Payment not successful' });
    }

    const { bookingId, unitId, userId, type } = session.metadata;

    // ── Due payment confirmation ──────────────────────────────────────────
    if (type === 'due') {
      const booking = await Booking.findById(bookingId);
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Booking not found' });
      }

      if (booking.paymentStatus === 'fully_paid') {
        return res.status(200).json({
          success: true,
          message: 'Payment already confirmed',
          data: { booking },
        });
      }

      // Add the paid amount to the existing bookingAmount
      let paidAmount = session.amount_total / 100;
      if (session.metadata?.exactBdtAmount) {
        paidAmount = Number(session.metadata.exactBdtAmount);
      } else if (session.currency && session.currency.toLowerCase() === 'usd') {
        paidAmount = paidAmount * 120;
      }
      
      booking.bookingAmount = (booking.bookingAmount || 0) + paidAmount;

      // Check if the property is now fully paid
      if (booking.bookingAmount >= booking.totalPrice) {
        booking.paymentStatus = 'fully_paid';
        
        // Mark unit as sold
        const unit = await Unit.findById(booking.unitId);
        if (unit) {
          unit.status = 'sold';
          await unit.save();
        }
      }

      await booking.save();

      return res.status(200).json({
        success: true,
        message: booking.paymentStatus === 'fully_paid' 
          ? 'Full payment confirmed! Property is now yours.' 
          : `Partial payment of ৳${paidAmount.toLocaleString()} confirmed.`,
        data: { booking },
      });
    }

    // ── Booking payment confirmation ─────────────────────────────────────
    // Try to find existing booking by ID first, then by unitId+userId
    let booking = bookingId
      ? await Booking.findById(bookingId)
      : await Booking.findOne({ unitId, customerId: userId });

    if (!booking) {
      // Create booking if it doesn't exist (fallback for edge cases)
      const unit = await Unit.findById(unitId).populate('propertyId');
      if (!unit) {
        return res.status(404).json({ success: false, message: 'Unit not found' });
      }

      let fallbackPaidAmount = session.amount_total / 100;
      if (session.metadata?.exactBdtAmount) {
        fallbackPaidAmount = Number(session.metadata.exactBdtAmount);
      } else if (session.currency && session.currency.toLowerCase() === 'usd') {
        fallbackPaidAmount = fallbackPaidAmount * 120;
      }

      booking = await Booking.create({
        propertyId:   unit.propertyId._id,
        unitId:       unit._id,
        customerId:   userId,
        companyId:    unit.propertyId.companyId,
        status:       'confirmed',
        paymentStatus:'booking_paid',
        bookingAmount: fallbackPaidAmount,
      });

      unit.status = 'booked';
      unit.bookedBy = userId;
      await unit.save();
    } else {
      // Update existing booking
      booking.status = 'confirmed';
      booking.paymentStatus = 'booking_paid';
      booking.bookingStripeSessionId = sessionId;
      await booking.save();
    }

    // ── Generate Commission Record 
    await booking.populate('propertyId', 'category');
    
    if (booking.propertyId && booking.totalPrice) {
      const category = booking.propertyId.category;
      let commissionPercentage = 0;
      
      if (category === 'apartment') commissionPercentage = 3;
      else if (category === 'land') commissionPercentage = 5;
      else if (category === 'villa') commissionPercentage = 7;
      
      if (commissionPercentage > 0) {
        const commissionAmount = Math.round(booking.totalPrice * (commissionPercentage / 100));
        
        await Commission.findOneAndUpdate(
          { bookingId: booking._id },
          {
            propertyId: booking.propertyId._id,
            companyId: booking.companyId,
            category: category,
            totalPrice: booking.totalPrice,
            commissionPercentage,
            commissionAmount,
          },
          { upsert: true, new: true }
        );
      }
    }

    // ── Send Confirmation Email + PDF ─────────────────────────────────
    try {
      const fullBooking = await Booking.findById(booking._id)
        .populate('propertyId', 'title category city address price villaDetails landDetails flatTypes')
        .populate('companyId',  'name email phone')
        .populate('customerId', 'name email phone');

      if (fullBooking) {
        const pdfBuffer = await generateInvoicePDF({
          booking:  fullBooking,
          property: fullBooking.propertyId,
          company:  fullBooking.companyId,
          customer: fullBooking.customerId,
        });

        // Fire-and-forget — don't block the API response
        sendPaymentConfirmationEmail({
          customer:  fullBooking.customerId,
          property:  fullBooking.propertyId,
          company:   fullBooking.companyId,
          booking:   fullBooking,
          pdfBuffer,
        }).catch((e) => console.error('❌ Invoice email error:', e.message));
      }
    } catch (emailErr) {
      console.error('❌ PDF/Email generation error (non-fatal):', emailErr.message);
    }

    res.status(200).json({
      success: true,
      message: 'Booking confirmed successfully',
      data: { booking },
    });
  } catch (error) {
    console.error('Stripe Confirm Error:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm booking from Stripe session' });
  }
};

// ───────────────────────────────────────────────────────────────────────────────
// @desc    Download invoice PDF for a specific booking
// @route   GET /api/bookings/:id/invoice
// @access  Protected (customer who owns the booking, or Admin)
// ───────────────────────────────────────────────────────────────────────────────
const getBookingInvoice = async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('propertyId', 'title category city address price villaDetails landDetails flatTypes')
    .populate('companyId',  'name email phone')
    .populate('customerId', 'name email phone');

  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  // Only owner or Super Admin can download
  const isOwner = String(booking.customerId?._id) === String(req.user._id);
  const isAdmin = req.user.roles?.includes('Super Admin');
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to download this invoice' });
  }

  const pdfBuffer = await generateInvoicePDF({
    booking,
    property: booking.propertyId,
    company:  booking.companyId,
    customer: booking.customerId,
  });

  const filename = `FlatSell-Invoice-${booking._id.toString().slice(-8).toUpperCase()}.pdf`;
  res.setHeader('Content-Type',        'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length',      pdfBuffer.length);
  res.end(pdfBuffer);
};

// ───────────────────────────────────────────────────────────────────────────────
// @desc    Get sales report data (Company Admin = own | Super Admin = all)
// @route   GET /api/bookings/sales-report
// @access  Company Admin / Super Admin
// ───────────────────────────────────────────────────────────────────────────────
const getSalesReport = async (req, res) => {
  const { startDate, endDate } = req.query;
  const isAdmin = req.user.roles?.includes('Super Admin');

  const query = {
    status:        'confirmed',
    paymentStatus: { $in: ['booking_paid', 'fully_paid'] },
  };

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
  }

  // Company Admin sees only their bookings
  if (!isAdmin) {
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return res.status(403).json({ success: false, message: 'Company not found' });
    }
    query.companyId = company._id;
  }

  const bookings = await Booking.find(query)
    .populate('propertyId', 'title category city')
    .populate('companyId',  'name')
    .populate('customerId', 'name email')
    .populate('unitId',     'floor unitNumber')
    .sort('-createdAt');

  res.status(200).json({
    success: true,
    data: { bookings, count: bookings.length },
  });
};

// ───────────────────────────────────────────────────────────────────────────────
// @desc    Download sales report as PDF
// @route   GET /api/bookings/sales-report/pdf
// @access  Company Admin / Super Admin
// ───────────────────────────────────────────────────────────────────────────────
const getSalesReportPDF = async (req, res) => {
  const { startDate, endDate } = req.query;
  const isAdmin = req.user.roles?.includes('Super Admin');

  const query = {
    status:        'confirmed',
    paymentStatus: { $in: ['booking_paid', 'fully_paid'] },
  };

  let subtitle   = 'Platform-Wide';
  let dateRange  = 'All Time';

  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    };
    const fmtDate = (d) => new Date(d).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' });
    dateRange = `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
  }

  if (!isAdmin) {
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) {
      return res.status(403).json({ success: false, message: 'Company not found' });
    }
    query.companyId = company._id;
    subtitle = company.name;
  }

  const bookings = await Booking.find(query)
    .populate('propertyId', 'title category city')
    .populate('companyId',  'name')
    .populate('customerId', 'name email')
    .sort('-createdAt');

  const fmt = (n) => `৳${Number(n || 0).toLocaleString()}`;

  const rows = bookings.map((b, i) => [
    i + 1,
    b.propertyId?.title || '—',
    b.companyId?.name   || '—',
    b.customerId?.name  || '—',
    (b.propertyId?.category || '').toUpperCase(),
    b.paymentStatus === 'fully_paid' ? 'Fully Paid' : 'Booking Paid',
    fmt(b.totalPrice),
    fmt(b.bookingAmount),
    new Date(b.createdAt).toLocaleDateString('en-BD'),
  ]);

  const totalRevenue = bookings.reduce((s, b) => s + (b.paymentStatus === 'fully_paid' ? b.totalPrice : b.bookingAmount || 0), 0);

  const pdfBuffer = await generateReportPDF({
    title:       'Booked Properties — Sales Report',
    subtitle,
    dateRange,
    columns:    ['#', 'Property', 'Company', 'Customer', 'Category', 'Status', 'Total Price', 'Paid', 'Date'],
    colWidths:  [22, 90, 72, 68, 56, 56, 60, 52, 55],
    rows,
    summaryRows: [
      { label: 'Total Bookings', value: bookings.length },
      { label: 'Total Revenue Collected', value: fmt(totalRevenue) },
    ],
  });

  const filename = `FlatSell-Sales-Report-${Date.now()}.pdf`;
  res.setHeader('Content-Type',        'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Length',      pdfBuffer.length);
  res.end(pdfBuffer);
};

module.exports = {
  createBooking,
  getMyBookings,
  getCompanyBookings,
  updateBookingStatus,
  confirmStripeBooking,
  getBookingInvoice,
  getSalesReport,
  getSalesReportPDF,
};
