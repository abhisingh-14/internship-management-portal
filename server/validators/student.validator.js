const { body, param } = require('express-validator');

const PROFICIENCY_LEVELS = ['beginner', 'intermediate', 'advanced', 'expert'];

/**
 * Express Validator rule sets for the Student Module (profile, education,
 * skills). Applied as middleware before the corresponding controller
 * function, followed by the generic `validateRequest` middleware which
 * turns any failure into a 422 ValidationError, per
 * docs/05_Coding_Standards.md §10.
 */

// PUT /students/profile
const updateProfileValidator = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('bio')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Bio must be at most 1000 characters'),
];

// POST /students/education
const createEducationValidator = [
  body('institutionName')
    .trim()
    .notEmpty()
    .withMessage('Institution name is required')
    .isLength({ max: 200 })
    .withMessage('Institution name must be at most 200 characters'),
  body('degree')
    .trim()
    .notEmpty()
    .withMessage('Degree is required')
    .isLength({ max: 150 })
    .withMessage('Degree must be at most 150 characters'),
  body('fieldOfStudy')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Field of study must be at most 150 characters'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)')
    .custom((endDate, { req }) => {
      if (req.body.startDate && new Date(endDate) < new Date(req.body.startDate)) {
        throw new Error('End date cannot be before start date');
      }
      return true;
    }),
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('isCurrent must be true or false'),
  body('grade')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Grade must be at most 50 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
];

// PUT /students/education/:educationId
const updateEducationValidator = [
  param('educationId')
    .isInt({ min: 1 })
    .withMessage('educationId must be a positive integer'),
  body('institutionName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Institution name must be at most 200 characters'),
  body('degree')
    .optional()
    .trim()
    .isLength({ min: 1, max: 150 })
    .withMessage('Degree must be at most 150 characters'),
  body('fieldOfStudy')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 150 })
    .withMessage('Field of study must be at most 150 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date (YYYY-MM-DD)'),
  body('endDate')
    .optional({ nullable: true })
    .isISO8601()
    .withMessage('End date must be a valid date (YYYY-MM-DD)'),
  body('isCurrent')
    .optional()
    .isBoolean()
    .withMessage('isCurrent must be true or false'),
  body('grade')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage('Grade must be at most 50 characters'),
  body('description')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Description must be at most 2000 characters'),
];

// DELETE /students/education/:educationId
const educationIdParamValidator = [
  param('educationId')
    .isInt({ min: 1 })
    .withMessage('educationId must be a positive integer'),
];

// POST /students/skills
const createSkillValidator = [
  body('skillName')
    .trim()
    .notEmpty()
    .withMessage('Skill name is required')
    .isLength({ max: 100 })
    .withMessage('Skill name must be at most 100 characters'),
  body('proficiencyLevel')
    .optional()
    .isIn(PROFICIENCY_LEVELS)
    .withMessage(`proficiencyLevel must be one of: ${PROFICIENCY_LEVELS.join(', ')}`),
];

// PUT /students/skills/:skillId
const updateSkillValidator = [
  param('skillId').isInt({ min: 1 }).withMessage('skillId must be a positive integer'),
  body('proficiencyLevel')
    .notEmpty()
    .withMessage('proficiencyLevel is required')
    .isIn(PROFICIENCY_LEVELS)
    .withMessage(`proficiencyLevel must be one of: ${PROFICIENCY_LEVELS.join(', ')}`),
];

// DELETE /students/skills/:skillId
const skillIdParamValidator = [
  param('skillId').isInt({ min: 1 }).withMessage('skillId must be a positive integer'),
];

module.exports = {
  updateProfileValidator,
  createEducationValidator,
  updateEducationValidator,
  educationIdParamValidator,
  createSkillValidator,
  updateSkillValidator,
  skillIdParamValidator,
};
