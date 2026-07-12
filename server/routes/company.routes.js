const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../utils/validateRequest');
const { uploadLogo, requireUploadedFile } = require('../middleware/upload');
const { updateCompanyProfileValidator } = require('../validators/company.validator');
const companyController = require('../controllers/company.controller');

const router = express.Router();

// GET /api/v1/companies/dashboard
router.get('/dashboard', authenticate, authorize('company'), companyController.getDashboard);

// GET /api/v1/companies/profile
router.get('/profile', authenticate, authorize('company'), companyController.getProfile);

// PUT /api/v1/companies/profile
router.put(
  '/profile',
  authenticate,
  authorize('company'),
  updateCompanyProfileValidator,
  validateRequest,
  companyController.updateProfile
);

router.post(
  '/logo',
  authenticate,
  authorize('company'),
  uploadLogo,
  requireUploadedFile('logo'),
  companyController.uploadLogo
);

// Public route - no authentication required. Declared last so it only
// catches company IDs that don't match one of the literal paths above.
router.get('/:companyId', companyController.getPublicProfile);

module.exports = router;
