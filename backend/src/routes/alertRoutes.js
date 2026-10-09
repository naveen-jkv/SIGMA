const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  updateAlertStatus,
  deleteAlert
} = require('../controllers/alertController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleCheck');

// All alert routes require authentication
router.use(authenticate);

// GET /api/alerts - Role-filtered visibility
router.get('/', getAlerts);

// Mutation routes - HEALTH_AUTHORITY only
router.post('/', authorizeRoles('HEALTH_AUTHORITY'), createAlert);
router.put('/:id/status', authorizeRoles('HEALTH_AUTHORITY'), updateAlertStatus);
router.delete('/:id', authorizeRoles('HEALTH_AUTHORITY'), deleteAlert);

module.exports = router;
