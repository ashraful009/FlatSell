const express = require('express');
const {
  getMyBookingPolicies,
  upsertBookingPolicy,
  getBookingPolicyByCompanyAndCategory,
} = require('./bookingPolicy.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// ── Company Admin Routes ────────────────────────────────────────────────────
router.get('/my',       protect, authorize('Company Admin'), getMyBookingPolicies);
router.put('/:category', protect, authorize('Company Admin'), upsertBookingPolicy);

// ── Public Route (for customer checkout form generation) ────────────────────
router.get('/company/:companyId/category/:category', getBookingPolicyByCompanyAndCategory);

module.exports = router;
