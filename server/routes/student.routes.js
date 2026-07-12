const express = require('express');
const authenticate = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const validateRequest = require('../utils/validateRequest');
const { uploadResume, requireUploadedFile } = require('../middleware/upload');
const studentController = require('../controllers/student.controller');
const applicationController = require('../controllers/application.controller');
const { queryValidator } = require('../validators/application.validator');
const {
  updateProfileValidator,
  createEducationValidator,
  updateEducationValidator,
  educationIdParamValidator,
  createSkillValidator,
  updateSkillValidator,
  skillIdParamValidator,
} = require('../validators/student.validator');

const router = express.Router();

// Every route in this file is student-only. Middleware order follows
// docs/05_Coding_Standards.md §14: authenticate -> authorize -> validate -> controller.
router.use(authenticate, authorize('student'));

// Dashboard
router.get('/dashboard', studentController.getDashboard);

// Profile
router.get('/profile', studentController.getProfile);
router.put(
  '/profile',
  updateProfileValidator,
  validateRequest,
  studentController.updateProfile
);

router.post(
  '/resume',
  uploadResume,
  requireUploadedFile('resume'),
  studentController.uploadResume
);

router.delete('/resume', studentController.deleteResume);

// Education
router.get('/education', studentController.getEducationList);
router.post(
  '/education',
  createEducationValidator,
  validateRequest,
  studentController.addEducation
);
router.put(
  '/education/:educationId',
  updateEducationValidator,
  validateRequest,
  studentController.updateEducation
);
router.delete(
  '/education/:educationId',
  educationIdParamValidator,
  validateRequest,
  studentController.deleteEducation
);

// Skills
router.get('/skills', studentController.getSkillsList);
router.post(
  '/skills',
  createSkillValidator,
  validateRequest,
  studentController.addSkill
);
router.put(
  '/skills/:skillId',
  updateSkillValidator,
  validateRequest,
  studentController.updateSkill
);
router.delete(
  '/skills/:skillId',
  skillIdParamValidator,
  validateRequest,
  studentController.deleteSkill
);

// Applications
router.get('/applications', queryValidator, validateRequest, applicationController.getStudentApplications);

module.exports = router;
