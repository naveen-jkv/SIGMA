/**
 * AQUASENSE - Alert Management Controller
 */

const Alert = require('../models/Alert');
const { generateAlertId } = require('../utils/idGenerator');
const { generateRecommendedAction } = require('../services/alertService');

// @desc    Get all alerts with optional status/location filtering
// @route   GET /api/alerts
// @access  Public
const getAlerts = async (req, res, next) => {
  try {
    const { status, riskLevel, location } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (location) filter.location = location;

    const alerts = await Alert.find(filter);

    return res.status(200).json({
      success: true,
      count: alerts.length,
      data: alerts
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create an alert manually
// @route   POST /api/alerts
// @access  Protected
const createAlert = async (req, res, next) => {
  try {
    const { location, riskLevel, caseCount, reason, recommendedAction, status } = req.body;

    if (!location || !riskLevel) {
      return res.status(400).json({
        success: false,
        error: 'Location and riskLevel are required'
      });
    }

    const recAction = recommendedAction || generateRecommendedAction(riskLevel, 'General Outbreak', location);

    const alert = await Alert.create({
      alertId: req.body.alertId || generateAlertId(),
      location,
      riskLevel: riskLevel.toUpperCase(),
      caseCount: Number(caseCount || 1),
      reason: reason || 'Manual surveillance alert triggered by health officer',
      recommendedAction: recAction,
      status: status || 'ACTIVE'
    });

    return res.status(201).json({
      success: true,
      data: alert
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update alert status (e.g. ACTIVE -> ACKNOWLEDGED -> RESOLVED)
// @route   PUT /api/alerts/:id/status
// @access  Protected
const updateAlertStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'];

    if (!status || !validStatuses.includes(status.toUpperCase())) {
      return res.status(400).json({
        success: false,
        error: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert not found with identifier ${req.params.id}`
      });
    }

    const updated = await Alert.findByIdAndUpdate(
      req.params.id,
      { status: status.toUpperCase() },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: `Alert status updated to ${status.toUpperCase()}`,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete an alert
// @route   DELETE /api/alerts/:id
// @access  Protected (ADMIN or AUTHORITY)
const deleteAlert = async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    if (!alert) {
      return res.status(404).json({
        success: false,
        error: `Alert not found with identifier ${req.params.id}`
      });
    }

    const deleted = await Alert.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: `Alert ${req.params.id} successfully removed`,
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAlerts,
  createAlert,
  updateAlertStatus,
  deleteAlert
};
