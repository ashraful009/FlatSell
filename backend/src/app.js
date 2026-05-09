const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const rateLimit = require('express-rate-limit');
require('express-async-errors');

const errorHandler = require('./middleware/error.middleware');

const app = express();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet());

// ─── CORS — Allow frontend with credentials (HttpOnly cookies) ───────────────
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate Limiting ───────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 150, // limit each IP to 150 requests per windowMs
  message: { success: false, message: 'Too many requests from this IP, please try again after 10 minutes' }
});
app.use('/api', limiter);

// ─── Body Parsers ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── Data Sanitization ───────────────────────────────────────────────────────
app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
app.use(hpp()); // Prevent HTTP Parameter Pollution

// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'FlatSell API is running 🚀' });
});

// ─── Feature Routes ───────────────────────────────────────────────────────────
app.use('/api/auth',       require('./features/auth/auth.routes'));
app.use('/api/policies',   require('./features/policies/policy.routes'));
app.use('/api/companies',  require('./features/companies/company.routes'));
app.use('/api/properties', require('./features/properties/property.routes'));
app.use('/api/units',      require('./features/units/unit.routes'));
// app.use('/api/users',      require('./features/users/user.routes'));       // Phase 9
app.use('/api/bookings',   require('./features/bookings/booking.routes'));
app.use('/api/checkout',          require('./features/checkout/checkout.routes'));
app.use('/api/booking-policies',  require('./features/policies/bookingPolicy.routes'));
app.use('/api/commissions',       require('./features/commissions/commission.routes'));

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
