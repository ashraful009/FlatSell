const Property      = require('./property.model');
const Company       = require('../companies/company.model');
const Unit          = require('../units/unit.model');
const BookingPolicy = require('../policies/bookingPolicy.model');
const { generateUnitsForProperty } = require('../units/unit.controller');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse flatTypes from form-data (JSON string)
// ─────────────────────────────────────────────────────────────────────────────
const parseFlatTypes = (raw) => {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: parse JSON object from form-data string (villaDetails / landDetails)
// ─────────────────────────────────────────────────────────────────────────────
const parseJsonObject = (raw) => {
  if (!raw) return undefined;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    return undefined;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Create a new property
//          Super Admin    → auto-approved, appears on homepage immediately
//          Company Admin  → pending, goes to Super Admin review queue
// @route   POST /api/properties
// @access  Company Admin / Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const createProperty = async (req, res) => {
  const {
    title, description, price, address, city,
    category, totalFloors, unitsPerFloor,
    landSize, handoverTime, totalUnitsCount,
    lat, lng, flatTypes: flatTypesRaw,
    villaDetails: villaDetailsRaw,
    landDetails: landDetailsRaw,
  } = req.body;

  if (!title || !description || !price || !address || !city || !category) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  // ── Find company (Super Admin can create under any — or auto-create a platform company)
  const isSuperAdmin = req.user.roles.includes('Super Admin');

  let company;
  if (isSuperAdmin) {
    // Super Admin: use first approved company, or auto-create a "FlatSell Platform" system company
    company = await Company.findOne({ status: 'approved' });
    if (!company) {
      company = await Company.findOneAndUpdate(
        { name: 'FlatSell Platform', ownerId: req.user._id },
        {
          $setOnInsert: {
            name:         'FlatSell Platform',
            email:        req.user.email,
            phone:        '00000000000',
            description:  'Official FlatSell platform listings managed by Super Admin.',
            tradeLicense: 'system',
            ownerId:      req.user._id,
            status:       'approved',
            approvedAt:   new Date(),
            location:     { address: '', lat: 0, lng: 0 },
          },
        },
        { upsert: true, new: true }
      );
    }
  } else {
    company = await Company.findOne({ ownerId: req.user._id, status: 'approved' });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'You must have an approved company to list properties. Your company application may still be pending.',
      });
    }
  }

  // ── Media: multer fields — mainImage (single) + galleryImages (array)
  const files = req.files || {};
  const mainImageUrl    = files.mainImage?.[0]?.path    || '';
  const galleryUrls     = (files.galleryImages || []).map((f) => f.path);

  const flatTypes = parseFlatTypes(flatTypesRaw);
  const villaDetails = parseJsonObject(villaDetailsRaw);
  const landDetails  = parseJsonObject(landDetailsRaw);

  // ── For Super Admin: auto-approve
  const status     = isSuperAdmin ? 'approved' : 'pending';
  const approvedAt = isSuperAdmin ? new Date()  : undefined;

  const propertyData = {
    title,
    description,
    price:           Number(price),
    category,
    mainImage:       mainImageUrl,
    galleryImages:   galleryUrls,
    companyId:       company._id,
    addedBy:         req.user._id,
    address,
    city,
    landSize:        landSize        || '',
    handoverTime:    handoverTime    || '',
    totalUnitsCount: Number(totalUnitsCount) || 0,
    totalFloors:     Number(totalFloors)     || 1,
    unitsPerFloor:   Number(unitsPerFloor)   || 1,
    flatTypes,
    location: {
      lat: parseFloat(lat) || 0,
      lng: parseFloat(lng) || 0,
    },
    status,
    approvedAt,
  };

  // Attach category-specific details
  if (category === 'villa' && villaDetails) propertyData.villaDetails = villaDetails;
  if (category === 'land'  && landDetails)  propertyData.landDetails  = landDetails;

  const property = await Property.create(propertyData);

  // ── If Super Admin adding — auto-generate units immediately
  if (isSuperAdmin) {
    await generateUnitsForProperty(property);
  }

  const message = isSuperAdmin
    ? 'Property published successfully!'
    : 'Property submitted for review. It will go live once approved by admin.';

  res.status(201).json({ success: true, message, data: { property } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Company Admin (own) / Super Admin (all)
// ─────────────────────────────────────────────────────────────────────────────
const updateProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  // Ownership check for Company Admin
  if (!req.user.roles.includes('Super Admin') && String(property.addedBy) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this property' });
  }

  const {
    title, description, price, address, city, category,
    totalFloors, unitsPerFloor, landSize, handoverTime,
    totalUnitsCount, lat, lng, flatTypes: flatTypesRaw,
    villaDetails: villaDetailsRaw,
    landDetails: landDetailsRaw,
  } = req.body;

  const files = req.files || {};

  if (title)           property.title           = title;
  if (description)     property.description     = description;
  if (price)           property.price           = Number(price);
  if (address)         property.address         = address;
  if (city)            property.city            = city;
  if (category)        property.category        = category;
  if (totalFloors)     property.totalFloors     = Number(totalFloors);
  if (unitsPerFloor)   property.unitsPerFloor   = Number(unitsPerFloor);
  if (landSize   !== undefined) property.landSize       = landSize;
  if (handoverTime !== undefined) property.handoverTime = handoverTime;
  if (totalUnitsCount) property.totalUnitsCount = Number(totalUnitsCount);
  if (lat)             property.location.lat    = parseFloat(lat);
  if (lng)             property.location.lng    = parseFloat(lng);
  if (flatTypesRaw)    property.flatTypes       = parseFlatTypes(flatTypesRaw);
  if (villaDetailsRaw) property.villaDetails     = parseJsonObject(villaDetailsRaw);
  if (landDetailsRaw)  property.landDetails      = parseJsonObject(landDetailsRaw);

  // Replace images if new files uploaded
  if (files.mainImage?.[0]) {
    property.mainImage = files.mainImage[0].path;
  }
  if (files.galleryImages?.length) {
    property.galleryImages = files.galleryImages.map((f) => f.path);
  }

  await property.save();

  res.status(200).json({ success: true, message: 'Property updated', data: { property } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Delete a property (+ cascade delete units)
// @route   DELETE /api/properties/:id
// @access  Company Admin (own) / Super Admin (all)
// ─────────────────────────────────────────────────────────────────────────────
const deleteProperty = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (!req.user.roles.includes('Super Admin') && String(property.addedBy) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this property' });
  }

  // Cascade — delete all associated units
  await Unit.deleteMany({ propertyId: property._id });
  await property.deleteOne();

  res.status(200).json({ success: true, message: 'Property and all its units deleted successfully' });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Toggle isActive (activate / deactivate)
// @route   PATCH /api/properties/:id/active
// @access  Company Admin (own) / Super Admin (all)
// ─────────────────────────────────────────────────────────────────────────────
const toggleActive = async (req, res) => {
  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  if (!req.user.roles.includes('Super Admin') && String(property.addedBy) !== String(req.user._id)) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }

  property.isActive = !property.isActive;
  await property.save();

  res.status(200).json({
    success: true,
    message: `Property ${property.isActive ? 'activated' : 'deactivated'}`,
    data:    { isActive: property.isActive },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all pending properties (Super Admin review queue)
// @route   GET /api/properties/pending
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getPendingProperties = async (req, res) => {
  const properties = await Property.find({ status: 'pending' })
    .populate('companyId', 'name email')
    .populate('addedBy', 'name email')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { properties } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Approve or reject a property (Super Admin)
// @route   PUT /api/properties/:id/status
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const updatePropertyStatus = async (req, res) => {
  const { status, rejectedReason } = req.body;

  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const property = await Property.findById(req.params.id);
  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  property.status         = status;
  property.rejectedReason = rejectedReason || '';
  if (status === 'approved') {
    property.approvedAt = new Date();
    await generateUnitsForProperty(property);
  }

  await property.save();

  res.status(200).json({
    success: true,
    message: `Property ${status} successfully`,
    data:    { property },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get all approved + active properties (Homepage / public listing)
// @route   GET /api/properties/approved
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getApprovedProperties = async (req, res) => {
  const { city, category, limit = 12, page = 1 } = req.query;
  const filter = { status: 'approved', isActive: true };
  if (city)     filter.city     = new RegExp(city, 'i');
  if (category) filter.category = category;

  const skip       = (Number(page) - 1) * Number(limit);
  const properties = await Property.find(filter)
    .populate('companyId', 'name logo')
    .sort('-approvedAt')
    .skip(skip)
    .limit(Number(limit))
    .lean();

  // ── Batch-fetch booking policies for all company+category combos ───────
  const policyKeys = [...new Set(
    properties.map((p) => `${p.companyId?._id || p.companyId}_${p.category}`)
  )];

  const policyConditions = policyKeys.map((key) => {
    const [companyId, cat] = key.split('_');
    return { companyId, category: cat };
  });

  const policies = policyConditions.length
    ? await BookingPolicy.find({ $or: policyConditions }).lean()
    : [];

  // Build lookup map: "companyId_category" -> bookingMoneyPercentage
  const policyMap = {};
  policies.forEach((p) => {
    policyMap[`${p.companyId}_${p.category}`] = p.bookingMoneyPercentage;
  });

  // Attach booking info to each property
  const enriched = properties.map((p) => {
    const key = `${p.companyId?._id || p.companyId}_${p.category}`;
    const pct = policyMap[key] || 20; // default 20%
    return {
      ...p,
      bookingMoneyPercentage: pct,
      bookingMoneyAmount:     Math.round(p.price * pct / 100),
    };
  });

  const total = await Property.countDocuments(filter);

  res.status(200).json({
    success: true,
    data:    { properties: enriched, total, page: Number(page), limit: Number(limit) },
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get approved properties for a specific company (Storefront)
// @route   GET /api/properties/company/:companyId
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getCompanyProperties = async (req, res) => {
  const properties = await Property.find({
    companyId: req.params.companyId,
    status:    'approved',
    isActive:  true,
  })
    .populate('companyId', 'name logo')
    .sort('-approvedAt');

  res.status(200).json({ success: true, data: { properties } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get current user's own properties (all statuses)
// @route   GET /api/properties/my
// @access  Company Admin / Seller
// ─────────────────────────────────────────────────────────────────────────────
const getMyProperties = async (req, res) => {
  const properties = await Property.find({ addedBy: req.user._id })
    .populate('companyId', 'name')
    .sort('-createdAt');

  res.status(200).json({ success: true, data: { properties } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get ALL properties (Super Admin — all statuses, all vendors)
// @route   GET /api/properties/all
// @access  Super Admin
// ─────────────────────────────────────────────────────────────────────────────
const getAllProperties = async (req, res) => {
  const { status, category, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (status)   filter.status   = status;
  if (category) filter.category = category;

  const skip       = (Number(page) - 1) * Number(limit);
  const properties = await Property.find(filter)
    .populate('companyId', 'name logo')
    .populate('addedBy', 'name email')
    .sort('-createdAt')
    .skip(skip)
    .limit(Number(limit));

  const total = await Property.countDocuments(filter);

  res.status(200).json({ success: true, data: { properties, total } });
};

// ─────────────────────────────────────────────────────────────────────────────
// @desc    Get single property details
// @route   GET /api/properties/:id
// @access  Public
// ─────────────────────────────────────────────────────────────────────────────
const getSingleProperty = async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('companyId', 'name logo email phone location')
    .populate('addedBy', 'name email');

  if (!property) {
    return res.status(404).json({ success: false, message: 'Property not found' });
  }

  res.status(200).json({ success: true, data: { property } });
};

module.exports = {
  createProperty,
  updateProperty,
  deleteProperty,
  toggleActive,
  getPendingProperties,
  updatePropertyStatus,
  getApprovedProperties,
  getCompanyProperties,
  getMyProperties,
  getAllProperties,
  getSingleProperty,
};
