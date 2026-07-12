const pool = require('../config/db');

/**
 * All parameterized SQL access for the `student_skills` table. Every
 * function that mutates or reads a specific row is scoped by `studentId`
 * (student_profiles.id) so ownership is enforced at the query level.
 *
 * The `uq_student_skills_student_skill` unique constraint (student_id,
 * skill_name) is the database-level second line of defense against
 * duplicate skill entries for the same student, backing the
 * application-layer uniqueness check performed in the controller.
 */

const SAFE_COLUMNS = `
  id,
  student_id AS studentId,
  skill_name AS skillName,
  proficiency_level AS proficiencyLevel,
  created_at AS createdAt,
  updated_at AS updatedAt
`;

/**
 * Retrieves every skill belonging to a student, alphabetically by name.
 *
 * @param {number} studentId
 * @returns {Promise<object[]>}
 */
async function findAllByStudentId(studentId) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS}
     FROM student_skills
     WHERE student_id = ?
     ORDER BY skill_name ASC`,
    [studentId]
  );
  return rows;
}

/**
 * Retrieves a single skill by id, scoped to the owning student.
 *
 * @param {number} skillId
 * @param {number} studentId
 * @returns {Promise<object|null>}
 */
async function findByIdAndStudentId(skillId, studentId) {
  const [rows] = await pool.execute(
    `SELECT ${SAFE_COLUMNS}
     FROM student_skills
     WHERE id = ? AND student_id = ?
     LIMIT 1`,
    [skillId, studentId]
  );
  return rows[0] || null;
}

/**
 * Checks whether a student already has a skill with the given name
 * (case-insensitive, since MySQL's default collation on VARCHAR is
 * already case-insensitive for comparisons).
 *
 * @param {number} studentId
 * @param {string} skillName
 * @returns {Promise<boolean>}
 */
async function existsByStudentAndName(studentId, skillName) {
  const [rows] = await pool.execute(
    `SELECT id FROM student_skills WHERE student_id = ? AND skill_name = ? LIMIT 1`,
    [studentId, skillName]
  );
  return rows.length > 0;
}

/**
 * Creates a new skill entry for a student.
 *
 * @param {number} studentId
 * @param {{ skillName: string, proficiencyLevel?: 'beginner'|'intermediate'|'advanced'|'expert' }} params
 * @returns {Promise<number>} the newly created row's id
 */
async function create(studentId, { skillName, proficiencyLevel }) {
  const [result] = await pool.execute(
    `INSERT INTO student_skills (student_id, skill_name, proficiency_level)
     VALUES (?, ?, ?)`,
    [studentId, skillName, proficiencyLevel ?? 'intermediate']
  );
  return result.insertId;
}

/**
 * Updates the proficiency level of an existing skill, scoped to the
 * owning student. Skill name itself is intentionally immutable via this
 * endpoint — renaming a skill is modeled as delete + create to avoid
 * silently merging two distinct skill entries.
 *
 * @param {number} skillId
 * @param {number} studentId
 * @param {'beginner'|'intermediate'|'advanced'|'expert'} proficiencyLevel
 * @returns {Promise<boolean>} true if a row was updated
 */
async function updateProficiency(skillId, studentId, proficiencyLevel) {
  const [result] = await pool.execute(
    `UPDATE student_skills
     SET proficiency_level = ?
     WHERE id = ? AND student_id = ?`,
    [proficiencyLevel, skillId, studentId]
  );
  return result.affectedRows > 0;
}

/**
 * Deletes a skill entry, scoped to the owning student.
 *
 * @param {number} skillId
 * @param {number} studentId
 * @returns {Promise<boolean>} true if a row was deleted
 */
async function deleteById(skillId, studentId) {
  const [result] = await pool.execute(
    `DELETE FROM student_skills WHERE id = ? AND student_id = ?`,
    [skillId, studentId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAllByStudentId,
  findByIdAndStudentId,
  existsByStudentAndName,
  create,
  updateProficiency,
  deleteById,
};
