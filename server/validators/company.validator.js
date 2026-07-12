const { body } = require('express-validator');

/**
 * Validation rules for PUT /companies/profile.
 * All fields are optional on update — only supplied fields are validated
 * and persisted, per docs/03_API_Design.md §8.3 and
 * docs/05_Coding_Standards.md §10.
 */
const updateCompanyProfileValidator = [
  body('companyName')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Company name must be between 2 and 150 characters'),

  body('description')
    .optional({ nullable: true })
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),

  body('website')
    .optional({ nullable: true })
    .isString()
    .withMessage('Website must be a string')
    .isURL()
    .withMessage('Website must be a valid URL'),

  body('industry')
    .optional({ nullable: true })
    .isString()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Industry must not exceed 100 characters'),
];

module.exports = {
  updateCompanyProfileValidator,
};
