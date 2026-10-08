const express = require('express');
const router = express.Router();
const { getMapCases } = require('../controllers/mapController');

router.get('/cases', getMapCases);

module.exports = router;
