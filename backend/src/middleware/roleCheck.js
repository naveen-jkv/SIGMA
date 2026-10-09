/**
 * AQUASENSE Role-Based Access Control Middleware
 * Roles: HEALTH_WORKER, HEALTH_AUTHORITY
 */

const { normalizeRole } = require('../utils/roles');

const authorizeRoles = (...roles) => {
  const allowed = roles.map(r => normalizeRole(r));

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Not authorized: User authentication required'
      });
    }

    const userRole = normalizeRole(req.user.role);

    if (!allowed.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden: User role '${userRole}' is not authorized to access this resource`
      });
    }

    next();
  };
};

const authorize = authorizeRoles;

module.exports = {
  authorizeRoles,
  authorize
};
