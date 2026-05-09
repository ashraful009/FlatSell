const express = require('express');
const router = express.Router();
const { protect } = require('../../middleware/auth.middleware');
const { createCheckoutSession, createDuePaymentSession } = require('./checkout.controller');

// All checkout routes require the user to be logged in
router.use(protect);

router.post('/create-session', createCheckoutSession);
router.post('/create-due-session', createDuePaymentSession);

module.exports = router;
