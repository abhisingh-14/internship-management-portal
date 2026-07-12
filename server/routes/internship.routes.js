const express = require('express');
const authenticate = require('../middleware/authenticate');
const optionalAuthenticate = require('../middleware/optionalAuthenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../utils/validateRequest');
const {
  createInternshipValidator,
  updateInternshipValidator,
  updateInternshipStatusValidator,
  searchInternshipsValidator,
  publicSearchValidator,
} = require('../validators/internship.validator');
const internshipController = require('../controllers/internship.controller');
const applicationController = require('../controllers/application.controller');
const { applyValidator, queryValidator } = require('../validators/application.validator');

const router = express.Router();

router.get('/', publicSearchValidator, validateRequest, internshipController.listPublishedInternships);

// Static path — must be declared before the dynamic ':internshipId' route below.
router.get(
  '/my',
  authenticate,
  authorize('company'),
  searchInternshipsValidator,
  validateRequest,
  internshipController.getMyInternships
);

router.post(
  '/',
  authenticate,
  authorize('company'),
  createInternshipValidator,
  validateRequest,
  internshipController.createInternship
);

router.get('/:internshipId', optionalAuthenticate, internshipController.getInternshipById);

router.put(
  '/:internshipId',
  authenticate,
  authorize('company'),
  updateInternshipValidator,
  validateRequest,
  internshipController.updateInternship
);

router.patch(
  '/:internshipId/status',
  authenticate,
  authorize('company', 'admin'),
  updateInternshipStatusValidator,
  validateRequest,
  internshipController.updateInternshipStatus
);

router.delete(
  '/:internshipId',
  authenticate,
  authorize('company'),
  internshipController.deleteInternship
);

// GET /api/v1/internships/:internshipId/applications
router.get(
  '/:internshipId/applications',
  authenticate,
  authorize('company', 'admin'),
  queryValidator,
  validateRequest,
  applicationController.getInternshipApplications
);

// POST /api/v1/internships/:internshipId/applications
router.post(
  '/:internshipId/applications',
  authenticate,
  authorize('student'),
  applyValidator,
  validateRequest,
  applicationController.applyForInternship
);

module.exports = router;
