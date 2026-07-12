const pool = require('../config/db');

/**
 * All parameterized SQL access for the `student_profiles` table.
 *
 * NOTE: As of the 06_Student_Module migration
 * (20260712_001_add_student_education_and_skills.sql), the `education`
 * and `skills` columns no longer exist on this table — that data now
 * lives in `student_education` and `student_skills` respectively (see
 * studentEducation.model.js and studentSkill.model.js). This model only
 * ever selects explicit, safe columns; it never selects `password_hash`
 * because that column does not exist on this table at all (it lives on
 * `users`).
 */

/**
 * Inserts a new student profile row linked to a user. Intended to be
 * called inside the same transaction as the corresponding `users` insert
 * during registration (see auth.controller.js).
 *
 * @param {import('mysql2/promise').PoolConnection} connection - an active
 *   transactional connection (NOT the pool) so this insert participates in
 *   the caller's transaction.
 * @param {number} userId
 * @returns {Promise<number>} the newly created student_profiles.id
 */
async function createStudentProfile(connection, userId) {
  const [result] = await connection.execute(
    `INSERT INTO student_profiles (user_id, bio, resume_url)
     VALUES (?, NULL, NULL)`,
    [userId]
  );
  return result.insertId;
}

/**
 * Finds a student's full profile (joined with their name/email from
 * `users`) by their `users.id`.
 *
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
        sp.id,
        sp.user_id,
        u.name,
        u.email,
        sp.bio,
        sp.resume_url,
        sp.created_at,
        sp.updated_at
     FROM student_profiles sp
     INNER JOIN users u ON u.id = sp.user_id
     WHERE sp.user_id = ?
     LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Resolves the `student_profiles.id` (the surrogate PK used as the FK
 * target on `student_education` / `student_skills` / `applications` /
 * `saved_internships`) for a given `users.id`. Used by every controller
 * that needs to scope a child-table query to "the current student."
 *
 * @param {number} userId
 * @returns {Promise<number|null>}
 */
async function findIdByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id FROM student_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] ? rows[0].id : null;
}

/**
 * Updates the free-text bio field on a student's profile.
 *
 * @param {number} userId
 * @param {string|null} bio
 * @returns {Promise<boolean>} true if a row was updated
 */
async function updateBio(userId, bio) {
  const [result] = await pool.execute(
    `UPDATE student_profiles SET bio = ? WHERE user_id = ?`,
    [bio, userId]
  );
  return result.affectedRows > 0;
}

/**
 * Updates the resume URL on a student's profile. Reserved for use by the
 * future File Upload component; included here only because it is a
 * single-column update on this same table and keeping all
 * `student_profiles` writes in this model avoids splitting simple column
 * updates across files.
 *
 * @param {number} userId
 * @param {string|null} resumeUrl
 * @returns {Promise<boolean>}
 */
async function updateResumeUrl(userId, resumeUrl) {
  const [result] = await pool.execute(
    `UPDATE student_profiles SET resume_url = ? WHERE user_id = ?`,
    [resumeUrl, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createStudentProfile,
  findByUserId,
  findIdByUserId,
  updateBio,
  updateResumeUrl,
};
