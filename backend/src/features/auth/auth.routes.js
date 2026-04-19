const express = require('express');
const { body } = require('express-validator');
const { register, verifyOTP, resendOTP, login, getMe, logout } = require('./auth.controller');
const { protect } = require('../../middleware/auth.middleware');

const router = express.Router();

// ─── Validation Rules ─────────────────────────────────────────────────────────
const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters'),
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/auth/register      — Register + send OTP email
router.post('/register', registerValidation, register);

// POST /api/auth/verify-otp    — Verify OTP → auto-login (sets cookie)
router.post('/verify-otp', verifyOTP);

// POST /api/auth/resend-otp    — Resend OTP to same email
router.post('/resend-otp', resendOTP);

// POST /api/auth/login         — Login → set HttpOnly cookie (token NOT in JSON body)
router.post('/login', loginValidation, login);

// GET  /api/auth/me            — Session persistence: verify cookie → return user
//                                Call this in AuthContext useEffect on app mount
router.get('/me', protect, getMe);

// POST /api/auth/logout        — Clear token cookie
router.post('/logout', protect, logout);

module.exports = router;
