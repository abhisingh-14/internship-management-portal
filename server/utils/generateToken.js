// server/utils/generateToken.js

const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Signs a short-lived access token containing only the minimal claims
 * required for authorization decisions (userId, role), per FR-AUTH-03.
 * @param {{ userId: number, role: string }} payload
 * @returns {string}
 */
function generateAccessToken(payload) {
  return jwt.sign(
    { userId: payload.userId, role: payload.role },
    env.jwt.accessSecret,
    { expiresIn: env.jwt.accessExpiresIn }
  );
}

/**
 * Signs a longer-lived refresh token, used solely to obtain a new access
 * token via POST /auth/refresh-token.
 * @param {{ userId: number, role: string }} payload
 * @returns {string}
 */
function generateRefreshToken(payload) {
  return jwt.sign(
    { userId: payload.userId, role: payload.role },
    env.jwt.refreshSecret,
    { expiresIn: env.jwt.refreshExpiresIn }
  );
}

/**
 * Verifies an access token's signature and expiration.
 * @param {string} token
 * @returns {{ userId: number, role: string, iat: number, exp: number }}
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

/**
 * Verifies a refresh token's signature and expiration.
 * @param {string} token
 * @returns {{ userId: number, role: string, iat: number, exp: number }}
 * @throws {jwt.JsonWebTokenError | jwt.TokenExpiredError}
 */
function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};