const { param, query } = require('express-validator');

const notificationIdParamValidator = [
  param('notificationId')
    .notEmpty()
    .withMessage('Notification ID is required')
    .isInt({ min: 1 })
    .withMessage('Notification ID must be a positive integer')
    .toInt(),
];

const queryValidator = [
  query('unreadOnly')
    .optional()
    .isBoolean()
    .withMessage('unreadOnly must be a boolean')
    .customSanitizer((value) => value === 'true' || value === true),

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
  notificationIdParamValidator,
  queryValidator,
};
