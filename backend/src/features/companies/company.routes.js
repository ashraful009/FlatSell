const express = require('express');
const {
  applyForVendor,
  getAllCompanies,
  getApprovedCompanies,
  getCompany,
  updateCompanyStatus,
} = require('./company.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');
const { uploadDocument }     = require('../../config/cloudinary');

const router = express.Router();

// ── Public ────────────────────────────────────────────────────────────────────
// GET  /api/companies/approved        — public company directory
router.get('/approved', getApprovedCompanies);

// GET  /api/companies/:id             — single company storefront
router.get('/:id', getCompany);

// ── Protected ─────────────────────────────────────────────────────────────────
// POST /api/companies/apply           — apply as vendor (upload PDF Trade License)
// uploadDocument.single('tradeLicense') handles multipart/form-data
// resource_type: 'auto' in cloudinary config handles PDF correctly
router.post(
  '/apply',
  protect,
  uploadDocument.single('tradeLicense'),
  applyForVendor
);

// ── Super Admin ───────────────────────────────────────────────────────────────
// GET  /api/companies                 — all companies (with ?status= filter)
router.get('/', protect, authorize('Super Admin'), getAllCompanies);

// PUT  /api/companies/:id/status      — approve / reject company
router.put('/:id/status', protect, authorize('Super Admin'), updateCompanyStatus);

module.exports = router;
