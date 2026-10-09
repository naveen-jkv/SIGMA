const express = require('express');
const router = express.Router();
const { getMapCases } = require('../controllers/mapController');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleCheck');

// Outbreak Map routes: HEALTH_AUTHORITY only
router.use(authenticate, authorizeRoles('HEALTH_AUTHORITY'));

router.get('/cases', getMapCases);

module.exports = router;
