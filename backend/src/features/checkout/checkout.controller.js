const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Unit     = require('../units/unit.model');
const Property = require('../properties/property.model');
const Booking  = require('../bookings/booking.model');
const BookingPolicy = require('../policies/bookingPolicy.model');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: Calculate total price for a unit/property based on category
// ─────────────────────────────────────────────────────────────────────────────
const calculateTotalPrice = (property, unit) => {
  const cat = property.category;

  if (cat === 'apartment' && property.flatTypes?.length > 0) {
    // Use flat type price based on unit column mapping
    const match = unit.unitNumber?.match(/\d+([A-Z]+)/i);
    if (match) {
      const colIndex = match[1].charCodeAt(0) - 65;
      const typeIndex = Math.min(colIndex, property.flatTypes.length - 1);
      const flatType = property.flatTypes[typeIndex];
      if (flatType?.pricePerUnit) return flatType.pricePerUnit;
    }
    // Fallback to property price
    return property.price || 0;
  }

  if (cat === 'villa' && property.villaDetails?.totalPrice) {
    return property.villaDetails.totalPrice;
  }

  if (cat === 'land' && property.landDetails?.totalPrice) {
    return property.landDetails.totalPrice;
  }

  // Fallback
  return property.price || 0;
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Stripe Checkout Session for booking payment
// @route   POST /api/checkout/create-session
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const createCheckoutSession = async (req, res) => {
  const { unitId, message, kycData, documents } = req.body;

  if (!unitId) {
    return res.status(400).json({ success: false, message: 'unitId is required' });
  }

  // Find the unit and populate property
  const unit = await Unit.findById(unitId).populate('propertyId');
  if (!unit) {
    return res.status(404).json({ success: false, message: 'Unit not found' });
  }

  if (unit.status !== 'available') {
    return res.status(400).json({ success: false, message: `Unit is already ${unit.status}` });
  }

  const property = unit.propertyId;
  const totalPrice = calculateTotalPrice(property, unit);

  if (totalPrice <= 0) {
    return res.status(400).json({ success: false, message: 'Invalid total price (0)' });
  }

  // ── Get booking money percentage from policy (or default 20%) ──────────
  let bookingMoneyPercentage = 20;
  try {
    const policy = await BookingPolicy.findOne({
      companyId: property.companyId,
      category:  property.category,
    });
    if (policy?.bookingMoneyPercentage) {
      bookingMoneyPercentage = policy.bookingMoneyPercentage;
    }
  } catch {
    // Use default
  }

  const bookingAmount = Math.round(totalPrice * (bookingMoneyPercentage / 100));

  if (bookingAmount <= 0) {
    return res.status(400).json({ success: false, message: 'Calculated booking amount is 0' });
  }

  // ── Create pending booking record ──────────────────────────────────────
  let booking = await Booking.findOne({ unitId, customerId: req.user._id });
  if (!booking) {
    booking = await Booking.create({
      propertyId:           property._id,
      unitId:               unit._id,
      customerId:           req.user._id,
      companyId:            property.companyId,
      message:              message || '',
      totalPrice,
      bookingMoneyPercentage,
      bookingAmount,
      kycData:              kycData || null,
      documents:            documents || null,
      status:               'pending',
      paymentStatus:        'unpaid',
    });

    // Mark unit as booked
    unit.status = 'booked';
    unit.bookedBy = req.user._id;
    await unit.save();
  }

  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&type=booking`;
    const cancelUrl  = `${clientUrl}/property/${property._id}?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: `Booking Money for ${property.title}${unit.unitNumber ? ` - Unit ${unit.unitNumber}` : ''}`,
              description: `${bookingMoneyPercentage}% of total price ৳${totalPrice.toLocaleString()} | Category: ${property.category}`,
            },
            unit_amount: bookingAmount * 100, // Stripe expects smallest currency unit
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata: {
        bookingId: booking._id.toString(),
        unitId:    unit._id.toString(),
        userId:    req.user._id.toString(),
        type:      'booking',
      },
    });

    // Save stripe session reference
    booking.bookingStripeSessionId = session.id;
    await booking.save();

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId:   session.id,
    });
  } catch (error) {
    console.error('Stripe Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create checkout session. Check Stripe API Keys.' });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create Stripe Checkout Session for due/remaining payment
// @route   POST /api/checkout/create-due-session
// @access  Protected
// ─────────────────────────────────────────────────────────────────────────────
const createDuePaymentSession = async (req, res) => {
  const { bookingId } = req.body;

  if (!bookingId) {
    return res.status(400).json({ success: false, message: 'bookingId is required' });
  }

  const booking = await Booking.findById(bookingId).populate('propertyId');
  if (!booking) {
    return res.status(404).json({ success: false, message: 'Booking not found' });
  }

  if (String(booking.customerId) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  if (booking.paymentStatus !== 'booking_paid') {
    return res.status(400).json({ success: false, message: 'Booking money has not been paid yet, or already fully paid.' });
  }

  const dueAmount = (booking.totalPrice || 0) - (booking.bookingAmount || 0);
  if (dueAmount <= 0) {
    return res.status(400).json({ success: false, message: 'No due amount remaining' });
  }

  const property = booking.propertyId;

  try {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const successUrl = `${clientUrl}/booking-success?session_id={CHECKOUT_SESSION_ID}&type=due`;
    const cancelUrl  = `${clientUrl}/customer-dashboard/my-properties?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: req.user.email,
      line_items: [
        {
          price_data: {
            currency: 'bdt',
            product_data: {
              name: `Due Payment for ${property?.title || 'Property'}`,
              description: `Remaining balance: ৳${dueAmount.toLocaleString()}`,
            },
            unit_amount: dueAmount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url:  cancelUrl,
      metadata: {
        bookingId: booking._id.toString(),
        userId:    req.user._id.toString(),
        type:      'due',
      },
    });

    booking.duePaymentStripeSessionId = session.id;
    await booking.save();

    res.status(200).json({
      success: true,
      checkoutUrl: session.url,
      sessionId:   session.id,
    });
  } catch (error) {
    console.error('Stripe Due Payment Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create due payment session.' });
  }
};

module.exports = {
  createCheckoutSession,
  createDuePaymentSession,
};
