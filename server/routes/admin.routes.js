const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../utils/validateRequest');
const adminController = require('../controllers/admin.controller');
const {
  userIdParamValidator,
  companyIdParamValidator,
  internshipIdParamValidator,
  userStatusValidator,
  companyApprovalValidator,
  internshipModerateValidator,
  usersQueryValidator,
  internshipsQueryValidator,
  applicationsQueryValidator,
  auditLogsQueryValidator,
} = require('../validators/admin.validator');

const router = express.Router();

// Enforce admin-only access for all routes in this router
router.use(authenticate, authorize('admin'));

// Users management
router.get('/users', usersQueryValidator, validateRequest, adminController.getUsers);
router.patch(
  '/users/:userId/status',
  userIdParamValidator,
  userStatusValidator,
  validateRequest,
  adminController.updateUserStatus
);
router.delete('/users/:userId', userIdParamValidator, validateRequest, adminController.deleteUser);

// Verify Companies
router.get('/companies/pending', adminController.getPendingCompanies);
router.patch(
  '/companies/:companyId/approval',
  companyIdParamValidator,
  companyApprovalValidator,
  validateRequest,
  adminController.approveCompany
);

// Manage Internships
router.get('/internships', internshipsQueryValidator, validateRequest, adminController.getInternships);
router.patch(
  '/internships/:internshipId/moderate',
  internshipIdParamValidator,
  internshipModerateValidator,
  validateRequest,
  adminController.moderateInternship
);

// View Applications (platform-wide)
router.get('/applications', applicationsQueryValidator, validateRequest, adminController.getApplications);

// Audit Logs
router.get('/audit-logs', auditLogsQueryValidator, validateRequest, adminController.getAuditLogs);

module.exports = router;
