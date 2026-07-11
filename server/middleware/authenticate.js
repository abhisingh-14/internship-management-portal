// server/middleware/authenticate.js

const { verifyAccessToken } = require('../utils/generateToken');
const { UnauthorizedError } = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const userModel = require('../models/user.model');

/**
 * Verifies the Bearer access token on the Authorization header, confirms
 * the user still exists and is active, and attaches the decoded payload
 * to req.user for downstream authorize()/ownership checks and controllers.
 * Per FR-AUTH-04 and FR-AUTH-06.
 */
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Authentication token is missing');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new UnauthorizedError('Token has expired');
    }
    throw new UnauthorizedError('Invalid authentication token');
  }

  const user = await userModel.findById(decoded.userId);

  if (!user) {
    throw new UnauthorizedError('Account associated with this token no longer exists');
  }

  if (user.account_status === 'deactivated') {
    throw new UnauthorizedError('This account has been deactivated');
  }

  req.user = {
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  };

  next();
});

module.exports = authenticate;