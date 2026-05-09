const BookingPolicy = require('./bookingPolicy.model');
const Company       = require('../companies/company.model');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all booking policies for the authenticated admin's company
// @route   GET /api/booking-policies/my
// @access  Company Admin
// ─────────────────────────────────────────────────────────────────────────────
const getMyBookingPolicies = async (req, res) => {
  const company = await Company.findOne({ ownerId: req.user._id });
  if (!company) {
    return res.status(403).json({ success: false, message: 'Company not found for this user' });
  }

  const policies = await BookingPolicy.find({ companyId: company._id });

  // Return an object keyed by category for easy frontend consumption
  const result = { apartment: null, villa: null, land: null };
  policies.forEach((p) => {
    result[p.category] = p;
  });

  res.status(200).json({ success: true, data: { policies: result, companyId: company._id } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create or update a booking policy for a specific category
// @route   PUT /api/booking-policies/:category
// @access  Company Admin
// ─────────────────────────────────────────────────────────────────────────────
const upsertBookingPolicy = async (req, res) => {
  const { category } = req.params;

  if (!['apartment', 'villa', 'land'].includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category. Must be apartment, villa, or land.' });
  }

  const company = await Company.findOne({ ownerId: req.user._id });
  if (!company) {
    return res.status(403).json({ success: false, message: 'Company not found for this user' });
  }

  const { bookingMoneyPercentage, requiredFields } = req.body;

  const updateData = {};
  if (bookingMoneyPercentage !== undefined) {
    updateData.bookingMoneyPercentage = Math.max(1, Math.min(100, Number(bookingMoneyPercentage)));
  }
  if (requiredFields && typeof requiredFields === 'object') {
    updateData.requiredFields = requiredFields;
  }

  const policy = await BookingPolicy.findOneAndUpdate(
    { companyId: company._id, category },
    { $set: updateData },
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({
    success: true,
    message: `Booking policy for "${category}" updated successfully`,
    data:    { policy },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get booking policy for a specific company & category (checkout use)
// @route   GET /api/booking-policies/company/:companyId/category/:category
// @access  Public (used by customer checkout page)
// ─────────────────────────────────────────────────────────────────────────────
const getBookingPolicyByCompanyAndCategory = async (req, res) => {
  const { companyId, category } = req.params;

  if (!['apartment', 'villa', 'land'].includes(category)) {
    return res.status(400).json({ success: false, message: 'Invalid category' });
  }

  const policy = await BookingPolicy.findOne({ companyId, category });

  // Return default policy if none exists
  if (!policy) {
    return res.status(200).json({
      success: true,
      data: {
        policy: {
          companyId,
          category,
          bookingMoneyPercentage: 20,
          requiredFields: {},
        },
      },
    });
  }

  res.status(200).json({ success: true, data: { policy } });
};

module.exports = {
  getMyBookingPolicies,
  upsertBookingPolicy,
  getBookingPolicyByCompanyAndCategory,
};
