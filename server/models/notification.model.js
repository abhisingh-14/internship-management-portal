const { pool } = require('../config/db');

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

module.exports = {
  createNotification,
};
