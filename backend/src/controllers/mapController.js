/**
 * AQUASENSE - Map Controller
 * Supplies geospatial coordinates and disease telemetry for interactive GIS mapping.
 */

const Case = require('../models/Case');

// @desc    Get geospatial case markers for dashboard map
// @route   GET /api/map/cases
// @access  Public
const getMapCases = async (req, res, next) => {
  try {
    const cases = await Case.find();

    // Map each case to the exact schema specified by the prompt
    const mapData = cases.map(c => ({
      caseId: c.caseId,
      latitude: c.latitude,
      longitude: c.longitude,
      locality: c.locality,
      caseCount: 1, // Individual marker representation
      riskLevel: c.riskLevel,
      symptoms: c.symptoms,
      date: c.symptomDate || c.reportedDate || c.createdAt
    }));

    return res.status(200).json(mapData);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMapCases
};
