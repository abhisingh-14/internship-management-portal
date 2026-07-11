/**
 * apiResponse.js
 *
 * Provides a single, shared way to send successful responses so every
 * controller returns the exact envelope defined in
 * docs/03_API_Design.md §4:
 *
 *   {
 *     "success": true,
 *     "message": "...",
 *     "data": { ... } | [ ... ] | null,
 *     "meta": { ... }   // only present for paginated list responses
 *   }
 *
 * Error responses are NOT sent through this helper — they are always
 * produced by the centralized error-handling middleware
 * (server/middleware/errorHandler.js) so there is exactly one place in
 * the codebase that decides the shape of an error response.
 */

/**
 * Sends a successful JSON response using the standard envelope.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {Object} [options]
 * @param {number} [options.statusCode=200] - HTTP status code to send.
 * @param {string} [options.message='Success'] - Human-readable success message.
 * @param {*} [options.data=null] - Response payload (object, array, or null).
 * @param {{page:number,limit:number,totalItems:number,totalPages:number}|null} [options.meta=null]
 *   Pagination metadata; included only when provided (paginated list endpoints).
 * @returns {import('express').Response}
 */
function sendSuccess(res, { statusCode = 200, message = 'Success', data = null, meta = null } = {}) {
  const responseBody = {
    success: true,
    message,
    data,
  };

  if (meta !== null && meta !== undefined) {
    responseBody.meta = meta;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = { sendSuccess };
