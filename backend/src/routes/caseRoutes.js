const express = require('express');
const router = express.Router();
const {
  createCase,
  getCases,
  getCaseById,
  updateCase,
  deleteCase
} = require('../controllers/caseController');
const { validateCaseInput } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authorizeRoles } = require('../middleware/roleCheck');
const { requireCaseOwnership } = require('../middleware/ownership');

// All case routes require authentication
router.use(authenticate);

// POST /api/cases - Authenticated HEALTH_WORKER
router.post('/', authorizeRoles('HEALTH_WORKER'), validateCaseInput, createCase);

// GET /api/cases - Role-specific filtering (workers see only own, authorities see authorized records)
router.get('/', getCases);

// GET /api/cases/:id - Protected by ownership (workers cannot access another worker's record)
router.get('/:id', requireCaseOwnership, getCaseById);

// PUT /api/cases/:id - Enforce ownership and workflow rules
router.put('/:id', requireCaseOwnership, updateCase);

// DELETE /api/cases/:id - Enforce ownership and workflow rules
router.delete('/:id', requireCaseOwnership, deleteCase);

module.exports = router;
