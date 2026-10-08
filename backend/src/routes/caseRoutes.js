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

router.post('/', validateCaseInput, createCase);
router.get('/', getCases);
router.get('/:id', getCaseById);
router.put('/:id', updateCase);
router.delete('/:id', deleteCase);

module.exports = router;
