const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/apiResponse');
const { parsePaginationParams, buildPaginationMeta } = require('../utils/pagination');
const { NotFoundError, ForbiddenError } = require('../utils/apiError');
const notificationModel = require('../models/notification.model');

/**
 * GET /notifications
 * Retrieves a paginated list of notifications for the authenticated user.
 */
const getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { unreadOnly } = req.query;
  const { page, limit, offset } = parsePaginationParams(req.query);

  const { rows, total } = await notificationModel.findUserNotifications(userId, {
    unreadOnly,
    limit,
    offset,
  });

  sendSuccess(res, {
    message: 'Notifications retrieved successfully',
    data: rows,
    meta: buildPaginationMeta(page, limit, total),
  });
});

/**
 * GET /notifications/unread-count
 * Retrieves the count of unread notifications for the user.
 */
const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = await notificationModel.getUnreadCount(userId);

  sendSuccess(res, {
    message: 'Unread notification count retrieved successfully',
    data: { count },
  });
});

/**
 * PATCH /notifications/:notificationId/read
 * Marks a single notification as read.
 */
const markRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await notificationModel.findById(notificationId);
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Ownership verification
  if (notification.userId !== userId) {
    throw new ForbiddenError('You do not have permission to modify this notification');
  }

  await notificationModel.markAsRead(notificationId, userId);
  const updated = await notificationModel.findById(notificationId);

  sendSuccess(res, {
    message: 'Notification marked as read successfully',
    data: updated,
  });
});

/**
 * PATCH /notifications/read-all
 * Marks all of the authenticated user's notifications as read.
 */
const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const updatedCount = await notificationModel.markAllAsRead(userId);

  sendSuccess(res, {
    message: 'All notifications marked as read',
    data: { updatedCount },
  });
});

/**
 * DELETE /notifications/:notificationId
 * Deletes a single notification.
 */
const deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user.id;

  const notification = await notificationModel.findById(notificationId);
  if (!notification) {
    throw new NotFoundError('Notification not found');
  }

  // Ownership verification
  if (notification.userId !== userId) {
    throw new ForbiddenError('You do not have permission to delete this notification');
  }

  await notificationModel.deleteNotification(notificationId, userId);

  res.status(204).send();
});

module.exports = {
  getNotifications,
  getUnreadCount,
  markRead,
  markAllRead,
  deleteNotification,
};
