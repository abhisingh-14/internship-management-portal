const { pool } = require('../config/db');

function mapSafeUserRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    accountStatus: row.account_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * All parameterized SQL access for the `users` table. Every query
 * explicitly enumerates safe columns and never selects `password_hash`
 * except `findByEmailWithPassword`, which exists solely for the login
 * flow in auth.controller.js and whose result is discarded immediately
 * after bcrypt comparison.
 */

/**
 * Inserts a new user row. Intended to be called inside the same
 * transaction as the corresponding role-profile insert during
 * registration.
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {{ name: string, email: string, passwordHash: string, role: 'student'|'company'|'admin' }} params
 * @returns {Promise<number>} the newly created users.id
 */
async function createUser(connection, { name, email, passwordHash, role }) {
  const [result] = await connection.execute(
    `INSERT INTO users (name, email, password_hash, role, account_status)
     VALUES (?, ?, ?, ?, 'active')`,
    [name, email, passwordHash, role]
  );
  return result.insertId;
}

/**
 * Finds a user by email, returning only safe columns. Used to check
 * uniqueness during registration and for general lookups.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, account_status, created_at, updated_at
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return mapSafeUserRow(rows[0]);
}

/**
 * Finds a user by email INCLUDING the password hash. Login-only. The
 * caller must never forward `password_hash` beyond the bcrypt.compare()
 * call.
 *
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmailWithPassword(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, account_status
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Finds a user by id, returning only safe columns.
 *
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findById(userId) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, account_status, created_at, updated_at
     FROM users
     WHERE id = ?
     LIMIT 1`,
    [userId]
  );
  return mapSafeUserRow(rows[0]);
}

/**
 * Updates a user's display name.
 *
 * @param {number} userId
 * @param {string} name
 * @returns {Promise<boolean>} true if a row was updated
 */
async function updateName(userId, name) {
  const [result] = await pool.execute(
    `UPDATE users SET name = ? WHERE id = ?`,
    [name, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  createUser,
  findByEmail,
  findByEmailWithPassword,
  findById,
  updateName,
};
