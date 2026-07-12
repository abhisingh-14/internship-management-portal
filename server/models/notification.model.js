const { pool } = require('../config/db');

function mapNotificationRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    message: row.message,
    isRead: Boolean(row.is_read),
    createdAt: row.created_at,
  };
}

/**
 * Creates a notification record for a specific user.
 * 
 * @param {{ userId: number, type: string, title: string, message: string }} params
 * @returns {Promise<number>} the newly inserted notification ID
 */
async function createNotification({ userId, type, title, message }) {
  const [result] = await pool.execute(
    `INSERT INTO notifications (user_id, type, title, message, is_read)
     VALUES (?, ?, ?, ?, FALSE)`,
    [userId, type, title, message]
  );
  return result.insertId;
}

/**
 * Finds a notification by its ID.
 * @param {number} notificationId
 * @returns {Promise<object|null>}
 */
async function findById(notificationId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, type, title, message, is_read, created_at
     FROM notifications
     WHERE id = ?
     LIMIT 1`,
    [notificationId]
  );
  return mapNotificationRow(rows[0]);
}

/**
 * Retrieves a user's notifications, paginated.
 * @param {number} userId
 * @param {{ unreadOnly?: boolean, limit: number, offset: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function findUserNotifications(userId, { unreadOnly, limit, offset }) {
  const conditions = ['user_id = ?'];
  const params = [userId];

  if (unreadOnly) {
    conditions.push('is_read = FALSE');
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  const [rows] = await pool.query(
    `SELECT id, user_id, type, title, message, is_read, created_at
     FROM notifications
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM notifications
     ${whereClause}`,
    params
  );

  return {
    rows: rows.map(mapNotificationRow),
    total: countRows[0].total,
  };
}

/**
 * Marks a specific notification as read.
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<boolean>} true if updated
 */
async function markAsRead(notificationId, userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Marks all notifications for a user as read.
 * @param {number} userId
 * @returns {Promise<number>} the count of updated notifications
 */
async function markAllAsRead(userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = TRUE
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  return result.affectedRows;
}

/**
 * Gets the total unread notifications count for a user.
 * @param {number} userId
 * @returns {Promise<number>}
 */
async function getUnreadCount(userId) {
  const [rows] = await pool.execute(
    `SELECT COUNT(*) AS total
     FROM notifications
     WHERE user_id = ? AND is_read = FALSE`,
    [userId]
  );
  return rows[0].total;
}

/**
 * Deletes a notification by its ID.
 * @param {number} notificationId
 * @param {number} userId
 * @returns {Promise<boolean>} true if deleted
 */
async function deleteNotification(notificationId, userId) {
  const [result] = await pool.execute(
    `DELETE FROM notifications
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createNotification,
  findById,
  findUserNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
};
