const express = require('express');
const router = express.Router();
const {
  getAlerts,
  createAlert,
  updateAlertStatus,
  deleteAlert
} = require('../controllers/alertController');

router.get('/', getAlerts);
router.post('/', createAlert);
router.put('/:id/status', updateAlertStatus);
router.delete('/:id', deleteAlert);

module.exports = router;
