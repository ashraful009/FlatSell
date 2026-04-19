const express = require('express');
const { getPolicy, upsertPolicy } = require('./policy.controller');
const { protect, authorize }      = require('../../middleware/auth.middleware');

const router = express.Router();

// GET  /api/policies/:roleTarget  — public (frontend fetches vendor T&C)
router.get('/:roleTarget', getPolicy);

// PUT  /api/policies/:roleTarget  — Super Admin only (edit T&C content)
router.put('/:roleTarget', protect, authorize('Super Admin'), upsertPolicy);

module.exports = router;
