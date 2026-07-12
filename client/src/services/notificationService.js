import api from './api';

const BASE_PATH = '/notifications';

/**
 * Retrieves the paginated list of notifications for the authenticated user.
 * @param {object} [filters] - query parameters: page, limit, unreadOnly.
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function getNotifications(filters = {}) {
  const response = await api.get(BASE_PATH, { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

/**
 * Retrieves the total unread count.
 * @returns {Promise<number>}
 */
export async function getUnreadCount() {
  const response = await api.get(`${BASE_PATH}/unread-count`);
  return response.data.data.count;
}

/**
 * Marks a single notification as read.
 * @param {number|string} notificationId
 * @returns {Promise<object>}
 */
export async function markNotificationAsRead(notificationId) {
  const response = await api.patch(`${BASE_PATH}/${notificationId}/read`);
  return response.data.data;
}

/**
 * Marks all of the authenticated user's notifications as read.
 * @returns {Promise<number>} count of updated notifications
 */
export async function markAllNotificationsAsRead() {
  const response = await api.patch(`${BASE_PATH}/read-all`);
  return response.data.data.updatedCount;
}

/**
 * Deletes a single notification.
 * @param {number|string} notificationId
 * @returns {Promise<object>}
 */
export async function deleteNotification(notificationId) {
  const response = await api.delete(`${BASE_PATH}/${notificationId}`);
  return response.data;
}

export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
