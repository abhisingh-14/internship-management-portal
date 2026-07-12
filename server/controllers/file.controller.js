const path = require('path');
const { existsSync } = require('fs');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError, ForbiddenError } = require('../utils/apiError');
const { RESUME_DIR, LOGO_DIR } = require('../middleware/upload');
const studentProfileModel = require('../models/studentProfile.model');

/**
 * GET /uploads/resumes/:filename
 *
 * Serves a single resume file. Access is restricted per FR-RES-05:
 *   - Admins may access any resume.
 *   - A student may access only their own resume.
 *   - Companies may access resumes only of students who applied to their
 *     own postings — that check depends on the `applications` table, which
 *     is introduced by a later Applications component and is not yet
 *     available here. Company access is therefore intentionally denied
 *     for now and should be extended once that table exists (see
 *     08_File_Upload.md "Future Dependencies").
 */
const serveResume = asyncHandler(async (req, res, next) => {
  // path.basename strips any directory segments, preventing path traversal
  // via a crafted :filename value (e.g. "../../.env").
  const filename = path.basename(req.params.filename);
  const filePath = path.join(RESUME_DIR, filename);

  if (!existsSync(filePath)) {
    next(new NotFoundError('Resume not found.'));
    return;
  }

  if (req.user.role === 'admin') {
    res.sendFile(filePath);
    return;
  }

  if (req.user.role === 'student') {
    const profile = await studentProfileModel.findByUserId(req.user.userId);
    const ownsThisFile = profile && profile.resumeUrl && profile.resumeUrl.endsWith(filename);
    if (!ownsThisFile) {
      next(new ForbiddenError('You do not have permission to access this resume.'));
      return;
    }
    res.sendFile(filePath);
    return;
  }

  next(new ForbiddenError('You do not have permission to access this resume.'));
});

/**
 * GET /uploads/logos/:filename
 *
 * Serves a single company logo. Logos are considered public information
 * (they appear on the public GET /companies/:companyId endpoint), so no
 * authentication or ownership check is required — this route exists
 * instead of an open express.static mount purely so logo access is
 * mediated by a controller rather than exposing the raw uploads directory.
 */
const serveLogo = asyncHandler(async (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const filePath = path.join(LOGO_DIR, filename);

  if (!existsSync(filePath)) {
    next(new NotFoundError('Logo not found.'));
    return;
  }

  res.sendFile(filePath);
});

module.exports = { serveResume, serveLogo };
