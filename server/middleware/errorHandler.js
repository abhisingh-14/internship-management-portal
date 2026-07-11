/**
 * errorHandler.js
 *
 * Centralized Express error-handling middleware. This is the ONLY place
 * in the backend that maps an error to an HTTP status code and the
 * standard error response envelope defined in
 * docs/03_API_Design.md §5:
 *
 *   {
 *     "success": false,
 *     "message": "...",
 *     "errors": [ { "field": "...", "message": "..." } ]   // validation only
 *   }
 *
 * Errors reach this middleware either because a route handler was
 * wrapped in `asyncHandler` (server/utils/asyncHandler.js) and its
 * rejection was forwarded via `next(error)`, or because a controller/
 * middleware explicitly called `next(new SomeApiError(...))`.
 *
 * Classification rules:
 *   - Errors that are instances of `ApiError` (server/utils/apiError.js)
 *     carry their own `statusCode` and, for ValidationError, an
 *     `errors` array — these are considered "operational" and their
 *     message is always safe to return to the client.
 *   - Any other error (a genuine bug, a driver-level exception, etc.)
 *     is treated as an unexpected 500. In production its message is
 *     replaced with a generic, detail-free string so stack traces, raw
 *     SQL, or internal file paths are never leaked to the client; the
 *     full error is still logged server-side.
 */

const { ApiError } = require('../utils/apiError');
const logger = require('../utils/logger');

/**
 * 404 fallback for any request that didn't match a defined route.
 * Runs before errorHandler in the middleware chain (see server/app.js).
 */
function notFoundHandler(req, res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
}

/**
 * Express error-handling middleware. Must be registered last, after all
 * routes and the 404 handler, and must keep all four parameters (`err`,
 * `req`, `res`, `next`) so Express recognizes it as an error handler.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isKnownError = err instanceof ApiError;
  const statusCode = isKnownError ? err.statusCode : (err.statusCode || 500);

  const logContext = {
    method: req.method,
    path: req.originalUrl,
    statusCode,
  };

  if (statusCode >= 500) {
    logger.error(err.message, { ...logContext, stack: err.stack });
  } else {
    logger.warn(err.message, logContext);
  }

  const responseBody = {
    success: false,
    message: isKnownError || !isProduction ? err.message : 'Internal server error',
  };

  if (isKnownError && err.errors) {
    responseBody.errors = err.errors;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = { errorHandler, notFoundHandler };
