/**
 * apiError.js
 *
 * Defines a small hierarchy of typed, operational error classes used
 * throughout the backend. Controllers, models, and middleware throw
 * these instead of generic Error objects (or plain string messages) so
 * that the centralized error-handling middleware (server/middleware/
 * errorHandler.js) can map them to the correct HTTP status code and
 * response envelope without ever string-matching an error message.
 *
 * This file intentionally groups several small, tightly related classes
 * in one module per docs/05_Coding_Standards.md §1 ("a file explicitly
 * groups small, tightly related named exports").
 *
 * NOTE: This component does not introduce authentication or business
 * logic. These classes are generic infrastructure; concrete usages
 * (e.g. throwing NotFoundError when an internship does not exist) will
 * appear starting with the components that implement real resources.
 */

/**
 * Base class for all operational (expected, handled) errors in the
 * application. `isOperational` allows the error handler to distinguish
 * deliberately thrown errors from truly unexpected programming errors,
 * without changing the client-facing response shape.
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode - HTTP status code to respond with.
   * @param {string} message - Human-readable, client-safe message.
   * @param {Array<{field: string, message: string}>|null} errors -
   *   Optional field-level validation errors, per the API error envelope.
   */
  constructor(statusCode, message, errors = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/** 400 Bad Request — malformed request or business-rule violation that isn't a field-level validation failure. */
class BadRequestError extends ApiError {
  constructor(message = 'Bad request') {
    super(400, message);
  }
}

/** 401 Unauthorized — missing, invalid, or expired authentication token. */
class UnauthorizedError extends ApiError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/** 403 Forbidden — valid token, but insufficient role or ownership permissions. */
class ForbiddenError extends ApiError {
  constructor(message = 'Forbidden') {
    super(403, message);
  }
}

/** 404 Not Found — the requested resource does not exist. */
class NotFoundError extends ApiError {
  constructor(message = 'Resource not found') {
    super(404, message);
  }
}

/** 409 Conflict — the request conflicts with the current state (e.g. duplicate application, duplicate email). */
class ConflictError extends ApiError {
  constructor(message = 'Conflict with current state') {
    super(409, message);
  }
}

/** 422 Unprocessable Entity — field-level validation failures, always carrying an `errors` array. */
class ValidationError extends ApiError {
  constructor(errors, message = 'Validation failed') {
    super(422, message, errors);
  }
}

/** 500 Internal Server Error — genuinely unexpected server fault. */
class InternalServerError extends ApiError {
  constructor(message = 'Internal server error') {
    super(500, message);
  }
}

module.exports = {
  ApiError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
};
