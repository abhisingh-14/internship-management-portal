const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../middleware/validateRequest');
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

module.exports = router;
