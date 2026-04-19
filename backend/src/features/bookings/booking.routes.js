const express = require('express');
const {
  createBooking,
  getMyBookings,
  getCompanyBookings,
  updateBookingStatus,
} = require('./booking.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// ── Customer / User Routes ─────────────────────────────────────────────────
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);

// ── Company Admin / Seller Routes ──────────────────────────────────────────
router.get(
  '/company',
  protect,
  authorize('Company Admin', 'seller'),
  getCompanyBookings
);

router.put(
  '/:id/status',
  protect,
  authorize('Company Admin', 'seller'),
  updateBookingStatus
);

module.exports = router;
