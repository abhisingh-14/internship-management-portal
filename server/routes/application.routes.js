const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../utils/validateRequest');
const { updateStatusValidator } = require('../validators/application.validator');
const applicationController = require('../controllers/application.controller');

const router = express.Router();

// GET /api/v1/applications/:applicationId
// Checked internally in controller for ownership/role authorization
router.get('/:applicationId', authenticate, applicationController.getApplicationDetails);

// PATCH /api/v1/applications/:applicationId/status
router.patch(
  '/:applicationId/status',
  authenticate,
  authorize('company', 'admin'),
  updateStatusValidator,
  validateRequest,
  applicationController.updateApplicationStatus
);

// DELETE /api/v1/applications/:applicationId (Withdraw application)
router.delete('/:applicationId', authenticate, authorize('student'), applicationController.withdrawApplication);

module.exports = router;
