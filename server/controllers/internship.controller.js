const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { NotFoundError, ForbiddenError } = require('../utils/apiError');
const internshipModel = require('../models/internship.model');
const { SORTABLE_COLUMNS } = internshipModel;
const companyProfileModel = require('../models/companyProfile.model');

/**
 * Parses the shared `sort` query convention ("-createdAt", "stipend", ...)
 * documented in docs/03_API_Design.md §3 into a resolved SQL column and
 * direction, falling back to newest-first when absent/invalid.
 * @param {string|undefined} sort
 * @returns {{ sortColumn: string, sortDirection: 'ASC' | 'DESC' }}
 */
function resolveSort(sort) {
  if (!sort) {
    return { sortColumn: SORTABLE_COLUMNS.createdAt, sortDirection: 'DESC' };
  }
  const descending = sort.startsWith('-');
  const field = descending ? sort.slice(1) : sort;
  const sortColumn = SORTABLE_COLUMNS[field] || SORTABLE_COLUMNS.createdAt;
  return { sortColumn, sortDirection: descending ? 'DESC' : 'ASC' };
}

const COMPANY_ALLOWED_STATUS_TRANSITIONS = ['draft', 'published', 'closed'];
const UPDATABLE_FIELDS = [
  'title',
  'description',
  'requiredSkills',
  'location',
  'duration',
  'stipend',
  'applicationDeadline',
  'status',
];

/**
 * Loads the authenticated company user's company_profiles row, throwing a
 * typed error if it does not exist (should not normally happen for a
 * properly-registered company account).
 */
async function getOwnCompanyProfile(userId) {
  const profile = await companyProfileModel.findByUserId(userId);

  if (!profile) {
    throw new NotFoundError('Company profile not found');
  }

  return profile;
}

/**
 * Loads an internship by id and verifies the authenticated company user
 * owns it, throwing NotFoundError or ForbiddenError as appropriate.
 */
async function assertCompanyOwnsInternship(internshipId, userId) {
  const internship = await internshipModel.findInternshipById(internshipId);

  if (!internship) {
    throw new NotFoundError('Internship posting not found');
  }

  if (internship.companyUserId !== userId) {
    throw new ForbiddenError('You do not have permission to manage this internship posting');
  }

  return internship;
}

/**
 * POST /internships
 * Creates a new internship posting for the authenticated, approved company.
 */
const createInternship = asyncHandler(async (req, res) => {
  const companyProfile = await getOwnCompanyProfile(req.user.userId);

  if (companyProfile.approval_status !== 'approved') {
    throw new ForbiddenError(
      'Your company account must be approved by an admin before you can post internships'
    );
  }

  const {
    title,
    description,
    requiredSkills,
    location,
    duration,
    stipend,
    applicationDeadline,
    status,
  } = req.body;

  const internship = await internshipModel.createInternship({
    companyId: companyProfile.id,
    title,
    description,
    requiredSkills,
    location,
    duration,
    stipend,
    applicationDeadline,
    status: status || 'draft',
  });

  sendSuccess(res, {
    statusCode: 201,
    message: 'Internship posting created successfully',
    data: internship,
  });
});

/**
 * GET /internships/my
 * Retrieves the authenticated company's own internship postings, with
 * optional keyword search, status filter, sorting, and pagination.
 */
const getMyInternships = asyncHandler(async (req, res) => {
  const companyProfile = await getOwnCompanyProfile(req.user.userId);
  const { page, limit, offset } = parsePaginationParams(req.query);
  const { search, status, sort } = req.query;

  const { rows, total } = await internshipModel.findInternshipsByCompany({
    companyId: companyProfile.id,
    search,
    status,
    limit,
    offset,
    sort,
  });

  sendSuccess(res, {
    message: 'Internship postings retrieved successfully',
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

/**
 * GET /internships
 * Role: Public (Component 10). Returns only active (published,
 * non-expired) internships, with keyword search and filters.
 */
const listPublishedInternships = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePaginationParams(req.query);
  const { sortColumn, sortDirection } = resolveSort(req.query.sort);

  const minStipend = req.query.minStipend !== undefined ? Number(req.query.minStipend) : undefined;
  const maxStipend = req.query.maxStipend !== undefined ? Number(req.query.maxStipend) : undefined;

  const { items, totalItems } = await internshipModel.findPublishedInternships({
    search: req.query.search,
    location: req.query.location,
    minStipend,
    maxStipend,
    duration: req.query.duration,
    sortColumn,
    sortDirection,
    limit,
    offset,
  });

  return sendSuccess(res, {
    message: 'Internships retrieved successfully',
    data: items,
    meta: buildPaginationMeta(page, limit, totalItems),
  });
});

/**
 * GET /internships/:internshipId
 * Public for published postings; the owning company or an admin may view
 * a posting in any status (draft, closed, flagged, removed).
 */
const getInternshipById = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const internship = await internshipModel.findInternshipById(internshipId);

  if (!internship) {
    throw new NotFoundError('Internship posting not found');
  }

  const isOwner =
    req.user && req.user.role === 'company' && req.user.userId === internship.companyUserId;
  const isAdmin = req.user && req.user.role === 'admin';

  if (internship.status !== 'published' && !isOwner && !isAdmin) {
    // Do not reveal existence of non-published postings to unauthorized viewers.
    throw new NotFoundError('Internship posting not found');
  }

  sendSuccess(res, {
    message: 'Internship posting retrieved successfully',
    data: internship,
  });
});

/**
 * PUT /internships/:internshipId
 * Updates an internship posting owned by the authenticated company.
 * All fields are optional; only supplied fields are applied.
 */
const updateInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  await assertCompanyOwnsInternship(internshipId, req.user.userId);

  const updates = {};
  UPDATABLE_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(req.body, field)) {
      updates[field] = req.body[field];
    }
  });

  if (updates.status && !COMPANY_ALLOWED_STATUS_TRANSITIONS.includes(updates.status)) {
    throw new ForbiddenError('Companies may only set status to draft, published, or closed');
  }

  const updatedInternship = await internshipModel.updateInternship(internshipId, updates);

  sendSuccess(res, {
    message: 'Internship posting updated successfully',
    data: updatedInternship,
  });
});

/**
 * PATCH /internships/:internshipId/status
 * Company owners may transition between draft/published/closed only.
 * Admins may additionally set flagged/removed (moderation) per API design.
 */
const updateInternshipStatus = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const { status } = req.body;

  const internship = await internshipModel.findInternshipById(internshipId);

  if (!internship) {
    throw new NotFoundError('Internship posting not found');
  }

  const isAdmin = req.user.role === 'admin';
  const isOwner = req.user.role === 'company' && req.user.userId === internship.companyUserId;

  if (!isAdmin && !isOwner) {
    throw new ForbiddenError('You do not have permission to change this internship posting status');
  }

  if (!isAdmin && !COMPANY_ALLOWED_STATUS_TRANSITIONS.includes(status)) {
    throw new ForbiddenError('Companies may only set status to draft, published, or closed');
  }

  const updatedInternship = await internshipModel.updateInternshipStatus(internshipId, status);

  sendSuccess(res, {
    message: 'Internship posting status updated successfully',
    data: updatedInternship,
  });
});

/**
 * DELETE /internships/:internshipId
 * Hard-deletes the posting if it has zero applications; otherwise
 * soft-deletes it (status = 'removed') to preserve applicant history,
 * per the deletion rule documented in docs/03_API_Design.md §8.4.
 */
const deleteInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  await assertCompanyOwnsInternship(internshipId, req.user.userId);

  const applicationCount = await internshipModel.countApplicationsForInternship(internshipId);

  if (applicationCount === 0) {
    await internshipModel.deleteInternshipHard(internshipId);
    res.status(204).send();
    return;
  }

  const removedInternship = await internshipModel.softRemoveInternship(internshipId);

  sendSuccess(res, {
    message: 'Internship posting has existing applications and was archived instead of deleted',
    data: removedInternship,
  });
});

module.exports = {
  createInternship,
  getMyInternships,
  listPublishedInternships,
  getInternshipById,
  updateInternship,
  updateInternshipStatus,
  deleteInternship,
};
