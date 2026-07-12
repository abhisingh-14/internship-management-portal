const { body, query } = require('express-validator');

const REQUIRED_SKILLS_MAX_ITEMS = 30;
const COMPANY_SETTABLE_STATUSES_CREATE = ['draft', 'published'];
const COMPANY_SETTABLE_STATUSES_UPDATE = ['draft', 'published', 'closed'];
const ALL_STATUSES = ['draft', 'published', 'closed', 'flagged', 'removed'];

const futureDateCheck = (value) => {
  if (new Date(value) <= new Date()) {
    throw new Error('Application deadline must be in the future');
  }
  return true;
};

const createInternshipValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),

  body('requiredSkills')
    .isArray({ min: 1, max: REQUIRED_SKILLS_MAX_ITEMS })
    .withMessage('At least one required skill must be provided'),

  body('requiredSkills.*')
    .isString()
    .withMessage('Each required skill must be a string')
    .trim()
    .notEmpty()
    .withMessage('Required skill cannot be empty'),

  body('location')
    .trim()
    .notEmpty()
    .withMessage('Location is required')
    .isLength({ max: 150 })
    .withMessage('Location must be at most 150 characters'),

  body('duration')
    .trim()
    .notEmpty()
    .withMessage('Duration is required')
    .isLength({ max: 50 })
    .withMessage('Duration must be at most 50 characters'),

  body('stipend')
    .notEmpty()
    .withMessage('Stipend is required')
    .isInt({ min: 0 })
    .withMessage('Stipend must be a non-negative integer')
    .toInt(),

  body('applicationDeadline')
    .notEmpty()
    .withMessage('Application deadline is required')
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom(futureDateCheck),

  body('status')
    .optional()
    .isIn(COMPANY_SETTABLE_STATUSES_CREATE)
    .withMessage('Status must be either draft or published'),
];

const updateInternshipValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage('Title must be between 5 and 150 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ min: 20, max: 5000 })
    .withMessage('Description must be between 20 and 5000 characters'),

  body('requiredSkills')
    .optional()
    .isArray({ min: 1, max: REQUIRED_SKILLS_MAX_ITEMS })
    .withMessage('At least one required skill must be provided'),

  body('requiredSkills.*')
    .optional()
    .isString()
    .withMessage('Each required skill must be a string')
    .trim()
    .notEmpty()
    .withMessage('Required skill cannot be empty'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Location must be at most 150 characters'),

  body('duration')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Duration must be at most 50 characters'),

  body('stipend')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Stipend must be a non-negative integer')
    .toInt(),

  body('applicationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Application deadline must be a valid date')
    .custom(futureDateCheck),

  body('status')
    .optional()
    .isIn(COMPANY_SETTABLE_STATUSES_UPDATE)
    .withMessage('Status must be one of draft, published, closed'),
];

const updateInternshipStatusValidator = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(ALL_STATUSES)
    .withMessage('Invalid status value'),
];

const searchInternshipsValidator = [
  query('search')
    .optional()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Search must be at most 150 characters'),

  query('status')
    .optional()
    .isIn(ALL_STATUSES)
    .withMessage('Invalid status filter'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),

  query('sort').optional().isString().trim(),
];

/**
 * Component 10 — validation for the public GET /internships listing
 * (Browse/Search Internships). All filters are optional; only their
 * *presence* is validated for type/range/length here. Business-level
 * filtering (published-only, non-expired) is applied unconditionally in
 * the model layer and is not user-controllable.
 */
const publicSearchValidator = [
  query('search').optional().trim().isLength({ max: 150 }).withMessage('Search term is too long'),
  query('location').optional().trim().isLength({ max: 150 }).withMessage('Location filter is too long'),
  query('duration').optional().trim().isLength({ max: 50 }).withMessage('Duration filter is too long'),
  query('minStipend').optional().isInt({ min: 0 }).withMessage('minStipend must be a non-negative integer'),
  query('maxStipend')
    .optional()
    .isInt({ min: 0 }).withMessage('maxStipend must be a non-negative integer')
    .custom((value, { req }) => {
      if (req.query.minStipend !== undefined && Number(value) < Number(req.query.minStipend)) {
        throw new Error('maxStipend must be greater than or equal to minStipend');
      }
      return true;
    }),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('sort').optional().isString(),
];

module.exports = {
  createInternshipValidator,
  updateInternshipValidator,
  updateInternshipStatusValidator,
  searchInternshipsValidator,
  publicSearchValidator,
};
