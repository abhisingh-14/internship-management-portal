// server/controllers/auth.controller.js

const bcrypt = require('bcrypt');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { ConflictError, UnauthorizedError, ForbiddenError, NotFoundError } = require('../utils/apiError');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/generateToken');
const { pool } = require('../config/db');
const env = require('../config/env');

const userModel = require('../models/user.model');
const studentProfileModel = require('../models/studentProfile.model');
const companyProfileModel = require('../models/companyProfile.model');

/**
 * Shapes a safe, camelCase user object for API responses. Never includes
 * password_hash, per docs/02_Database_Design.md §10.
 */
function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}

/**
 * POST /api/v1/auth/register
 * Registers a new Student or Company account. Admin accounts are
 * provisioned separately and never created here, per FR-AUTH-01.
 */
const register = asyncHandler(async (req, res) => {
  const { role, name, email, password, companyName } = req.body;

  const existingUser = await userModel.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('Email is already registered');
  }

  const passwordHash = await bcrypt.hash(password, env.bcrypt.saltRounds);

  const connection = await pool.getConnection();
  let userId;

  try {
    await connection.beginTransaction();

    userId = await userModel.createUser(connection, {
      name,
      email,
      passwordHash,
      role,
    });

    if (role === 'student') {
      await studentProfileModel.createStudentProfile(connection, userId);
    } else if (role === 'company') {
      await companyProfileModel.createCompanyProfile(connection, userId, companyName);
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const tokenPayload = { userId, role };
  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return sendSuccess(res, {
    statusCode: 201,
    message: 'Account created successfully',
    data: {
      user: { id: userId, name, email, role },
      token,
      refreshToken,
    },
  });
});

/**
 * POST /api/v1/auth/login
 * Authenticates a user and issues an access + refresh token pair.
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await userModel.findByEmailWithPassword(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  if (user.account_status === 'deactivated') {
    throw new ForbiddenError('This account has been deactivated');
  }

  if (user.role === 'company') {
    const companyProfile = await companyProfileModel.findByUserId(user.id);

    if (!companyProfile) {
      throw new NotFoundError('Company profile not found');
    }

    if (companyProfile.approvalStatus === 'pending') {
      throw new ForbiddenError('Your company account is pending admin approval');
    }

    if (companyProfile.approvalStatus === 'rejected') {
      throw new ForbiddenError('Your company registration was rejected');
    }
  }

  const passwordMatches = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password');
  }

  const tokenPayload = { userId: user.id, role: user.role };
  const token = generateAccessToken(tokenPayload);
  const refreshToken = generateRefreshToken(tokenPayload);

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Login successful',
    data: {
      user: toPublicUser(user),
      token,
      refreshToken,
    },
  });
});

/**
 * POST /api/v1/auth/refresh-token
 * Issues a new access token from a valid, non-expired refresh token.
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: incomingRefreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(incomingRefreshToken);
  } catch (error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await userModel.findById(decoded.userId);
  if (!user) {
    throw new UnauthorizedError('Account associated with this token no longer exists');
  }

  if (user.accountStatus === 'deactivated') {
    throw new UnauthorizedError('This account has been deactivated');
  }

  const newToken = generateAccessToken({ userId: user.id, role: user.role });

  return sendSuccess(res, {
    statusCode: 200,
    message: 'Token refreshed',
    data: { token: newToken },
  });
});

/**
 * POST /api/v1/auth/logout
 * JWTs are stateless, so logout is primarily a client-side action
 * (discarding the token). This endpoint is reserved for future
 * token-blacklisting, per docs/03_API_Design.md §8.1.
 */
const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, {
    statusCode: 200,
    message: 'Logged out successfully',
    data: null,
  });
});

/**
 * GET /api/v1/auth/me
 * Retrieves the currently authenticated user's basic identity.
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  return sendSuccess(res, {
    statusCode: 200,
    message: 'User retrieved',
    data: toPublicUser(user),
  });
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
};