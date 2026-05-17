const express = require('express');
const {
  setupInstallmentPlan,
  getBookingInstallments,
  createInstallmentPaymentSession,
  confirmInstallmentPayment,
  downloadInstallmentInvoice,
} = require('./installment.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

router.use(protect);

router.post('/setup',                       setupInstallmentPlan);
router.get('/booking/:bookingId',           getBookingInstallments);
router.post('/:id/pay-session',             createInstallmentPaymentSession);
router.post('/confirm',                     confirmInstallmentPayment);
router.get('/:id/invoice',                  downloadInstallmentInvoice);

module.exports = router;
