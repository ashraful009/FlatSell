const Booking = require('./booking.model');
const Unit    = require('../units/unit.model');
const Property = require('../properties/property.model');
const Company  = require('../companies/company.model');

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
      select: 'title address city images',
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

module.exports = {
  createBooking,
  getMyBookings,
  getCompanyBookings,
  updateBookingStatus,
};
