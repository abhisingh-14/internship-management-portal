const { pool } = require('../config/db');

/**
 * All parameterized SQL access for the `student_education` table.
 * Every function that mutates or reads a specific row is scoped by
 * `studentId` (student_profiles.id) so ownership is enforced at the query
 * level, not just checked separately in the controller.
 */

const SAFE_COLUMNS = `
  id,
  student_id AS studentId,
  institution_name AS institutionName,
  degree,
  field_of_study AS fieldOfStudy,
  start_date AS startDate,
  end_date AS endDate,
  is_current AS isCurrent,
  grade,
  description,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

/**
 * Retrieves every education entry belonging to a student, most recent
 * (by start date) first.
 *
 * @param {number} studentId
 * @returns {Promise<object[]>}
 */
async function findAllByStudentId(studentId) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS}
     FROM student_education
     WHERE student_id = ?
     ORDER BY start_date DESC, id DESC`,
    [studentId]
  );
  return rows;
}

/**
 * Retrieves a single education entry by id, scoped to the owning student.
 *
 * @param {number} educationId
 * @param {number} studentId
 * @returns {Promise<object|null>}
 */
async function findByIdAndStudentId(educationId, studentId) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS}
     FROM student_education
     WHERE id = ? AND student_id = ?
     LIMIT 1`,
    [educationId, studentId]
  );
  return rows[0] || null;
}

/**
 * Creates a new education entry for a student.
 *
 * @param {number} studentId
 * @param {{
 *   institutionName: string,
 *   degree: string,
 *   fieldOfStudy?: string|null,
 *   startDate: string,
 *   endDate?: string|null,
 *   isCurrent?: boolean,
 *   grade?: string|null,
 *   description?: string|null
 * }} params
 * @returns {Promise<number>} the newly created row's id
 */
async function create(studentId, params) {
  const [result] = await pool.execute(
    `INSERT INTO student_education
        (student_id, institution_name, degree, field_of_study, start_date,
         end_date, is_current, grade, description)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      studentId,
      params.institutionName,
      params.degree,
      params.fieldOfStudy ?? null,
      params.startDate,
      params.endDate ?? null,
      params.isCurrent ?? false,
      params.grade ?? null,
      params.description ?? null,
    ]
  );
  return result.insertId;
}

/**
 * Updates an existing education entry, scoped to the owning student.
 * Only the provided fields are applied.
 *
 * @param {number} educationId
 * @param {number} studentId
 * @param {object} fields - any subset of the create() params
 * @returns {Promise<boolean>} true if a row was updated
 */
async function update(educationId, studentId, fields) {
  const columnMap = {
    institutionName: 'institution_name',
    degree: 'degree',
    fieldOfStudy: 'field_of_study',
    startDate: 'start_date',
    endDate: 'end_date',
    isCurrent: 'is_current',
    grade: 'grade',
    description: 'description',
  };

  const setClauses = [];
  const values = [];

  for (const [key, column] of Object.entries(columnMap)) {
    if (Object.prototype.hasOwnProperty.call(fields, key)) {
      setClauses.push(`${column} = ?`);
      values.push(fields[key]);
    }
  }

  if (setClauses.length === 0) {
    return false;
  }

  values.push(educationId, studentId);

  const [result] = await pool.execute(
    `UPDATE student_education
     SET ${setClauses.join(', ')}
     WHERE id = ? AND student_id = ?`,
    values
  );
  return result.affectedRows > 0;
}

/**
 * Deletes an education entry, scoped to the owning student.
 *
 * @param {number} educationId
 * @param {number} studentId
 * @returns {Promise<boolean>} true if a row was deleted
 */
async function deleteById(educationId, studentId) {
  const [result] = await pool.execute(
    `DELETE FROM student_education WHERE id = ? AND student_id = ?`,
    [educationId, studentId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAllByStudentId,
  findByIdAndStudentId,
  create,
  update,
  deleteById,
};
