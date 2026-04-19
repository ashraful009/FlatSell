const Company = require('./company.model');
const User    = require('../auth/user.model');

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Apply to become a vendor (Company Admin)
// @route   POST /api/companies/apply
// @access  Protected (any authenticated user)
// ─────────────────────────────────────────────────────────────────────────────
const applyForVendor = async (req, res) => {
  const { name, email, phone, description, lat, lng, address } = req.body;

  // Validate required fields
  if (!name || !email || !phone || !description) {
    return res.status(400).json({
      success: false,
      message: 'Company name, email, phone and description are required',
    });
  }

  // Trade License PDF is required
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: 'Trade License PDF is required',
    });
  }

  // Check if user already has a pending/approved application
  const existingApplication = await Company.findOne({ ownerId: req.user._id });
  if (existingApplication) {
    return res.status(409).json({
      success: false,
      message: `You already have a ${existingApplication.status} application. Please wait for review.`,
    });
  }

  // req.file.path = Cloudinary secure_url (set by multer-storage-cloudinary)
  const tradeLicenseUrl = req.file.path;

  const company = await Company.create({
    name,
    email,
    phone,
    description,
    location: {
      address: address || '',
      lat:     parseFloat(lat) || 0,
      lng:     parseFloat(lng) || 0,
    },
    tradeLicense: tradeLicenseUrl,
    ownerId:      req.user._id,
  });

  res.status(201).json({
    success: true,
    message: 'Your vendor application has been submitted! We will review it within 3–5 business days.',
    data:    { company },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all companies (Super Admin)
// @route   GET /api/companies
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllCompanies = async (req, res) => {
  const { status } = req.query; // ?status=pending | approved | rejected
  const filter = status ? { status } : {};
  const companies = await Company.find(filter)
    .populate('ownerId', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { companies } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get approved companies (public)
// @route   GET /api/companies/approved
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getApprovedCompanies = async (req, res) => {
  const companies = await Company.find({ status: 'approved' })
    .select('name email description location logo')
    .sort('-approvedAt');

  res.status(200).json({ success: true, data: { companies } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single company (public)
// @route   GET /api/companies/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getCompany = async (req, res) => {
  const company = await Company.findById(req.params.id).populate('ownerId', 'name email');
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }
  res.status(200).json({ success: true, data: { company } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update company status (Super Admin)
// @route   PUT /api/companies/:id/status
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const updateCompanyStatus = async (req, res) => {
  const { status, rejectedReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
  }

  const company = await Company.findById(req.params.id).populate('ownerId');
  if (!company) {
    return res.status(404).json({ success: false, message: 'Company not found' });
  }

  company.status         = status;
  company.rejectedReason = rejectedReason || '';
  if (status === 'approved') {
    company.approvedAt = new Date();

    // ── Promote user to Company Admin role ───────────────────────────────
    const user = await User.findById(company.ownerId._id);
    if (user && !user.roles.includes('Company Admin')) {
      user.roles.push('Company Admin');
      await user.save();
    }
  }

  await company.save();

  res.status(200).json({
    success: true,
    message: `Company ${status} successfully`,
    data:    { company },
  });
};

module.exports = {
  applyForVendor,
  getAllCompanies,
  getApprovedCompanies,
  getCompany,
  updateCompanyStatus,
};
