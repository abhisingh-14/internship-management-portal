const { body, query, param } = require('express-validator');

const ALLOWED_STATUSES = ['applied', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'];
const COMPANY_SETTABLE_STATUSES = ['under_review', 'shortlisted', 'accepted', 'rejected'];

const applyValidator = [
  body('coverLetter')
    .optional({ nullable: true })
    .isString()
    .withMessage('Cover letter must be a string')
    .isLength({ max: 3000 })
    .withMessage('Cover letter must not exceed 3000 characters'),
];

const updateStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(COMPANY_SETTABLE_STATUSES)
    .withMessage(`Status must be one of: ${COMPANY_SETTABLE_STATUSES.join(', ')}`),
];

const queryValidator = [
  query('status')
    .optional()
    .isIn(ALLOWED_STATUSES)
    .withMessage(`Status filter must be one of: ${ALLOWED_STATUSES.join(', ')}`),

  query('internshipId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Internship ID must be a positive integer')
    .toInt(),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50')
    .toInt(),

  query('sort')
    .optional()
    .isString()
    .trim(),
];

module.exports = {
  applyValidator,
  updateStatusValidator,
  queryValidator,
};
