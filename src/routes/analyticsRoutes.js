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

router.get('/trends', getTrends);
router.get('/symptoms', getSymptoms);
router.get('/locations', getLocations);
router.get('/risk', getRiskDistribution);
router.get('/hotspots', getHotspots);
router.get('/anomalies', getAnomalies);

module.exports = router;
