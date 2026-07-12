const { pool } = require('../config/db');

function mapProfileRow(row) {
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    userId: row.user_id,
    companyName: row.company_name,
    description: row.description,
    website: row.website,
    industry: row.industry,
    logoUrl: row.logo_url,
    approvalStatus: row.approval_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Finds a company's profile by their users.id.
 */
async function findByUserId(userId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, company_name, description, website, industry,
            logo_url, approval_status, created_at, updated_at
     FROM company_profiles
     WHERE user_id = ?
     LIMIT 1`,
    [userId]
  );
  return mapProfileRow(rows[0]);
}

/**
 * Finds a company's public-facing profile by company_profiles.id, for the
 * public GET /companies/:companyId endpoint. Excludes internal-only fields
 * that shouldn't be shown to unauthenticated visitors (approvalStatus is
 * kept since a browsing student may reasonably see whether a company is
 * verified).
 */
async function findPublicProfileById(companyId) {
  const [rows] = await pool.query(
    `SELECT id, company_name, description, website, industry, logo_url,
            approval_status, created_at
     FROM company_profiles
     WHERE id = ?
     LIMIT 1`,
    [companyId]
  );
  const row = rows[0];
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    companyName: row.company_name,
    description: row.description,
    website: row.website,
    industry: row.industry,
    logoUrl: row.logo_url,
    approvalStatus: row.approval_status,
    createdAt: row.created_at,
  };
}

/**
 * Updates a company's editable profile fields (companyName, description,
 * website, industry). Only supplied fields are updated; approvalStatus and
 * logoUrl are intentionally excluded per docs/07_Company_Module.md.
 */
async function updateProfileFields(userId, fields) {
  const columnMap = {
    companyName: 'company_name',
    description: 'description',
    website: 'website',
    industry: 'industry',
  };

  const setClauses = [];
  const values = [];

  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && columnMap[key]) {
      setClauses.push(`${columnMap[key]} = ?`);
      values.push(value);
    }
  });

  if (setClauses.length === 0) {
    return findByUserId(userId);
  }

  values.push(userId);
  await pool.query(
    `UPDATE company_profiles SET ${setClauses.join(', ')} WHERE user_id = ?`,
    values
  );
  return findByUserId(userId);
}

/**
 * Sets logo_url to the given value, replacing whatever was previously
 * stored. The caller is responsible for deleting the old file from disk
 * beforehand via fileStorage.deleteLogoFileIfExists.
 */
async function updateLogoUrl(userId, logoUrl) {
  await pool.query(
    'UPDATE company_profiles SET logo_url = ? WHERE user_id = ?',
    [logoUrl, userId]
  );
  return findByUserId(userId);
}

/**
 * Returns only the current logo_url for a company, or null if none is on
 * file. Used to locate the on-disk file to delete before replacing it.
 */
async function findLogoUrlByUserId(userId) {
  const [rows] = await pool.query(
    'SELECT logo_url FROM company_profiles WHERE user_id = ? LIMIT 1',
    [userId]
  );
  return rows[0] ? rows[0].logo_url : null;
}

/**
 * Returns internship posting counts by status for a company, used by
 * GET /companies/dashboard.
 */
async function countInternshipsByStatus(companyProfileId) {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS count
     FROM internships
     WHERE company_id = ?
     GROUP BY status`,
    [companyProfileId]
  );

  const stats = { total: 0, draft: 0, published: 0, closed: 0, flagged: 0, removed: 0 };
  rows.forEach((row) => {
    stats[row.status] = Number(row.count);
    stats.total += Number(row.count);
  });
  return stats;
}

/**
 * Inserts a new company profile row linked to a user. Intended to be
 * called inside the same transaction as the corresponding `users` insert
 * during registration (see auth.controller.js).
 *
 * @param {import('mysql2/promise').PoolConnection} connection
 * @param {number} userId
 * @param {string} companyName
 */
async function createCompanyProfile(connection, userId, companyName) {
  await connection.execute(
    `INSERT INTO company_profiles (user_id, company_name, approval_status)
     VALUES (?, ?, 'pending')`,
    [userId, companyName]
  );
}

/**
 * Finds a company's profile by their company_profiles.id.
 * @param {number} companyId
 * @returns {Promise<object|null>}
 */
async function findById(companyId) {
  const [rows] = await pool.query(
    `SELECT id, user_id, company_name, description, website, industry,
            logo_url, approval_status, created_at, updated_at
     FROM company_profiles
     WHERE id = ?
     LIMIT 1`,
    [companyId]
  );
  return mapProfileRow(rows[0]);
}

/**
 * Updates the approval status of a company.
 * @param {number} companyId
 * @param {'approved'|'rejected'} approvalStatus
 * @returns {Promise<object|null>}
 */
async function updateApprovalStatus(companyId, approvalStatus) {
  await pool.query(
    'UPDATE company_profiles SET approval_status = ? WHERE id = ?',
    [approvalStatus, companyId]
  );
  return findById(companyId);
}

module.exports = {
  createCompanyProfile,
  findByUserId,
  findPublicProfileById,
  updateProfileFields,
  updateLogoUrl,
  findLogoUrlByUserId,
  countInternshipsByStatus,
  findById,
  updateApprovalStatus,
};
