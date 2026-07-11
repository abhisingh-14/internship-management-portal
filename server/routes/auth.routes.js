// server/routes/auth.routes.js

const express = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../utils/validateRequest');
const {
  registerValidator,
  loginValidator,
  refreshTokenValidator,
} = require('../validators/auth.validator');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);
router.post(
  '/refresh-token',
  refreshTokenValidator,
  validateRequest,
  authController.refreshToken
);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

module.exports = router;