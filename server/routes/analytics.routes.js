const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

// Route-specific role checking is handled within each route definitions
router.get('/platform', authenticate, authorize('admin'), analyticsController.getPlatformAnalytics);
router.get('/companies/postings', authenticate, authorize('company'), analyticsController.getCompanyPostingsAnalytics);
router.get('/students/activity', authenticate, authorize('student'), analyticsController.getStudentActivityAnalytics);

module.exports = router;
