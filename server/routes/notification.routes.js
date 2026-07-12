const express = require('express');
const authenticate = require('../middleware/authenticate');
const validateRequest = require('../utils/validateRequest');
const { notificationIdParamValidator, queryValidator } = require('../validators/notification.validator');
const notificationController = require('../controllers/notification.controller');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// GET /notifications
router.get(
  '/',
  queryValidator,
  validateRequest,
  notificationController.getNotifications
);

// GET /notifications/unread-count
router.get(
  '/unread-count',
  notificationController.getUnreadCount
);

// PATCH /notifications/read-all
router.patch(
  '/read-all',
  notificationController.markAllRead
);

// PATCH /notifications/:notificationId/read
router.patch(
  '/:notificationId/read',
  notificationIdParamValidator,
  validateRequest,
  notificationController.markRead
);

// DELETE /notifications/:notificationId
router.delete(
  '/:notificationId',
  notificationIdParamValidator,
  validateRequest,
  notificationController.deleteNotification
);

module.exports = router;
