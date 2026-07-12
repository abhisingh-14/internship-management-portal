import api from './api';

/**
 * Submits a student's application to a specific internship.
 * @param {number|string} internshipId
 * @param {string} [coverLetter]
 * @returns {Promise<object>}
 */
export async function applyForInternship(internshipId, coverLetter) {
  const response = await api.post(`/internships/${internshipId}/applications`, { coverLetter });
  return response.data;
}

/**
 * Retrieves the student's applications history.
 * @param {object} [filters]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function getStudentApplications(filters = {}) {
  const response = await api.get('/students/applications', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

/**
 * Retrieves details of a single application by ID.
 * @param {number|string} applicationId
 * @returns {Promise<object>}
 */
export async function getApplicationDetails(applicationId) {
  const response = await api.get(`/applications/${applicationId}`);
  return response.data.data;
}

/**
 * Updates the status of an application (company or admin action).
 * @param {number|string} applicationId
 * @param {string} status
 * @returns {Promise<object>}
 */
export async function updateApplicationStatus(applicationId, status) {
  const response = await api.patch(`/applications/${applicationId}/status`, { status });
  return response.data.data;
}

/**
 * Withdraws a student's application.
 * @param {number|string} applicationId
 * @returns {Promise<object>}
 */
export async function withdrawApplication(applicationId) {
  const response = await api.delete(`/applications/${applicationId}`);
  return response.data;
}

/**
 * Retrieves all applicants across all listings for a company.
 * @param {object} [filters]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function getCompanyApplicants(filters = {}) {
  const response = await api.get('/companies/applicants', { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

/**
 * Retrieves applicants for a specific internship listing.
 * @param {number|string} internshipId
 * @param {object} [filters]
 * @returns {Promise<{ items: object[], meta: object }>}
 */
export async function getInternshipApplications(internshipId, filters = {}) {
  const response = await api.get(`/internships/${internshipId}/applications`, { params: filters });
  return { items: response.data.data, meta: response.data.meta };
}

export default {
  applyForInternship,
  getStudentApplications,
  getApplicationDetails,
  updateApplicationStatus,
  withdrawApplication,
  getCompanyApplicants,
  getInternshipApplications,
};
