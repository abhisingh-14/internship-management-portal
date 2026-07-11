// server/middleware/authorize.js

const { ForbiddenError } = require('../utils/apiError');

/**
 * Restricts a route to the given role(s). Must run after authenticate(),
 * which populates req.user.role.
 * @param  {...('student'|'company'|'admin')} allowedRoles
 * @returns {import('express').RequestHandler}
 */
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    return next();
  };
}

module.exports = authorize;