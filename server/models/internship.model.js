const { pool } = require('../config/db');

const INTERNSHIP_STATUSES = ['draft', 'published', 'closed', 'flagged', 'removed'];

/**
 * Returns posting counts grouped by status for a given company, e.g.
 * { total: 5, draft: 1, published: 2, closed: 2, flagged: 0, removed: 0 }.
 *
 * This is intentionally the only function in this model for now — full
 * internship CRUD (create/edit/publish/close/delete) is out of scope for
 * the Company Module component and belongs to a dedicated Internship
 * Management component, which should extend this file rather than
 * duplicate the connection/query pattern established here.
 */
async function getInternshipStatsByCompanyId(companyId) {
  const [rows] = await pool.query(
    `SELECT status, COUNT(*) AS count
     FROM internships
     WHERE company_id = ?
     GROUP BY status`,
    [companyId]
  );

  const stats = INTERNSHIP_STATUSES.reduce((accumulator, status) => {
    accumulator[status] = 0;
    return accumulator;
  }, {});

  let total = 0;
  rows.forEach((row) => {
    stats[row.status] = Number(row.count);
    total += Number(row.count);
  });

  return { total, ...stats };
}

module.exports = {
  getInternshipStatsByCompanyId,
};
