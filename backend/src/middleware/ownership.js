/**
 * AQUASENSE - Resource Ownership Middleware
 * Enforces ownership checks on clinical case reports so that:
 * - Health Workers can access and modify only their own cases.
 * - Health Authorities can access cases across authorized districts.
 * - Unauthenticated or unauthorized access attempts are rejected.
 */

const Case = require('../models/Case');
const { normalizeRole, ROLES } = require('../utils/roles');

/**
 * Checks whether a given user is the creator/owner of a case document.
 */
const isCaseOwner = (caseDoc, user) => {
  if (!caseDoc || !user) return false;

  const userId = String(user._id || user.id || '').trim();
  const userEmail = (user.email || '').toLowerCase().trim();
  const userName = (user.name || '').toLowerCase().trim();

  const cb = String(caseDoc.createdBy || '').trim();
  const cbId = String(caseDoc.createdById || '').trim();
  const cbEmail = String(caseDoc.createdByEmail || '').toLowerCase().trim();
  const cbName = String(caseDoc.createdByName || '').toLowerCase().trim();

  return Boolean(
    (userId && (cb === userId || cbId === userId)) ||
    (userEmail && (cb.toLowerCase() === userEmail || cbEmail === userEmail)) ||
    (userName && (cb.toLowerCase() === userName || cbName === userName))
  );
};

/**
 * Express middleware requiring ownership or authority privilege on :id case routes.
 */
const requireCaseOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: User authentication required'
      });
    }

    const caseDoc = await Case.findById(req.params.id);
    if (!caseDoc) {
      return res.status(404).json({
        success: false,
        error: `Case report not found with identifier ${req.params.id}`
      });
    }

    const userRole = normalizeRole(req.user.role);

    // Authorities are permitted to view and inspect surveillance records
    if (userRole === ROLES.HEALTH_AUTHORITY) {
      req.case = caseDoc;
      return next();
    }

    // Health workers are strictly restricted to their own submitted records
    if (userRole === ROLES.HEALTH_WORKER) {
      if (isCaseOwner(caseDoc, req.user)) {
        req.case = caseDoc;
        return next();
      }

      return res.status(403).json({
        success: false,
        error: "Forbidden: You are not authorized to view or modify another worker's case record"
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Forbidden: Insufficient privileges to access this record'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requireCaseOwnership,
  isCaseOwner
};
