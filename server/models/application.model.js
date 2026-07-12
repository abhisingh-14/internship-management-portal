const { pool } = require('../config/db');

const SORTABLE_COLUMNS = {
  appliedAt: 'a.applied_at',
  status: 'a.status',
  updatedAt: 'a.updated_at',
};

/**
 * Checks if a student has already applied to an internship posting.
 * @param {number} internshipId 
 * @param {number} studentId 
 * @returns {Promise<boolean>}
 */
async function checkDuplicate(internshipId, studentId) {
  const [rows] = await pool.query(
    'SELECT id FROM applications WHERE internship_id = ? AND student_id = ? LIMIT 1',
    [internshipId, studentId]
  );
  return rows.length > 0;
}

/**
 * Inserts a new application row.
 * @param {{ internshipId: number, studentId: number, coverLetter: string|null }} params
 * @returns {Promise<number>} the newly created applications.id
 */
async function createApplication({ internshipId, studentId, coverLetter }) {
  const [result] = await pool.query(
    `INSERT INTO applications (internship_id, student_id, cover_letter, status)
     VALUES (?, ?, ?, 'applied')`,
    [internshipId, studentId, coverLetter]
  );
  return result.insertId;
}

/**
 * Retrieves a single application detail by ID, joining related tables.
 * @param {number} applicationId
 * @returns {Promise<object|null>}
 */
async function findById(applicationId) {
  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.internship_id AS internshipId,
      a.student_id AS studentId,
      a.cover_letter AS coverLetter,
      a.status,
      a.applied_at AS appliedAt,
      a.updated_at AS updatedAt,
      i.title AS internshipTitle,
      i.location AS internshipLocation,
      i.duration AS internshipDuration,
      i.stipend AS internshipStipend,
      i.application_deadline AS internshipDeadline,
      c.id AS companyId,
      c.company_name AS companyName,
      c.logo_url AS companyLogoUrl,
      sp.user_id AS studentUserId,
      u.name AS studentName,
      u.email AS studentEmail,
      sp.bio AS studentBio,
      sp.resume_url AS studentResumeUrl
     FROM applications a
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN company_profiles c ON c.id = i.company_id
     INNER JOIN student_profiles sp ON sp.id = a.student_id
     INNER JOIN users u ON u.id = sp.user_id
     WHERE a.id = ?
     LIMIT 1`,
    [applicationId]
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    internshipId: row.internshipId,
    studentId: row.studentId,
    coverLetter: row.coverLetter,
    status: row.status,
    appliedAt: row.appliedAt,
    updatedAt: row.updatedAt,
    internship: {
      id: row.internshipId,
      title: row.internshipTitle,
      location: row.internshipLocation,
      duration: row.internshipDuration,
      stipend: row.internshipStipend,
      applicationDeadline: row.internshipDeadline,
      companyId: row.companyId,
      companyName: row.companyName,
      companyLogoUrl: row.companyLogoUrl,
    },
    student: {
      id: row.studentId,
      userId: row.studentUserId,
      name: row.studentName,
      email: row.studentEmail,
      bio: row.studentBio,
      resumeUrl: row.studentResumeUrl,
    },
  };
}

/**
 * Retrieves a student's applications.
 * @param {number} studentId
 * @param {{ status?: string, limit: number, offset: number, sort?: string }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function findStudentApplications(studentId, { status, limit, offset, sort }) {
  const conditions = ['a.student_id = ?'];
  const params = [studentId];

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderColumn = 'a.applied_at';
  let orderDirection = 'DESC';

  if (sort) {
    const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
    const fieldKey = sort.replace('-', '');
    if (SORTABLE_COLUMNS[fieldKey]) {
      orderColumn = SORTABLE_COLUMNS[fieldKey];
      orderDirection = direction;
    }
  }

  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.internship_id AS internshipId,
      a.student_id AS studentId,
      a.cover_letter AS coverLetter,
      a.status,
      a.applied_at AS appliedAt,
      a.updated_at AS updatedAt,
      i.title AS internshipTitle,
      i.location AS internshipLocation,
      i.duration AS internshipDuration,
      i.stipend AS internshipStipend,
      i.application_deadline AS internshipDeadline,
      c.company_name AS companyName,
      c.logo_url AS companyLogoUrl
     FROM applications a
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN company_profiles c ON c.id = i.company_id
     ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total 
     FROM applications a 
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN company_profiles c ON c.id = i.company_id
     ${whereClause}`,
    params
  );

  const mappedRows = rows.map((row) => ({
    id: row.id,
    internshipId: row.internshipId,
    studentId: row.studentId,
    coverLetter: row.coverLetter,
    status: row.status,
    appliedAt: row.appliedAt,
    updatedAt: row.updatedAt,
    internship: {
      id: row.internshipId,
      title: row.internshipTitle,
      location: row.internshipLocation,
      duration: row.internshipDuration,
      stipend: row.internshipStipend,
      applicationDeadline: row.internshipDeadline,
      companyName: row.companyName,
      companyLogoUrl: row.companyLogoUrl,
    },
  }));

  return { rows: mappedRows, total: countRows[0].total };
}

/**
 * Retrieves applications across all postings of a company.
 * @param {number} companyProfileId
 * @param {{ internshipId?: number, status?: string, limit: number, offset: number, sort?: string }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function findCompanyApplicants(companyProfileId, { internshipId, status, limit, offset, sort }) {
  const conditions = ['i.company_id = ?'];
  const params = [companyProfileId];

  if (internshipId) {
    conditions.push('a.internship_id = ?');
    params.push(internshipId);
  }

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderColumn = 'a.applied_at';
  let orderDirection = 'DESC';

  if (sort) {
    const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
    const fieldKey = sort.replace('-', '');
    if (SORTABLE_COLUMNS[fieldKey]) {
      orderColumn = SORTABLE_COLUMNS[fieldKey];
      orderDirection = direction;
    }
  }

  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.internship_id AS internshipId,
      a.student_id AS studentId,
      a.cover_letter AS coverLetter,
      a.status,
      a.applied_at AS appliedAt,
      a.updated_at AS updatedAt,
      i.title AS internshipTitle,
      sp.user_id AS studentUserId,
      u.name AS studentName,
      u.email AS studentEmail,
      sp.bio AS studentBio,
      sp.resume_url AS studentResumeUrl
     FROM applications a
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN student_profiles sp ON sp.id = a.student_id
     INNER JOIN users u ON u.id = sp.user_id
     ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total 
     FROM applications a 
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN student_profiles sp ON sp.id = a.student_id
     INNER JOIN users u ON u.id = sp.user_id
     ${whereClause}`,
    params
  );

  const mappedRows = rows.map((row) => ({
    id: row.id,
    internshipId: row.internshipId,
    studentId: row.studentId,
    coverLetter: row.coverLetter,
    status: row.status,
    appliedAt: row.appliedAt,
    updatedAt: row.updatedAt,
    internship: {
      id: row.internshipId,
      title: row.internshipTitle,
    },
    student: {
      id: row.studentId,
      userId: row.studentUserId,
      name: row.studentName,
      email: row.studentEmail,
      bio: row.studentBio,
      resumeUrl: row.studentResumeUrl,
    },
  }));

  return { rows: mappedRows, total: countRows[0].total };
}

/**
 * Retrieves applications for a specific internship posting.
 * @param {number} internshipId
 * @param {{ status?: string, limit: number, offset: number, sort?: string }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function findInternshipApplications(internshipId, { status, limit, offset, sort }) {
  const conditions = ['a.internship_id = ?'];
  const params = [internshipId];

  if (status) {
    conditions.push('a.status = ?');
    params.push(status);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderColumn = 'a.applied_at';
  let orderDirection = 'DESC';

  if (sort) {
    const direction = sort.startsWith('-') ? 'DESC' : 'ASC';
    const fieldKey = sort.replace('-', '');
    if (SORTABLE_COLUMNS[fieldKey]) {
      orderColumn = SORTABLE_COLUMNS[fieldKey];
      orderDirection = direction;
    }
  }

  const [rows] = await pool.query(
    `SELECT 
      a.id,
      a.internship_id AS internshipId,
      a.student_id AS studentId,
      a.cover_letter AS coverLetter,
      a.status,
      a.applied_at AS appliedAt,
      a.updated_at AS updatedAt,
      i.title AS internshipTitle,
      sp.user_id AS studentUserId,
      u.name AS studentName,
      u.email AS studentEmail,
      sp.bio AS studentBio,
      sp.resume_url AS studentResumeUrl
     FROM applications a
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN student_profiles sp ON sp.id = a.student_id
     INNER JOIN users u ON u.id = sp.user_id
     ${whereClause}
     ORDER BY ${orderColumn} ${orderDirection}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total 
     FROM applications a 
     INNER JOIN internships i ON i.id = a.internship_id
     INNER JOIN student_profiles sp ON sp.id = a.student_id
     INNER JOIN users u ON u.id = sp.user_id
     ${whereClause}`,
    params
  );

  const mappedRows = rows.map((row) => ({
    id: row.id,
    internshipId: row.internshipId,
    studentId: row.studentId,
    coverLetter: row.coverLetter,
    status: row.status,
    appliedAt: row.appliedAt,
    updatedAt: row.updatedAt,
    internship: {
      id: row.internshipId,
      title: row.internshipTitle,
    },
    student: {
      id: row.studentId,
      userId: row.studentUserId,
      name: row.studentName,
      email: row.studentEmail,
      bio: row.studentBio,
      resumeUrl: row.studentResumeUrl,
    },
  }));

  return { rows: mappedRows, total: countRows[0].total };
}

/**
 * Updates application status.
 * @param {number} applicationId
 * @param {string} status
 * @returns {Promise<boolean>}
 */
async function updateStatus(applicationId, status) {
  const [result] = await pool.query(
    'UPDATE applications SET status = ? WHERE id = ?',
    [status, applicationId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  checkDuplicate,
  createApplication,
  findById,
  findStudentApplications,
  findCompanyApplicants,
  findInternshipApplications,
  updateStatus,
};
