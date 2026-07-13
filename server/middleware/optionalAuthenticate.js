const { verifyAccessToken } = require('../utils/generateToken');
const userModel = require('../models/user.model');

/**
 * Attempts to authenticate the request using a Bearer token, exactly like
 * `authenticate`, but never rejects the request if the token is missing,
 * malformed, expired, or refers to a deactivated/nonexistent user. This
 * allows a single route (e.g. GET /internships/:internshipId) to serve
 * both anonymous public visitors and an authenticated owner/admin with
 * elevated visibility, without duplicating the authentication pipeline.
 */
async function optionalAuthenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const user = await userModel.findById(decoded.userId);

    if (!user || user.accountStatus !== 'active') {
      return next();
    }

    req.user = { userId: user.id, role: user.role };
    return next();
  } catch (error) {
    // Any failure here means "proceed as a guest", never a hard failure.
    return next();
  }
}

module.exports = optionalAuthenticate;
