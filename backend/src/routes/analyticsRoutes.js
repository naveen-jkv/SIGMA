const express = require('express');
const router = express.Router();
const {
  getTrends,
  getSymptoms,
  getLocations,
  getRiskDistribution,
  getHotspots,
  getAnomalies
} = require('../controllers/analyticsController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleCheck');

// All analytics routes require authentication and HEALTH_AUTHORITY role
router.use(authenticate, authorizeRoles('HEALTH_AUTHORITY'));

router.get('/trends', getTrends);
router.get('/symptoms', getSymptoms);
router.get('/locations', getLocations);
router.get('/risk', getRiskDistribution);
router.get('/hotspots', getHotspots);
router.get('/anomalies', getAnomalies);

module.exports = router;
