import api from './api';

/**
 * Retrieves the student's bookmarked/saved internships list.
 * @param {object} [filters] - Pagination filters: page, limit.
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function getSavedInternships(filters = {}) {
  const response = await api.get('/bookmarks', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

/**
 * Bookmarks an internship for the student.
 * @param {number|string} internshipId
 * @returns {Promise<object>}
 */
export async function saveInternship(internshipId) {
  const response = await api.post(`/bookmarks/${internshipId}`);
  return response.data;
}

/**
 * Removes an internship from the student's bookmarks.
 * @param {number|string} internshipId
 * @returns {Promise<object>}
 */
export async function removeSavedInternship(internshipId) {
  const response = await api.delete(`/bookmarks/${internshipId}`);
  return response.data;
}

export default {
  getSavedInternships,
  saveInternship,
  removeSavedInternship,
};
