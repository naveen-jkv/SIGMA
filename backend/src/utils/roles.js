/**
 * AQUASENSE Role Definitions & Normalization Utility
 * Standard Roles:
 * - HEALTH_WORKER: Submits cases, views own reports and risk assessment.
 * - HEALTH_AUTHORITY: Views outbreak map, analytics, manages alerts, views all reports.
 */

const ROLES = {
  HEALTH_WORKER: 'HEALTH_WORKER',
  HEALTH_AUTHORITY: 'HEALTH_AUTHORITY'
};

/**
 * Normalizes any legacy or external role string to one of the standard roles.
 * Maps 'AUTHORITY', 'HEALTH_AUTHORITY', 'ADMIN' -> 'HEALTH_AUTHORITY'
 * Default fallback is 'HEALTH_WORKER'
 */
const normalizeRole = (role) => {
  if (!role) return ROLES.HEALTH_WORKER;
  const upper = String(role).trim().toUpperCase();
  if (upper === 'HEALTH_AUTHORITY' || upper === 'AUTHORITY' || upper === 'ADMIN') {
    return ROLES.HEALTH_AUTHORITY;
  }
  return ROLES.HEALTH_WORKER;
};

module.exports = {
  ROLES,
  normalizeRole
};
