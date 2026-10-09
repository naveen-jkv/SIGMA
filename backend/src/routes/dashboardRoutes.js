const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleCheck');

// GET /api/dashboard/stats - HEALTH_AUTHORITY only
router.get('/stats', authenticate, authorizeRoles('HEALTH_AUTHORITY'), getDashboardStats);

module.exports = router;
