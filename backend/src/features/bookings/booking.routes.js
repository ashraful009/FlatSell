const express = require('express');
const {
  createBooking,
  getMyBookings,
  getCompanyBookings,
  updateBookingStatus,
  confirmStripeBooking,
  getBookingInvoice,
  getSalesReport,
  getSalesReportPDF,
} = require('./booking.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// ── Customer / User Routes ─────────────────────────────────────────────────
router.post('/',        protect, createBooking);
router.post('/confirm', protect, confirmStripeBooking);
router.get('/my',       protect, getMyBookings);

// ── Invoice Download (customer who owns it, or Super Admin) ───────────────
router.get('/:id/invoice', protect, getBookingInvoice);

// ── Sales Report (Company Admin sees own, Super Admin sees all) ────────────
router.get(
  '/sales-report',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  getSalesReport
);

router.get(
  '/sales-report/pdf',
  protect,
  authorize('Company Admin', 'seller', 'Super Admin'),
  getSalesReportPDF
);

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
