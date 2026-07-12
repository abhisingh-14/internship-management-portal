const { pool } = require('../config/db');

function parseRequiredSkills(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      return JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  return [];
}

/**
 * Checks if a bookmark already exists for the given student and internship.
 * @param {number} studentId
 * @param {number} internshipId
 * @returns {Promise<object|null>}
 */
async function findBookmark(studentId, internshipId) {
  const [rows] = await pool.query(
    'SELECT id, student_id AS studentId, internship_id AS internshipId, saved_at AS savedAt FROM saved_internships WHERE student_id = ? AND internship_id = ? LIMIT 1',
    [studentId, internshipId]
  );
  return rows[0] || null;
}

/**
 * Creates a new bookmark (saves an internship for a student).
 * @param {number} studentId
 * @param {number} internshipId
 * @returns {Promise<number>} the newly created saved_internships.id
 */
async function createBookmark(studentId, internshipId) {
  const [result] = await pool.query(
    'INSERT INTO saved_internships (student_id, internship_id) VALUES (?, ?)',
    [studentId, internshipId]
  );
  return result.insertId;
}

/**
 * Deletes an existing bookmark (removes saved internship).
 * @param {number} studentId
 * @param {number} internshipId
 * @returns {Promise<boolean>} true if a row was deleted
 */
async function deleteBookmark(studentId, internshipId) {
  const [result] = await pool.query(
    'DELETE FROM saved_internships WHERE student_id = ? AND internship_id = ?',
    [studentId, internshipId]
  );
  return result.affectedRows > 0;
}

/**
 * Retrieves a student's bookmarked internships, paginated.
 * @param {number} studentId
 * @param {{ limit: number, offset: number }} options
 * @returns {Promise<{ rows: object[], total: number }>}
 */
async function findStudentBookmarks(studentId, { limit, offset }) {
  const [rows] = await pool.query(
    `SELECT 
      si.id,
      si.student_id AS studentId,
      si.internship_id AS internshipId,
      si.saved_at AS savedAt,
      i.title AS internshipTitle,
      i.location AS internshipLocation,
      i.duration AS internshipDuration,
      i.stipend AS stipend,
      i.application_deadline AS applicationDeadline,
      i.status AS status,
      i.required_skills AS requiredSkills,
      cp.id AS companyId,
      cp.company_name AS companyName,
      cp.logo_url AS companyLogoUrl
     FROM saved_internships si
     INNER JOIN internships i ON i.id = si.internship_id
     INNER JOIN company_profiles cp ON cp.id = i.company_id
     WHERE si.student_id = ?
     ORDER BY si.saved_at DESC
     LIMIT ? OFFSET ?`,
    [studentId, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total 
     FROM saved_internships si
     INNER JOIN internships i ON i.id = si.internship_id
     INNER JOIN company_profiles cp ON cp.id = i.company_id
     WHERE si.student_id = ?`,
    [studentId]
  );

  const mappedRows = rows.map((row) => ({
    id: row.id,
    studentId: row.studentId,
    internshipId: row.internshipId,
    savedAt: row.savedAt,
    internship: {
      id: row.internshipId,
      title: row.internshipTitle,
      location: row.internshipLocation,
      duration: row.internshipDuration,
      stipend: row.stipend,
      applicationDeadline: row.applicationDeadline,
      status: row.status,
      requiredSkills: parseRequiredSkills(row.requiredSkills),
      companyId: row.companyId,
      companyName: row.companyName,
      companyLogoUrl: row.companyLogoUrl,
    },
  }));

  return { rows: mappedRows, total: countRows[0].total };
}

module.exports = {
  findBookmark,
  createBookmark,
  deleteBookmark,
  findStudentBookmarks,
};
