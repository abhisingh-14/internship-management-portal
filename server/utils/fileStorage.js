const path = require('path');
const fs = require('fs/promises');
const { existsSync } = require('fs');
const logger = require('./logger');
const { RESUME_DIR, LOGO_DIR } = require('../middleware/upload');

/**
 * Extracts just the filename portion from a stored resume/logo URL such as
 * "/uploads/resumes/3f1c9e2a-....pdf", guarding against path traversal by
 * discarding any directory segments the stored value might (incorrectly)
 * contain.
 */
function extractFilenameFromUrl(fileUrl) {
  if (!fileUrl) {
    return null;
  }
  return path.basename(fileUrl);
}

/**
 * Deletes a previously uploaded resume file from disk, if present. Used
 * both when a student uploads a replacement resume (old file must not be
 * orphaned) and when a student explicitly deletes their resume.
 * Never throws — a missing or already-deleted file is not an error for the
 * caller's purposes, but unexpected filesystem errors are logged.
 */
async function deleteResumeFileIfExists(resumeUrl) {
  const filename = extractFilenameFromUrl(resumeUrl);
  if (!filename) {
    return;
  }
  const filePath = path.join(RESUME_DIR, filename);
  try {
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    logger.error('Failed to delete resume file from disk', {
      filePath,
      message: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Deletes a previously uploaded company logo file from disk, if present.
 * Used when a company uploads a replacement logo.
 */
async function deleteLogoFileIfExists(logoUrl) {
  const filename = extractFilenameFromUrl(logoUrl);
  if (!filename) {
    return;
  }
  const filePath = path.join(LOGO_DIR, filename);
  try {
    if (existsSync(filePath)) {
      await fs.unlink(filePath);
    }
  } catch (error) {
    logger.error('Failed to delete logo file from disk', {
      filePath,
      message: error.message,
      stack: error.stack,
    });
  }
}

/**
 * Builds the public-facing URL persisted in the database and returned by
 * the API. These paths are served through the controlled routes in
 * server/routes/file.routes.js — never through an open express.static
 * mount — so access can be gated by ownership rules.
 */
function buildResumeUrl(filename) {
  return `/uploads/resumes/${filename}`;
}

function buildLogoUrl(filename) {
  return `/uploads/logos/${filename}`;
}

module.exports = {
  extractFilenameFromUrl,
  deleteResumeFileIfExists,
  deleteLogoFileIfExists,
  buildResumeUrl,
  buildLogoUrl,
};
