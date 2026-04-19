const express = require('express');
const {
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
} = require('./property.controller');
const { protect, authorize }  = require('../../middleware/auth.middleware');
const { uploadImage }          = require('../../config/cloudinary');

const router = express.Router();

// ── Multer field config: mainImage (1) + galleryImages (up to 10) ─────────────
const propertyUpload = uploadImage.fields([
  { name: 'mainImage',     maxCount: 1  },
  { name: 'galleryImages', maxCount: 10 },
]);

// ── Public Routes ───────────────────────────────────────────────────────────
router.get('/approved',           getApprovedProperties);
router.get('/company/:companyId', getCompanyProperties);

// ── Company Admin / Super Admin — own properties list ──────────────────────
router.get(
  '/my',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  getMyProperties
);

// ── Super Admin — all properties list (Manage Properties) ──────────────────
router.get(
  '/all',
  protect,
  authorize('Super Admin'),
  getAllProperties
);

// ── Super Admin — pending review queue ─────────────────────────────────────
router.get(
  '/pending',
  protect,
  authorize('Super Admin'),
  getPendingProperties
);

// ── Create (Company Admin goes to pending; Super Admin auto-approves) ───────
router.post(
  '/',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  propertyUpload,
  createProperty
);

// ── Super Admin — Approve / Reject ─────────────────────────────────────────
router.put(
  '/:id/status',
  protect,
  authorize('Super Admin'),
  updatePropertyStatus
);

// ── Toggle Active / Inactive ───────────────────────────────────────────────
router.patch(
  '/:id/active',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  toggleActive
);

// ── Update property (own only for Company Admin; all for Super Admin) ───────
router.put(
  '/:id',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  propertyUpload,
  updateProperty
);

// ── Delete property ────────────────────────────────────────────────────────
router.delete(
  '/:id',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  deleteProperty
);

// ── Public Dynamic Route (must be last) ────────────────────────────────────
router.get('/:id', getSingleProperty);

module.exports = router;
