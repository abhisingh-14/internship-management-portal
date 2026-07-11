/**
 * Wraps an async Express route/controller handler so that any rejected
 * promise or thrown error is automatically forwarded to next(error),
 * per docs/05_Coding_Standards.md §9. Controllers must not use ad hoc
 * try/catch blocks that swallow errors.
 *
 * Usage:
 *   router.get('/internships', asyncHandler(internshipController.getInternships));
 */

function asyncHandler(fn) {
  return function wrappedHandler(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;