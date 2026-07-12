const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const env = require('../config/env');
const { BadRequestError } = require('../utils/apiError');

// server/uploads/resumes and server/uploads/logos already exist (Project Setup component).
const RESUME_DIR = path.join(__dirname, '..', 'uploads', 'resumes');
const LOGO_DIR = path.join(__dirname, '..', 'uploads', 'logos');

const ALLOWED_RESUME_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
];

const ALLOWED_LOGO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/svg+xml'];

const MAX_RESUME_SIZE_BYTES = env.upload.maxResumeSizeMb * 1024 * 1024;
const MAX_LOGO_SIZE_BYTES = env.upload.maxLogoSizeMb * 1024 * 1024;

function ensureDirectoryExists(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

ensureDirectoryExists(RESUME_DIR);
ensureDirectoryExists(LOGO_DIR);

/**
 * Builds a disk storage engine that writes into the given directory using a
 * cryptographically random, non-guessable filename (per FR-RES-03 / the
 * Project Architecture document's File Upload Flow). The original,
 * client-supplied filename is never used for storage.
 */
function buildDiskStorage(destinationDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destinationDir);
    },
    filename: (req, file, cb) => {
      const extension = path.extname(file.originalname).toLowerCase();
      const uniqueName = `${crypto.randomUUID()}${extension}`;
      cb(null, uniqueName);
    },
  });
}

/**
 * Builds a Multer fileFilter that rejects any file whose actual MIME type
 * (as reported by the browser/client, verified again against the allow-list)
 * is not in the provided allow-list — regardless of file extension, per
 * FR-RES-04.
 */
function buildFileFilter(allowedMimeTypes, rejectionMessage) {
  return (req, file, cb) => {
    if (!allowedMimeTypes.includes(file.mimetype)) {
      const error = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file');
      error.message = rejectionMessage;
      cb(error);
      return;
    }
    cb(null, true);
  };
}

const resumeMulter = multer({
  storage: buildDiskStorage(RESUME_DIR),
  limits: { fileSize: MAX_RESUME_SIZE_BYTES, files: 1 },
  fileFilter: buildFileFilter(
    ALLOWED_RESUME_MIME_TYPES,
    'Only PDF or DOCX files are allowed for resumes.'
  ),
}).single('resume');

const logoMulter = multer({
  storage: buildDiskStorage(LOGO_DIR),
  limits: { fileSize: MAX_LOGO_SIZE_BYTES, files: 1 },
  fileFilter: buildFileFilter(
    ALLOWED_LOGO_MIME_TYPES,
    'Only JPG, PNG, or SVG files are allowed for company logos.'
  ),
}).single('logo');

/**
 * Wraps a configured Multer single-file handler so that any error it
 * produces (oversized file, disallowed MIME type, malformed multipart
 * payload) is converted into a typed ApiError and forwarded to the
 * centralized error handler, instead of Multer's default error shape.
 * File type and size are both validated before anything is written to
 * disk, per FR-RES-01/FR-RES-02 and Coding Standards §10.
 */
function wrapMulterHandler(multerHandler, maxSizeMb) {
  return (req, res, next) => {
    multerHandler(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new BadRequestError(`File exceeds the maximum allowed size of ${maxSizeMb} MB.`));
          return;
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
          next(new BadRequestError(err.message || 'Invalid file type.'));
          return;
        }
        next(new BadRequestError(err.message || 'File upload failed.'));
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  };
}

/**
 * Ensures a file was actually attached to the request under the expected
 * field name. Multer silently leaves req.file undefined if no file is
 * sent, which would otherwise fall through as a confusing downstream
 * error.
 */
function requireUploadedFile(fieldLabel) {
  return (req, res, next) => {
    if (!req.file) {
      next(new BadRequestError(`No ${fieldLabel} file was provided.`));
      return;
    }
    next();
  };
}

const uploadResume = wrapMulterHandler(resumeMulter, env.upload.maxResumeSizeMb);
const uploadLogo = wrapMulterHandler(logoMulter, env.upload.maxLogoSizeMb);

module.exports = {
  uploadResume,
  uploadLogo,
  requireUploadedFile,
  RESUME_DIR,
  LOGO_DIR,
  MAX_RESUME_SIZE_BYTES,
  MAX_LOGO_SIZE_BYTES,
};
