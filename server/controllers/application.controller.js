const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { ApiError, NotFoundError, ForbiddenError, ConflictError, BadRequestError } = require('../utils/apiError');
const applicationModel = require('../models/application.model');
const notificationModel = require('../models/notification.model');
const internshipModel = require('../models/internship.model');
const studentProfileModel = require('../models/studentProfile.model');
const companyProfileModel = require('../models/companyProfile.model');

// Define valid status transitions to prevent skipping backward or reopening closed applications
const VALID_TRANSITIONS = {
  applied: ['under_review', 'shortlisted', 'accepted', 'rejected'],
  under_review: ['shortlisted', 'accepted', 'rejected'],
  shortlisted: ['accepted', 'rejected'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

/**
 * Resolves the student_profiles.id for the given users.id.
 */
async function getStudentId(userId) {
  const studentId = await studentProfileModel.findIdByUserId(userId);
  if (!studentId) {
    throw new NotFoundError('Student profile not found');
  }
  return studentId;
}

/**
 * POST /internships/:internshipId/applications
 * Submits a new application to an internship posting.
 */
const applyForInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const { coverLetter } = req.body;
  const userId = req.user.userId;

  // Resolve student profile
  const studentProfile = await studentProfileModel.findByUserId(userId);
  if (!studentProfile) {
    throw new NotFoundError('Student profile not found');
  }

  // Ensure student has a resume on file
  if (!studentProfile.resumeUrl) {
    throw new ForbiddenError('You must upload a resume before applying to internships');
  }

  // Ensure internship posting exists
  const internship = await internshipModel.findInternshipById(internshipId);
  if (!internship) {
    throw new NotFoundError('Internship posting not found');
  }

  // Ensure internship is published
  if (internship.status !== 'published') {
    throw new NotFoundError('Internship posting is not available for applications');
  }

  // Ensure application deadline has not passed
  if (new Date(internship.applicationDeadline) < new Date()) {
    throw new BadRequestError('The application deadline for this internship has passed');
  }

  // Check if student has already applied
  const isDuplicate = await applicationModel.checkDuplicate(internshipId, studentProfile.id);
  if (isDuplicate) {
    throw new ConflictError('You have already applied to this internship');
  }

  // Create application
  const applicationId = await applicationModel.createApplication({
    internshipId,
    studentId: studentProfile.id,
    coverLetter,
  });

  const created = await applicationModel.findById(applicationId);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Application submitted successfully',
    data: created,
  });
});

/**
 * GET /applications/:applicationId
 * Retrieves details of a single application.
 */
const getApplicationDetails = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { userId, role } = req.user;

  const application = await applicationModel.findById(applicationId);
  if (!application) {
    throw new NotFoundError('Application not found');
  }

  // Authorization check
  if (role === 'student') {
    const studentId = await getStudentId(userId);
    if (application.studentId !== studentId) {
      throw new ForbiddenError('You do not have permission to view this application');
    }
  } else if (role === 'company') {
    const companyProfile = await companyProfileModel.findByUserId(userId);
    if (!companyProfile || application.internship.companyId !== companyProfile.id) {
      throw new ForbiddenError('You do not have permission to view this application');
    }
  }

  sendSuccess(res, {
    message: 'Application details retrieved successfully',
    data: application,
  });
});

/**
 * PATCH /applications/:applicationId/status
 * Updates the status of an application.
 */
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { status } = req.body;
  const { userId, role } = req.user;

  const application = await applicationModel.findById(applicationId);
  if (!application) {
    throw new NotFoundError('Application not found');
  }

  // Auth check: related company owner or admin
  if (role === 'company') {
    const companyProfile = await companyProfileModel.findByUserId(userId);
    if (!companyProfile || application.internship.companyId !== companyProfile.id) {
      throw new ForbiddenError('You do not have permission to update this application');
    }
  }

  // Validate status transition
  const currentStatus = application.status;
  const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowedNext.includes(status)) {
    throw new ApiError(
      422,
      `Invalid status transition from '${currentStatus}' to '${status}'`
    );
  }

  // Perform update
  await applicationModel.updateStatus(applicationId, status);
  const updated = await applicationModel.findById(applicationId);

  // Send in-app notification to the student user
  const notificationTitle = `Application Update: ${updated.internship.title}`;
  let notificationMessage = '';
  switch (status) {
    case 'under_review':
      notificationMessage = `Your application for "${updated.internship.title}" is now under review.`;
      break;
    case 'shortlisted':
      notificationMessage = `Congratulations! You have been shortlisted for "${updated.internship.title}".`;
      break;
    case 'accepted':
      notificationMessage = `Wonderful news! Your application for "${updated.internship.title}" has been accepted.`;
      break;
    case 'rejected':
      notificationMessage = `Thank you for applying. Unfortunately, your application for "${updated.internship.title}" was not selected.`;
      break;
  }

  await notificationModel.createNotification({
    userId: updated.student.userId,
    type: 'application_status',
    title: notificationTitle,
    message: notificationMessage,
  });

  sendSuccess(res, {
    message: `Application status updated to ${status} successfully`,
    data: updated,
  });
});

/**
 * DELETE /applications/:applicationId
 * Withdraws an application (student-initiated), permitted only while status is 'applied'.
 */
const withdrawApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const userId = req.user.userId;

  const application = await applicationModel.findById(applicationId);
  if (!application) {
    throw new NotFoundError('Application not found');
  }

  // Assert ownership
  const studentId = await getStudentId(userId);
  if (application.studentId !== studentId) {
    throw new ForbiddenError('You do not have permission to withdraw this application');
  }

  // Permit only while status is 'applied'
  if (application.status !== 'applied') {
    throw new ConflictError(
      `Cannot withdraw application because its status is already '${application.status}'`
    );
  }

  // Soft-delete by updating status to 'withdrawn'
  await applicationModel.updateStatus(applicationId, 'withdrawn');
  const updated = await applicationModel.findById(applicationId);

  sendSuccess(res, {
    message: 'Application withdrawn successfully',
    data: updated,
  });
});

/**
 * GET /students/applications
 * Retrieves the authenticated student's application history.
 */
const getStudentApplications = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { status, sort } = req.query;
  const { page, limit, offset } = parsePaginationParams(req.query);

  const studentId = await getStudentId(userId);

  const { rows, total } = await applicationModel.findStudentApplications(studentId, {
    status,
    limit,
    offset,
    sort,
  });

  sendSuccess(res, {
    message: 'Student application history retrieved successfully',
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

/**
 * GET /companies/applicants
 * Retrieves all applicants across all of the company's internship postings.
 */
const getCompanyApplicants = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { internshipId, status, sort } = req.query;
  const { page, limit, offset } = parsePaginationParams(req.query);

  const companyProfile = await companyProfileModel.findByUserId(userId);
  if (!companyProfile) {
    throw new NotFoundError('Company profile not found');
  }

  const { rows, total } = await applicationModel.findCompanyApplicants(companyProfile.id, {
    internshipId,
    status,
    limit,
    offset,
    sort,
  });

  sendSuccess(res, {
    message: 'Applicants retrieved successfully',
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

/**
 * GET /internships/:internshipId/applications
 * Retrieves all applications submitted to a specific internship posting.
 */
const getInternshipApplications = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const { status, sort } = req.query;
  const { page, limit, offset } = parsePaginationParams(req.query);
  const { userId, role } = req.user;

  // Assert internship exists
  const internship = await internshipModel.findInternshipById(internshipId);
  if (!internship) {
    throw new NotFoundError('Internship posting not found');
  }

  // Auth check: company owner or admin
  if (role === 'company') {
    if (internship.companyUserId !== userId) {
      throw new ForbiddenError('You do not have permission to view applicants for this posting');
    }
  }

  const { rows, total } = await applicationModel.findInternshipApplications(internshipId, {
    status,
    limit,
    offset,
    sort,
  });

  sendSuccess(res, {
    message: 'Applications for internship retrieved successfully',
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

module.exports = {
  applyForInternship,
  getApplicationDetails,
  updateApplicationStatus,
  withdrawApplication,
  getStudentApplications,
  getCompanyApplicants,
  getInternshipApplications,
};
