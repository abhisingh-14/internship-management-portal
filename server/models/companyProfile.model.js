// server/models/companyProfile.model.js

const { pool } = require('../config/db');

/**
 * Creates the company_profiles row extending a newly created user.
 * approval_status defaults to 'pending' at the database level, per
 * docs/02_Database_Design.md §4.3.
 * Intended to be called within the same transaction as createUser().
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {number} userId
 * @param {string} companyName
 * @returns {Promise<number>} insertId
 */
async function createCompanyProfile(connection, userId, companyName) {
  const [result] = await connection.execute(
    `INSERT INTO company_profiles (user_id, company_name) VALUES (?, ?)`,
    [userId, companyName]
  );
  return result.insertId;
}

/**
 * Finds a company profile by the owning user's id.
 * @param {number} userId
 * @returns {Promise<object|null>}
 */
async function findByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, company_name, description, website, industry,
            logo_url, approval_status, created_at, updated_at
     FROM company_profiles WHERE user_id = ? LIMIT 1`,
    [userId]
  );
  return rows[0] || null;
}

module.exports = {
  createCompanyProfile,
  findByUserId,
};