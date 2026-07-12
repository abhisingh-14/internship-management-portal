const { pool } = require('../config/db');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const { NotFoundError } = require('../utils/apiError');

/**
 * GET /analytics/platform
 * Retrieves platform-wide summary statistics (Admin only).
 */
const getPlatformAnalytics = asyncHandler(async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM view_platform_analytics LIMIT 1');
  const row = rows[0];

  if (!row) {
    return sendSuccess(res, {
      message: 'Platform analytics retrieved',
      data: {
        totalStudents: 0,
        totalCompanies: 0,
        pendingCompanyApprovals: 0,
        totalInternships: 0,
        activeInternships: 0,
        totalApplications: 0,
      },
    });
  }

  sendSuccess(res, {
    message: 'Platform analytics retrieved',
    data: {
      totalStudents: Number(row.total_students),
      totalCompanies: Number(row.total_companies),
      pendingCompanyApprovals: Number(row.pending_company_approvals),
      totalInternships: Number(row.total_internships),
      activeInternships: Number(row.active_internships),
      totalApplications: Number(row.total_applications),
    },
  });
});

/**
 * GET /analytics/companies/postings
 * Retrieves per-posting applicant metrics for the authenticated company.
 */
const getCompanyPostingsAnalytics = asyncHandler(async (req, res) => {
  const [companyRows] = await pool.query(
    'SELECT id FROM company_profiles WHERE user_id = ? LIMIT 1',
    [req.user.id]
  );

  if (companyRows.length === 0) {
    throw new NotFoundError('Company profile not found');
  }

  const companyId = companyRows[0].id;

  const querySql = `
    SELECT i.id AS internshipId, i.title, 0 AS views,
           COUNT(a.id) AS applicantCount,
           SUM(CASE WHEN a.status = 'shortlisted' THEN 1 ELSE 0 END) AS shortlistedCount
    FROM internships i
    LEFT JOIN applications a ON i.id = a.internship_id
    WHERE i.company_id = ?
    GROUP BY i.id, i.title
    ORDER BY i.created_at DESC
  `;

  const [rows] = await pool.query(querySql, [companyId]);

  const data = rows.map(row => ({
    internshipId: row.internshipId,
    title: row.title,
    views: Number(row.views),
    applicantCount: Number(row.applicantCount),
    shortlistedCount: Number(row.shortlistedCount),
  }));

  sendSuccess(res, {
    message: 'Posting analytics retrieved',
    data,
  });
});

/**
 * GET /analytics/students/activity
 * Retrieves activity summary (applications, bookmarks) for the authenticated student.
 */
const getStudentActivityAnalytics = asyncHandler(async (req, res) => {
  const querySql = `
    SELECT
      (SELECT COUNT(*) FROM applications a INNER JOIN student_profiles sp ON a.student_id = sp.id WHERE sp.user_id = ?) AS applicationsSubmitted,
      (SELECT COUNT(*) FROM applications a INNER JOIN student_profiles sp ON a.student_id = sp.id WHERE sp.user_id = ? AND a.status = 'shortlisted') AS shortlisted,
      (SELECT COUNT(*) FROM applications a INNER JOIN student_profiles sp ON a.student_id = sp.id WHERE sp.user_id = ? AND a.status = 'accepted') AS accepted,
      (SELECT COUNT(*) FROM saved_internships si INNER JOIN student_profiles sp ON si.student_id = sp.id WHERE sp.user_id = ?) AS bookmarksCount
  `;

  const [rows] = await pool.query(querySql, [req.user.id, req.user.id, req.user.id, req.user.id]);
  const row = rows[0] || {};

  sendSuccess(res, {
    message: 'Activity summary retrieved',
    data: {
      applicationsSubmitted: Number(row.applicationsSubmitted || 0),
      shortlisted: Number(row.shortlisted || 0),
      accepted: Number(row.accepted || 0),
      bookmarksCount: Number(row.bookmarksCount || 0),
    },
  });
});

module.exports = {
  getPlatformAnalytics,
  getCompanyPostingsAnalytics,
  getStudentActivityAnalytics,
};
