/**
 * AQUASENSE - Dashboard Controller
 * Provides high-level operational statistics for executive and health official dashboards.
 */

const Case = require('../models/Case');
const Alert = require('../models/Alert');

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Public
const getDashboardStats = async (req, res, next) => {
  try {
    const allCases = await Case.find();
    const activeAlertsCount = await Alert.countDocuments({ status: 'ACTIVE' });

    // 1. Total cases
    const totalCases = allCases.length;

    // 2. Cases reported today (within the current calendar day or last 24h)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const casesToday = allCases.filter(c => {
      const d = new Date(c.reportedDate || c.createdAt);
      return d >= startOfToday;
    }).length;

    // 3. High risk areas (distinct localities with HIGH or CRITICAL risk)
    const highRiskLocalities = new Set();
    allCases.forEach(c => {
      if (c.riskLevel === 'HIGH' || c.riskLevel === 'CRITICAL') {
        if (c.locality) highRiskLocalities.add(c.locality);
      }
    });
    const highRiskAreas = highRiskLocalities.size;

    // 4. Return exact schema required by specifications
    return res.status(200).json({
      totalCases,
      casesToday,
      highRiskAreas,
      activeAlerts: activeAlertsCount
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats
};
