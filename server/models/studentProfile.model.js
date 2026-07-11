// server/models/studentProfile.model.js

const { pool } = require('../config/db');

/**
 * Creates the student_profiles row extending a newly created user.
 * Intended to be called within the same transaction as createUser().
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {number} userId
 * @returns {Promise<number>} insertId
 */
async function createStudentProfile(connection, userId) {
  const [result] = await connection.execute(
    `INSERT INTO student_profiles (user_id) VALUES (?)`,
    [userId]
  );
  return result.insertId;
}

/**
 * Finds a student profile by the owning user's id.
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, education, skills, bio, resume_url, created_at, updated_at
     FROM student_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  createStudentProfile,
  findByUserId,
};