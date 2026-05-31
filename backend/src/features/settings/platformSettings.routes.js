const express = require('express');
const { getSettings, getPublicSettings, updateSettings } = require('./platformSettings.controller');
const { protect, authorize } = require('../../middleware/auth.middleware');

const router = express.Router();

// ── Public read-only subset (used by checkout to show live policy copy) ──────
router.get('/public', getPublicSettings);

// ── Super Admin ──────────────────────────────────────────────────────────────
router.get('/', protect, authorize('Super Admin'), getSettings);
router.put('/', protect, authorize('Super Admin'), updateSettings);

module.exports = router;
