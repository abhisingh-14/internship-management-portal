const { pool } = require('../config/db');
const { NotFoundError, BadRequestError, ForbiddenError } = require('../utils/apiError');
const { sendSuccess } = require('../utils/apiResponse');
const asyncHandler = require('../utils/asyncHandler');
const notificationModel = require('../models/notification.model');
const companyProfileModel = require('../models/companyProfile.model');

/**
 * Helper to record admin audit logs.
 */
async function recordAuditLog(actorId, action, targetId, details) {
  await pool.execute(
    `INSERT INTO admin_audit_logs (actor_id, action, target_id, details)
     VALUES (?, ?, ?, ?)`,
    [actorId, action, String(targetId), details || null]
  );
}

/**
 * GET /admin/users
 * Retrieves all registered users with filters (role, status, search) and pagination.
 */
const getUsers = asyncHandler(async (req, res) => {
  const { role, status, search, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = ['u.role != "admin"']; // Don't expose admins in the management lists
  const params = [];

  if (role) {
    conditions.push('u.role = ?');
    params.push(role);
  }

  if (status) {
    conditions.push('u.account_status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ? OR cp.company_name LIKE ?)');
    const searchWildcard = `%${search}%`;
    params.push(searchWildcard, searchWildcard, searchWildcard);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const querySql = `
    SELECT u.id, u.name, u.email, u.role, u.account_status AS accountStatus, u.created_at AS createdAt, u.updated_at AS updatedAt,
           sp.id AS studentId, sp.resume_url AS studentResumeUrl,
           cp.id AS companyId, cp.company_name AS companyName, cp.industry AS companyIndustry, cp.logo_url AS companyLogoUrl, cp.approval_status AS companyApprovalStatus
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    LEFT JOIN company_profiles cp ON u.id = cp.user_id
    ${whereClause}
    ORDER BY u.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM users u
    LEFT JOIN company_profiles cp ON u.id = cp.user_id
    ${whereClause}
  `;

  const [rows] = await pool.query(querySql, [...params, limit, offset]);
  const [countRows] = await pool.query(countSql, params);
  const totalItems = countRows[0].total;

  const users = rows.map(row => {
    const user = {
      id: row.id,
      name: row.name,
      email: row.email,
      role: row.role,
      accountStatus: row.accountStatus,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      studentProfile: null,
      companyProfile: null,
    };

    if (row.role === 'student') {
      user.studentProfile = {
        id: row.studentId,
        resumeUrl: row.studentResumeUrl,
      };
    } else if (row.role === 'company') {
      user.companyProfile = {
        id: row.companyId,
        companyName: row.companyName,
        industry: row.companyIndustry,
        logoUrl: row.companyLogoUrl,
        approvalStatus: row.companyApprovalStatus,
      };
    }
    return user;
  });

  sendSuccess(res, {
    message: 'Users list retrieved successfully',
    data: users,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

/**
 * PATCH /admin/users/:userId/status
 * Activates or deactivates a user account.
 */
const updateUserStatus = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (Number(userId) === req.user.id) {
    throw new BadRequestError('You cannot change your own account status');
  }

  const [users] = await pool.execute(
    'SELECT id, name, role, account_status FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (users.length === 0) {
    throw new NotFoundError('User not found');
  }

  const targetUser = users[0];

  await pool.execute(
    'UPDATE users SET account_status = ? WHERE id = ?',
    [status, userId]
  );

  const updatedUser = {
    id: targetUser.id,
    name: targetUser.name,
    role: targetUser.role,
    accountStatus: status,
  };

  // Record audit log
  await recordAuditLog(
    req.user.id,
    'user_status_change',
    userId,
    `Changed status of ${targetUser.name} (${targetUser.role}) to ${status}`
  );

  // Send notification to the user
  await notificationModel.createNotification({
    userId,
    type: 'system',
    title: 'Account Status Updated',
    message: `Your account has been ${status === 'active' ? 'activated' : 'deactivated'} by the administrator.`,
  });

  sendSuccess(res, {
    message: `User account has been successfully ${status === 'active' ? 'activated' : 'deactivated'}`,
    data: updatedUser,
  });
});

/**
 * DELETE /admin/users/:userId
 * Permanently deletes a user account (with cascade safety).
 */
const deleteUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  if (Number(userId) === req.user.id) {
    throw new BadRequestError('You cannot delete your own account');
  }

  const [users] = await pool.execute(
    'SELECT id, name, role FROM users WHERE id = ? LIMIT 1',
    [userId]
  );

  if (users.length === 0) {
    throw new NotFoundError('User not found');
  }

  const targetUser = users[0];

  // Hard delete the user
  await pool.execute('DELETE FROM users WHERE id = ?', [userId]);

  // Record audit log
  await recordAuditLog(
    req.user.id,
    'user_delete',
    userId,
    `Permanently deleted user: ${targetUser.name} (${targetUser.role})`
  );

  sendSuccess(res, {
    message: 'User account and all related data have been permanently deleted',
    data: { id: userId },
  });
});

/**
 * GET /admin/companies/pending
 * Retrieves pending company registrations awaiting verification.
 */
const getPendingCompanies = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  // Querying using the database view view_pending_company_approvals
  const querySql = `
    SELECT company_id AS companyId, company_name AS companyName, description, website, industry, logo_url AS logoUrl,
           approval_status AS approvalStatus, registered_at AS registeredAt, user_id AS userId,
           contact_name AS contactName, contact_email AS contactEmail, account_status AS accountStatus
    FROM view_pending_company_approvals
    ORDER BY registered_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM view_pending_company_approvals
  `;

  const [rows] = await pool.query(querySql, [limit, offset]);
  const [countRows] = await pool.query(countSql);
  const totalItems = countRows[0].total;

  sendSuccess(res, {
    message: 'Pending company registrations retrieved successfully',
    data: rows,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

/**
 * PATCH /admin/companies/:companyId/approval
 * Approves or rejects a company registration.
 */
const approveCompany = asyncHandler(async (req, res) => {
  const { companyId } = req.params;
  const { decision, reason } = req.body;

  const company = await companyProfileModel.findById(companyId);
  if (!company) {
    throw new NotFoundError('Company profile not found');
  }

  if (company.approvalStatus !== 'pending') {
    throw new BadRequestError(`Company registration is already ${company.approvalStatus}`);
  }

  // Update status
  const updatedCompany = await companyProfileModel.updateApprovalStatus(companyId, decision);

  // Record audit log
  await recordAuditLog(
    req.user.id,
    'company_approval',
    companyId,
    `Decision: ${decision}.${decision === 'rejected' ? ` Reason: ${reason}` : ''}`
  );

  // Send notification to company owner
  await notificationModel.createNotification({
    userId: company.userId,
    type: 'system',
    title: decision === 'approved' ? 'Company Profile Approved' : 'Company Profile Rejected',
    message: decision === 'approved'
      ? `Congratulations! Your company profile for ${company.companyName} has been approved. You can now post internships.`
      : `Your company profile for ${company.companyName} was rejected. Reason: ${reason}`,
  });

  sendSuccess(res, {
    message: `Company registration has been successfully ${decision}`,
    data: updatedCompany,
  });
});

/**
 * GET /admin/internships
 * Retrieves all internship postings platform-wide.
 */
const getInternships = asyncHandler(async (req, res) => {
  const { status, companyId, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('i.status = ?');
    params.push(status);
  }

  if (companyId) {
    conditions.push('i.company_id = ?');
    params.push(companyId);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const querySql = `
    SELECT i.id, i.company_id AS companyId, i.title, i.description, i.required_skills AS requiredSkills,
           i.location, i.duration, i.stipend, i.application_deadline AS applicationDeadline,
           i.status, i.created_at AS createdAt, i.updated_at AS updatedAt,
           cp.company_name AS companyName, cp.logo_url AS companyLogoUrl
    FROM internships i
    INNER JOIN company_profiles cp ON i.company_id = cp.id
    ${whereClause}
    ORDER BY i.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM internships i
    ${whereClause}
  `;

  const [rows] = await pool.query(querySql, [...params, limit, offset]);
  const [countRows] = await pool.query(countSql, params);
  const totalItems = countRows[0].total;

  const formattedRows = rows.map(row => ({
    ...row,
    requiredSkills: typeof row.requiredSkills === 'string' ? JSON.parse(row.requiredSkills) : row.requiredSkills,
  }));

  sendSuccess(res, {
    message: 'Internships list retrieved successfully',
    data: formattedRows,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

/**
 * PATCH /admin/internships/:internshipId/moderate
 * Flags, removes, or restores an internship posting.
 */
const moderateInternship = asyncHandler(async (req, res) => {
  const { internshipId } = req.params;
  const { action, reason } = req.body;

  const [rows] = await pool.execute(
    `SELECT i.id, i.company_id, i.title, i.status, cp.user_id AS company_user_id, cp.company_name
     FROM internships i
     INNER JOIN company_profiles cp ON i.company_id = cp.id
     WHERE i.id = ? LIMIT 1`,
    [internshipId]
  );

  if (rows.length === 0) {
    throw new NotFoundError('Internship posting not found');
  }

  const internship = rows[0];

  // Map moderation action to DB status
  let newStatus;
  if (action === 'flagged') {
    newStatus = 'flagged';
  } else if (action === 'removed') {
    newStatus = 'removed';
  } else if (action === 'restored') {
    newStatus = 'published';
  }

  await pool.execute(
    'UPDATE internships SET status = ? WHERE id = ?',
    [newStatus, internshipId]
  );

  // Record audit log
  await recordAuditLog(
    req.user.id,
    'internship_moderation',
    internshipId,
    `Action: ${action}.${reason ? ` Reason: ${reason}` : ''}`
  );

  // Send notification to company owner
  await notificationModel.createNotification({
    userId: internship.company_user_id,
    type: 'system',
    title: `Internship Posting ${action.charAt(0).toUpperCase() + action.slice(1)}`,
    message: `Your internship posting "${internship.title}" has been ${action} by the administrator.${reason ? ` Reason: ${reason}` : ''}`,
  });

  sendSuccess(res, {
    message: `Internship posting has been successfully ${action}`,
    data: {
      id: internshipId,
      title: internship.title,
      status: newStatus,
    },
  });
});

/**
 * GET /admin/applications
 * Retrieves all internship applications platform-wide for admin oversight.
 */
const getApplications = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const querySql = `
    SELECT a.id, a.status, a.cover_letter AS coverLetter,
           a.applied_at AS appliedAt,
           u.name AS studentName, u.email AS studentEmail,
           sp.resume_url AS resumeUrl,
           i.title AS internshipTitle,
           cp.company_name AS companyName
    FROM applications a
    INNER JOIN student_profiles sp ON a.student_id = sp.id
    INNER JOIN users u ON sp.user_id = u.id
    INNER JOIN internships i ON a.internship_id = i.id
    INNER JOIN company_profiles cp ON i.company_id = cp.id
    ${whereClause}
    ORDER BY a.applied_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM applications a
    ${whereClause}
  `;

  const [rows] = await pool.query(querySql, [...params, limit, offset]);
  const [countRows] = await pool.query(countSql, params);
  const totalItems = countRows[0].total;

  sendSuccess(res, {
    message: 'Applications list retrieved successfully',
    data: rows,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

/**
 * GET /admin/audit-logs
 * Retrieves a log of administrative actions for accountability.
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { actorId, action, startDate, endDate, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const conditions = [];
  const params = [];

  if (actorId) {
    conditions.push('aal.actor_id = ?');
    params.push(actorId);
  }

  if (action) {
    conditions.push('aal.action = ?');
    params.push(action);
  }

  if (startDate) {
    conditions.push('aal.created_at >= ?');
    params.push(startDate);
  }

  if (endDate) {
    conditions.push('aal.created_at <= ?');
    params.push(endDate);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const querySql = `
    SELECT aal.id, aal.actor_id AS actorId, aal.action, aal.target_id AS targetId,
           aal.details, aal.created_at AS createdAt,
           u.name AS actorName, u.email AS actorEmail
    FROM admin_audit_logs aal
    INNER JOIN users u ON aal.actor_id = u.id
    ${whereClause}
    ORDER BY aal.created_at DESC
    LIMIT ? OFFSET ?
  `;

  const countSql = `
    SELECT COUNT(*) AS total
    FROM admin_audit_logs aal
    ${whereClause}
  `;

  const [rows] = await pool.query(querySql, [...params, limit, offset]);
  const [countRows] = await pool.query(countSql, params);
  const totalItems = countRows[0].total;

  const logs = rows.map(row => ({
    id: row.id,
    action: row.action,
    targetId: row.targetId,
    details: row.details,
    createdAt: row.createdAt,
    actor: {
      id: row.actorId,
      name: row.actorName,
      email: row.actorEmail,
    },
  }));

  sendSuccess(res, {
    message: 'Audit logs retrieved successfully',
    data: logs,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  });
});

module.exports = {
  getUsers,
  updateUserStatus,
  deleteUser,
  getPendingCompanies,
  approveCompany,
  getInternships,
  moderateInternship,
  getApplications,
  getAuditLogs,
};
