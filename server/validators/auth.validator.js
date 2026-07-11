// server/validators/auth.validator.js

const { body } = require('express-validator');

const registerValidator = [
  body('role')
    .trim()
    .notEmpty()
    .withMessage('Role is required')
    .isIn(['student', 'company'])
    .withMessage('Role must be either "student" or "company"'),

  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Za-z]/)
    .withMessage('Password must include at least one letter')
    .matches(/[0-9]/)
    .withMessage('Password must include at least one number'),

  body('companyName')
    .if(body('role').equals('company'))
    .trim()
    .notEmpty()
    .withMessage('Company name is required for company accounts')
    .isLength({ min: 2, max: 150 })
    .withMessage('Company name must be between 2 and 150 characters'),
];

const loginValidator = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string'),
];

const refreshTokenValidator = [
  body('refreshToken')
    .trim()
    .notEmpty()
    .withMessage('refreshToken is required')
    .isString()
    .withMessage('refreshToken must be a string'),
];

module.exports = {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
};