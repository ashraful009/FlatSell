const express = require('express');
const {
  getPlatformOverview,
  getCompanyBreakdown,
  getPropertyBreakdown,
  getMarginReportPDF,
} = require('./commission.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// ── Super Admin Only ────────────────────────────────────────────────────────
router.use(protect);
router.use(authorize('Super Admin'));

router.get('/overview',                        getPlatformOverview);
router.get('/companies',                       getCompanyBreakdown);
router.get('/companies/:companyId/properties', getPropertyBreakdown);
router.get('/margin-report/pdf',               getMarginReportPDF);

module.exports = router;

