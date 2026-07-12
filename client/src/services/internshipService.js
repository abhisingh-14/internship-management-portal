import api from './api';

const BASE_PATH = '/internships';

/**
 * Builds a clean query-string object, omitting keys whose value is
 * undefined, null, or an empty string so Axios/URLSearchParams never
 * serializes filler parameters like "?location=" onto the request.
 * @param {object} params
 * @returns {object}
 */
function stripEmptyParams(params) {
  return Object.entries(params).reduce((accumulator, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

/**
 * Component 10 — retrieves the public, paginated list of active
 * (published, non-expired) internships, with optional keyword/filter
 * query parameters. No authentication required.
 * @param {object} filters
 * @param {string} [filters.search]
 * @param {string} [filters.location]
 * @param {number} [filters.minStipend]
 * @param {number} [filters.maxStipend]
 * @param {string} [filters.duration]
 * @param {number} [filters.page]
 * @param {number} [filters.limit]
 * @param {string} [filters.sort]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function getPublishedInternships(filters = {}) {
  const response = await api.get('/internships', {
    params: stripEmptyParams(filters),
  });
  return { items: response.data.data, meta: response.data.meta };
}

/**
 * Retrieves the authenticated company's own internship postings.
 * @param {{ search?: string, status?: string, page?: number, limit?: number, sort?: string }} params
 */
export const getMyInternships = async (params = {}) => {
  const response = await api.get(`${BASE_PATH}/my`, { params });
  return { data: response.data.data, meta: response.data.meta };
};

/**
 * Retrieves a single internship posting by id.
 * @param {number|string} internshipId
 */
export const getInternshipById = async (internshipId) => {
  const response = await api.get(`${BASE_PATH}/${internshipId}`);
  return response.data.data;
};

/**
 * Creates a new internship posting for the authenticated company.
 * @param {object} payload
 */
export const createInternship = async (payload) => {
  const response = await api.post(BASE_PATH, payload);
  return response.data;
};

/**
 * Updates an existing internship posting owned by the authenticated company.
 * @param {number|string} internshipId
 * @param {object} payload
 */
export const updateInternship = async (internshipId, payload) => {
  const response = await api.put(`${BASE_PATH}/${internshipId}`, payload);
  return response.data;
};

/**
 * Transitions an internship posting's status (draft/published/closed).
 * @param {number|string} internshipId
 * @param {string} status
 */
export const updateInternshipStatus = async (internshipId, status) => {
  const response = await api.patch(`${BASE_PATH}/${internshipId}/status`, { status });
  return response.data;
};

/**
 * Deletes (or archives, if it has applications) an internship posting.
 * @param {number|string} internshipId
 */
export const deleteInternship = async (internshipId) => {
  const response = await api.delete(`${BASE_PATH}/${internshipId}`);
  return response.data;
};

export default {
  getMyInternships,
  getInternshipById,
  createInternship,
  updateInternship,
  updateInternshipStatus,
  deleteInternship,
};
