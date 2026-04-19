const express = require('express');
const {
  getPropertyUnits,
  getUnit,
  updateUnitStatus,
  updateUnit,
} = require('./unit.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// ── Public ───────────────────────────────────────────────────────────────────
// GET  /api/units/property/:propertyId  — all units for visualizer
router.get('/property/:propertyId', getPropertyUnits);

// GET  /api/units/:id                   — single unit details (for modal)
router.get('/:id', getUnit);

// ── Company Admin / Seller ────────────────────────────────────────────────────
// PUT  /api/units/:id/status            — change available/booked/sold
router.put(
  '/:id/status',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  updateUnitStatus
);

// PUT  /api/units/:id                   — update price, size, type, features
router.put(
  '/:id',
  protect,
  authorize('Company Admin', 'seller'),
  updateUnit
);

module.exports = router;
