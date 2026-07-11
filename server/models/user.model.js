// server/models/user.model.js

const { pool } = require('../config/db');

/**
 * Safe columns only — password_hash is never selected here.
 */
const SAFE_COLUMNS = 'id, name, email, role, account_status, created_at, updated_at';

/**
 * Inserts a new user row. Intended to be called within a transaction
 * (see companyProfile/studentProfile creation in auth.controller.js).
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {{ name: string, email: string, passwordHash: string, role: 'student'|'company'|'admin' }} data
 * @returns {Promise<number>} insertId
 */
async function createUser(connection, { name, email, passwordHash, role }) {
  const [result] = await connection.execute(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, passwordHash, role]
  );
  return result.insertId;
}

/**
 * Finds a user by email, excluding password_hash — used for uniqueness
 * checks during registration.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmail(email) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Finds a user by email INCLUDING password_hash — used only by the login
 * flow, immediately after which the hash is discarded and never returned
 * to the client.
 * @param {string} email
 * @returns {Promise<object|null>}
 */
async function findByEmailWithPassword(email) {
  const [rows] = await pool.execute(
    `SELECT id, name, email, password_hash, role, account_status, created_at, updated_at
     FROM users WHERE email = ? LIMIT 1`,
    [email]
  );
  return rows[0] || null;
}

/**
 * Finds a user by id, excluding password_hash.
 * @param {number} id
 * @returns {Promise<object|null>}
 */
async function findById(id) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS} FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

module.exports = {
  createUser,
  findByEmail,
  findByEmailWithPassword,
  findById,
};