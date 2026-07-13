const { body, query, param } = require('express-validator');

const userIdParamValidator = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
    .toInt(),
];

const companyIdParamValidator = [
  param('companyId')
    .notEmpty()
    .withMessage('Company ID is required')
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer')
    .toInt(),
];

const internshipIdParamValidator = [
  param('internshipId')
    .notEmpty()
    .withMessage('Internship ID is required')
    .isInt({ min: 1 })
    .withMessage('Internship ID must be a positive integer')
    .toInt(),
];

const userStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['active', 'deactivated'])
    .withMessage('Status must be active or deactivated'),
];

const companyApprovalValidator = [
  body('decision')
    .notEmpty()
    .withMessage('Decision is required')
    .isIn(['approved', 'rejected'])
    .withMessage('Decision must be approved or rejected'),
  body('reason')
    .if(body('decision').equals('rejected'))
    .notEmpty()
    .withMessage('Reason is required when rejecting a company')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

const internshipModerateValidator = [
  body('action')
    .notEmpty()
    .withMessage('Action is required')
    .isIn(['flagged', 'removed', 'restored'])
    .withMessage('Action must be flagged, removed, or restored'),
  body('reason')
    .if(body('action').isIn(['flagged', 'removed']))
    .notEmpty()
    .withMessage('Reason is required when flagging or removing an internship')
    .isString()
    .withMessage('Reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Reason must not exceed 500 characters'),
];

const usersQueryValidator = [
  query('role')
    .optional()
    .isIn(['student', 'company'])
    .withMessage('Role must be student or company'),
  query('status')
    .optional()
    .isIn(['active', 'deactivated'])
    .withMessage('Status must be active or deactivated'),
  query('search')
    .optional()
    .isString()
    .trim(),
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
];

const internshipsQueryValidator = [
  query('status')
    .optional()
    .isIn(['draft', 'published', 'closed', 'flagged', 'removed'])
    .withMessage('Status must be draft, published, closed, flagged, or removed'),
  query('companyId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Company ID must be a positive integer')
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
];

const auditLogsQueryValidator = [
  query('actorId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Actor ID must be a positive integer')
    .toInt(),
  query('action')
    .optional()
    .isString()
    .trim(),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid date in ISO 8601 format'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid date in ISO 8601 format'),
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
];

const applicationsQueryValidator = [
  query('status')
    .optional()
    .isIn(['applied', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn'])
    .withMessage('Status must be applied, under_review, shortlisted, accepted, rejected, or withdrawn'),
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
];

module.exports = {
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
};
