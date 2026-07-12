const { pool } = require('../config/db');

/**
 * Inserts a new company_profiles row linked to a user, defaulting to
 * 'pending' approval status, per FR-COM-01 / FR-COM-02.
 * Accepts an optional transaction connection so the Authentication
 * component can create the user + profile atomically.
 */
async function insertCompanyProfile(connection, userId, companyName) {
  const executor = connection || pool;
  const [result] = await executor.query(
    `INSERT INTO company_profiles (user_id, company_name, approval_status)
     VALUES (?, ?, 'pending')`,
    [userId, companyName]
  );
  return result.insertId;
}

/**
 * Finds a company profile by the owning user's id.
 * Never selects password_hash (that lives on the users table anyway).
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, company_name, description, website, industry, logo_url,
            approval_status, created_at, updated_at
     FROM company_profiles
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

/**
 * Finds a company profile by its own primary key.
 */
async function findById(companyProfileId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, company_name, description, website, industry, logo_url,
            approval_status, created_at, updated_at
     FROM company_profiles
     WHERE id = ?`,
    [companyProfileId]
  );
  return rows[0] || null;
}

/**
 * Updates the editable profile fields for a company (companyName,
 * description, website, industry). logoUrl is intentionally excluded —
 * it is managed exclusively by the File Upload component (Component 08).
 * approvalStatus is intentionally excluded — only Admins may change it.
 */
async function updateProfile(userId, { companyName, description, website, industry }) {
  await pool.query(
    `UPDATE company_profiles
     SET company_name = ?, description = ?, website = ?, industry = ?
     WHERE user_id = ?`,
    [companyName, description, website, industry, userId]
  );
  return findByUserId(userId);
}

module.exports = {
  insertCompanyProfile,
  findByUserId,
  findById,
  updateProfile,
};
