const { pool } = require('../config/db');

const SORTABLE_COLUMNS = {
  createdAt: 'i.created_at',
  applicationDeadline: 'i.application_deadline',
  title: 'i.title',
  stipend: 'i.stipend',
};

const UPDATABLE_COLUMNS = {
  title: 'title',
  description: 'description',
  requiredSkills: 'required_skills',
  location: 'location',
  duration: 'duration',
  stipend: 'stipend',
  applicationDeadline: 'application_deadline',
  status: 'status',
};

const INTERNSHIP_STATUSES = ['draft', 'published', 'closed', 'flagged', 'removed'];

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

function mapInternshipListRow(row) {
  return {
    id: row.id,
    title: row.title,
    location: row.location,
    duration: row.duration,
    stipend: row.stipend,
    applicationDeadline: row.application_deadline,
    requiredSkills: parseRequiredSkills(row.required_skills),
    status: row.status,
    createdAt: row.created_at,
    companyId: row.company_id,
    companyName: row.company_name,
    companyLogoUrl: row.logo_url,
  };
}

function mapInternshipDetailRow(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    requiredSkills: parseRequiredSkills(row.required_skills),
    location: row.location,
    duration: row.duration,
    stipend: row.stipend,
    applicationDeadline: row.application_deadline,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    ownerUserId: row.company_user_id,
    company: {
      id: row.company_id,
      companyName: row.company_name,
      description: row.company_description,
      website: row.website,
      industry: row.industry,
      logoUrl: row.logo_url,
    },
  };
}

/**
 * Creates a new internship posting owned by the given company profile.
 */
async function createInternship({
  companyId,
  title,
  description,
  requiredSkills,
  location,
  duration,
  stipend,
  applicationDeadline,
  status,
}) {
  const [result] = await pool.query(
    `INSERT INTO internships
      (company_id, title, description, required_skills, location, duration, stipend, application_deadline, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      companyId,
      title,
      description,
      JSON.stringify(requiredSkills),
      location,
      duration,
      stipend,
      applicationDeadline,
      status || 'draft',,
    ]
  );

  return findInternshipById(result.insertId);
}

async function findInternshipRawById(internshipId) {
  const [rows] = await pool.query(
    `SELECT
      i.id,
      i.company_id AS companyId,
      i.title,
      i.description,
      i.required_skills AS requiredSkills,
      i.location,
      i.duration,
      i.stipend,
      i.application_deadline AS applicationDeadline,
      i.status,
      i.created_at AS createdAt,
      i.updated_at AS updatedAt,
      cp.company_name AS companyName,
      cp.logo_url AS companyLogoUrl,
      cp.user_id AS companyUserId
    FROM internships i
    JOIN company_profiles cp ON i.company_id = cp.id
    WHERE i.id = ?`,
    [internshipId]
  );
  return rows[0] || null;
}

/**
 * Retrieves a single internship by id, including owning company details
 * needed for ownership checks and public display. Never selects password_hash.
 */
async function findInternshipById(id) {
  const row = await findInternshipRawById(id);
  if(!row) return null

  return mapInternshipDetailRow(row);
}

/**
 * Retrieves a paginated, filterable, searchable list of internships owned
 * by a specific company. Search matches keyword against title/description.
 */
async function findInternshipsByCompany({ companyId, search, status, limit, offset, sort }) {
  const conditions = ['i.company_id = ?'];
  const params = [companyId];

  if (status) {
    conditions.push('i.status = ?');
    params.push(status);
  }

  if (search) {
    conditions.push('(i.title LIKE ? OR i.description LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;

  let orderColumn = 'i.created_at';
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
      i.id,
      i.company_id AS companyId,
      i.title,
      i.description,
      i.required_skills AS requiredSkills,
      i.location,
      i.duration,
      i.stipend,
      i.application_deadline AS applicationDeadline,
      i.status,
      i.created_at AS createdAt,
      i.updated_at AS updatedAt
    FROM internships i
    ${whereClause}
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total FROM internships i ${whereClause}`,
    params
  );

  return { rows, total: countRows[0].total };
}

/**
 * Component 10 — public, student-facing search across all active
 * (published, non-expired) internships. "Active" is enforced here at the
 * query level (status = 'published' AND application_deadline >= CURDATE())
 * rather than relying solely on the not-yet-implemented scheduled
 * auto-close job (FR-INT-05), so listings stay correct even if that job
 * has not run yet.
 *
 * Keyword search uses the existing FULLTEXT index (idx_internships_search)
 * defined in server/database/schema.sql, per docs/02_Database_Design.md §7.
 *
 * @param {object} filters
 * @param {string} [filters.search] - keyword search across title/description.
 * @param {string} [filters.location] - substring match on location.
 * @param {number} [filters.minStipend]
 * @param {number} [filters.maxStipend]
 * @param {string} [filters.duration] - exact match on duration.
 * @param {string} filters.sortColumn - resolved SQL column (from SORTABLE_COLUMNS).
 * @param {string} filters.sortDirection - 'ASC' | 'DESC'.
 * @param {number} filters.limit
 * @param {number} filters.offset
 * @returns {Promise<{items: object[], totalItems: number}>}
 */
async function findPublishedInternships({
  search,
  location,
  minStipend,
  maxStipend,
  duration,
  sortColumn,
  sortDirection,
  limit,
  offset,
}) {
  const conditions = [`i.status = 'published'`, `i.application_deadline >= CURDATE()`];
  const params = [];

  if (search) {
    conditions.push('MATCH(i.title, i.description) AGAINST (? IN NATURAL LANGUAGE MODE)');
    params.push(search);
  }
  if (location) {
    conditions.push('i.location LIKE ?');
    params.push(`%${location}%`);
  }
  if (minStipend !== undefined && minStipend !== null && !Number.isNaN(minStipend)) {
    conditions.push('i.stipend >= ?');
    params.push(minStipend);
  }
  if (maxStipend !== undefined && maxStipend !== null && !Number.isNaN(maxStipend)) {
    conditions.push('i.stipend <= ?');
    params.push(maxStipend);
  }
  if (duration) {
    conditions.push('i.duration = ?');
    params.push(duration);
  }

  const whereClause = ` WHERE ${conditions.join(' AND ')}`;
  const fromClause = ' FROM internships i JOIN company_profiles cp ON i.company_id = cp.id';
  const resolvedSortColumn = Object.values(SORTABLE_COLUMNS).includes(sortColumn)
    ? sortColumn
    : SORTABLE_COLUMNS.createdAt;

  const [countRows] = await pool.query(
    `SELECT COUNT(*) AS total${fromClause}${whereClause}`,
    params
  );
  const totalItems = countRows[0].total;

  const [rows] = await pool.query(
    `SELECT i.id, i.company_id, i.title, i.required_skills, i.location, i.duration,
            i.stipend, i.application_deadline, i.status, i.created_at,
            cp.company_name, cp.logo_url
     ${fromClause}${whereClause}
     ORDER BY ${resolvedSortColumn} ${sortDirection}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return {
    items: rows.map(mapInternshipListRow),
    totalItems,
  };
}

/**
 * Applies a partial update to an internship posting. Only whitelisted
 * columns are ever written; requiredSkills is re-serialized to JSON.
 */
async function updateInternship(id, fields) {
  const setClauses = [];
  const params = [];

  Object.entries(fields).forEach(([key, value]) => {
    const column = UPDATABLE_COLUMNS[key];
    if (!column) {
      return;
    }
    setClauses.push(`${column} = ?`);
    params.push(key === 'requiredSkills' ? JSON.stringify(value) : value);
  });

  if (setClauses.length === 0) {
    return findInternshipById(id);
  }

  params.push(id);
  await pool.query(`UPDATE internships SET ${setClauses.join(', ')} WHERE id = ?`, params);

  return findInternshipById(id);
}

/**
 * Updates only the status column of an internship posting.
 */
async function updateInternshipStatus(id, status) {
  await pool.query('UPDATE internships SET status = ? WHERE id = ?', [status, id]);
  return findInternshipById(id);
}

/**
 * Counts applications submitted against a given internship. Used to decide
 * between hard delete and soft (status = 'removed') delete on DELETE requests.
 */
async function countApplicationsForInternship(internshipId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM applications WHERE internship_id = ?',
    [internshipId]
  );

  return rows[0].total;
}

/**
 * Permanently deletes an internship posting. Only safe to call when the
 * posting has zero associated applications (enforced by the controller).
 */
async function deleteInternshipHard(id) {
  await pool.query('DELETE FROM internships WHERE id = ?', [id]);
}

/**
 * Soft-deletes an internship posting by transitioning its status to
 * 'removed', preserving associated applications for student history.
 */
async function softRemoveInternship(id) {
  await pool.query("UPDATE internships SET status = 'removed' WHERE id = ?", [id]);
  return findInternshipById(id);
}


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
  SORTABLE_COLUMNS,
  createInternship,
  findInternshipById,
  findInternshipsByCompany,
  findPublishedInternships,
  updateInternship,
  updateInternshipStatus,
  countApplicationsForInternship,
  deleteInternshipHard,
  softRemoveInternship,
  getInternshipStatsByCompanyId,
};
