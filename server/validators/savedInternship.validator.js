const { param, query } = require('express-validator');

const internshipIdParamValidator = [
  param('internshipId')
    .notEmpty()
    .withMessage('Internship ID is required')
    .isInt({ min: 1 })
    .withMessage('Internship ID must be a positive integer')
    .toInt(),
];

const queryValidator = [
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
  internshipIdParamValidator,
  queryValidator,
};
