const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { NotFoundError, ConflictError } = require('../utils/apiError');

const savedInternshipModel = require('../models/savedInternship.model');
const studentProfileModel = require('../models/studentProfile.model');
const internshipModel = require('../models/internship.model');

/**
 * Resolves the student_profiles.id for the currently authenticated user.
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function getStudentId(userId) {
  const studentId = await studentProfileModel.findIdByUserId(userId);
  if (!studentId) {
    throw new NotFoundError('Student profile not found');
  }
  return studentId;
}

/**
 * POST /bookmarks/:internshipId
 * Bookmarks an internship posting.
 */
const saveInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const userId = req.user.id;

  const studentId = await getStudentId(userId);

  // Assert internship exists and is published
  const internship = await internshipModel.findInternshipById(internshipId);
  if (!internship || internship.status !== 'published') {
    throw new NotFoundError('Internship posting not found');
  }

  // Assert not already bookmarked
  const existingBookmark = await savedInternshipModel.findBookmark(studentId, internshipId);
  if (existingBookmark) {
    throw new ConflictError('You have already bookmarked this internship');
  }

  // Create bookmark
  const bookmarkId = await savedInternshipModel.createBookmark(studentId, internshipId);

  sendSuccess(res, {
    statusCode: 201,
    message: 'Internship bookmarked',
    data: {
      bookmarkId,
      internshipId: Number(internshipId),
    },
  });
});

/**
 * DELETE /bookmarks/:internshipId
 * Removes an internship from the student's bookmarks.
 */
const removeSavedInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const userId = req.user.id;

  const studentId = await getStudentId(userId);

  // Assert bookmark exists
  const existingBookmark = await savedInternshipModel.findBookmark(studentId, internshipId);
  if (!existingBookmark) {
    throw new NotFoundError('Bookmark not found');
  }

  // Delete bookmark
  await savedInternshipModel.deleteBookmark(studentId, internshipId);

  res.status(204).send();
});

/**
 * GET /bookmarks
 * Retrieves the authenticated student's bookmarked internships.
 */
const getSavedInternships = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page, limit, offset } = parsePaginationParams(req.query);

  const studentId = await getStudentId(userId);

  const { rows, total } = await savedInternshipModel.findStudentBookmarks(studentId, {
    limit,
    offset,
  });

  sendSuccess(res, {
    message: 'Bookmarked internships retrieved successfully',
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

module.exports = {
  saveInternship,
  removeSavedInternship,
  getSavedInternships,
};
