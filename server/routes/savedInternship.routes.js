const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../utils/validateRequest');
const { internshipIdParamValidator, queryValidator } = require('../validators/savedInternship.validator');
const savedInternshipController = require('../controllers/savedInternship.controller');

const router = express.Router();

// All routes in this router require authentication as a student
router.use(authenticate, authorize('student'));

// GET /bookmarks
router.get(
  '/',
  queryValidator,
  validateRequest,
  savedInternshipController.getSavedInternships
);

// POST /bookmarks/:internshipId
router.post(
  '/:internshipId',
  internshipIdParamValidator,
  validateRequest,
  savedInternshipController.saveInternship
);

// DELETE /bookmarks/:internshipId
router.delete(
  '/:internshipId',
  internshipIdParamValidator,
  validateRequest,
  savedInternshipController.removeSavedInternship
);

module.exports = router;
