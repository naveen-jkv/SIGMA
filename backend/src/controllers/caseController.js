/**
 * AQUASENSE - Case Management Controller
 */

const Case = require('../models/Case');
const { assessCaseRisk } = require('../services/riskService');
const { triggerAutomaticAlert } = require('../services/alertService');
const { generateCaseId } = require('../utils/idGenerator');
const logger = require('../utils/logger');

// @desc    Create a new case report & trigger automated outbreak analytics
// @route   POST /api/cases
// @access  Public or Protected
const createCase = async (req, res, next) => {
  try {
    const caseData = {
      ...req.body,
      caseId: req.body.caseId || generateCaseId(),
      createdBy: req.user ? req.user.name || req.user.email : req.body.createdBy || 'Health Worker'
    };

    // 1. Calculate risk & run analytics based on locality context
    const riskAssessment = await assessCaseRisk(caseData);

    caseData.riskScore = riskAssessment.riskScore;
    caseData.riskLevel = riskAssessment.riskLevel;
    caseData.similarCasesNearby = riskAssessment.similarCasesNearby || 0;

    // 2. Save case to database
    const savedCase = await Case.create(caseData);

    // 3. Trigger automatic alert if HIGH or CRITICAL
    const alertResult = await triggerAutomaticAlert(savedCase, riskAssessment);

    logger.info(`New Case created: ${savedCase.caseId} in ${savedCase.locality} | Risk: ${savedCase.riskLevel} (${savedCase.riskScore})`);

    // 4. Return risk information and alert status to frontend
    return res.status(201).json({
      success: true,
      case: savedCase,
      risk: {
        score: savedCase.riskScore,
        level: savedCase.riskLevel,
        reason: riskAssessment.reason,
        breakdown: riskAssessment.breakdown
      },
      alertGenerated: alertResult.alertGenerated,
      alert: alertResult.alert || null,
      disclaimer: "AQUASENSE is an early warning / decision support system for public health surveillance and does not provide medical diagnoses."
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all cases with filtering and search
// @route   GET /api/cases
// @access  Public
const getCases = async (req, res, next) => {
  try {
    const { locality, district, riskLevel, status, suspectedDisease } = req.query;
    const filter = {};

    if (locality) filter.locality = locality;
    if (district) filter.district = district;
    if (riskLevel) filter.riskLevel = riskLevel;
    if (status) filter.status = status;
    if (suspectedDisease) filter.suspectedDisease = suspectedDisease;

    const cases = await Case.find(filter);

    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single case by ID or caseId
// @route   GET /api/cases/:id
// @access  Public
const getCaseById = async (req, res, next) => {
  try {
    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        error: `Case not found with identifier ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      data: caseDoc
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a case
// @route   PUT /api/cases/:id
// @access  Public or Protected
const updateCase = async (req, res, next) => {
  try {
    const existing = await Case.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        error: `Case not found with identifier ${req.params.id}`
      });
    }

    const updated = await Case.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    return res.status(200).json({
      success: true,
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a case
// @route   DELETE /api/cases/:id
// @access  Public or Protected
const deleteCase = async (req, res, next) => {
  try {
    const deleted = await Case.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: `Case not found with identifier ${req.params.id}`
      });
    }

    return res.status(200).json({
      success: true,
      message: `Case ${req.params.id} successfully removed`,
      data: deleted
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase
};
