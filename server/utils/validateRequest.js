/**
 * validateRequest.js
 *
 * Generic middleware that reads the result of any Express Validator
 * schema previously run on the request (via `check`/`body`/`query`/
 * `param` chains declared in server/validators/*.js) and forwards a
 * typed ValidationError to the centralized error handler if any field
 * failed validation.
 *
 * This middleware is resource-agnostic: it does not know about
 * students, companies, internships, or applications. Each resource's
 * validator file is responsible for declaring the field-level rules;
 * this file only turns the accumulated result into the standard
 * 422 error envelope, per docs/05_Coding_Standards.md §10.
 *
 * Usage (in a future component):
 *   const { body } = require('express-validator');
 *   const validateRequest = require('../middleware/validateRequest');
 *
 *   router.post(
 *     '/internships',
 *     [ body('title').isLength({ min: 5, max: 150 }), ... ],
 *     validateRequest,
 *     internshipController.createInternship
 *   );
 */

const { validationResult } = require('express-validator');
const { ValidationError } = require('../utils/apiError');

function validateRequest(req, res, next) {
  const result = validationResult(req);

  if (result.isEmpty()) {
    return next();
  }

  const formattedErrors = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));

  return next(new ValidationError(formattedErrors));
}

module.exports = validateRequest;
