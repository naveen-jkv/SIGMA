const express = require('express');
const router = express.Router();
const analyticsClient = require('../services/analyticsClient');
const { isMongoActive } = require('../config/db');

router.get('/', async (req, res) => {
  const analyticsStatus = await analyticsClient.checkHealth();
  return res.status(200).json({
    status: 'OK',
    service: 'AQUASENSE Backend',
    database: isMongoActive() ? 'MongoDB Connected' : 'In-Memory Zero-Setup Store Active',
    analyticsService: analyticsStatus.online ? 'Online' : 'Offline / Standalone Fallback Active',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
