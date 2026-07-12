import api from './api';

/**
 * Fetches all registered users with optional filters.
 */
export async function fetchUsers(params = {}) {
  const response = await api.get('/admin/users', { params });
  return response.data;
}

/**
 * Activates or deactivates a user account.
 */
export async function updateUserStatus(userId, status) {
  const response = await api.patch(`/admin/users/${userId}/status`, { status });
  return response.data.data;
}

/**
 * Permanently deletes a user account.
 */
export async function deleteUser(userId) {
  const response = await api.delete(`/admin/users/${userId}`);
  return response.data.data;
}

/**
 * Fetches pending company registrations.
 */
export async function fetchPendingCompanies(params = {}) {
  const response = await api.get('/admin/companies/pending', { params });
  return response.data;
}

/**
 * Approves or rejects a company registration.
 */
export async function approveCompany(companyId, { decision, reason }) {
  const response = await api.patch(`/admin/companies/${companyId}/approval`, { decision, reason });
  return response.data.data;
}

/**
 * Fetches all internship postings platform-wide.
 */
export async function fetchInternships(params = {}) {
  const response = await api.get('/admin/internships', { params });
  return response.data;
}

/**
 * Moderates (flags, removes, or restores) an internship posting.
 */
export async function moderateInternship(internshipId, { action, reason }) {
  const response = await api.patch(`/admin/internships/${internshipId}/moderate`, { action, reason });
  return response.data.data;
}

/**
 * Fetches all internship applications platform-wide.
 */
export async function fetchAllApplications(params = {}) {
  const response = await api.get('/admin/applications', { params });
  return response.data;
}

/**
 * Fetches administrative audit logs.
 */
export async function fetchAuditLogs(params = {}) {
  const response = await api.get('/admin/audit-logs', { params });
  return response.data;
}

/**
 * Fetches platform-wide summary statistics (Admin Dashboard).
 */
export async function fetchPlatformAnalytics() {
  const response = await api.get('/analytics/platform');
  return response.data.data;
}

/**
 * Fetches postings metrics for company analytics.
 */
export async function fetchCompanyPostingsAnalytics() {
  const response = await api.get('/analytics/companies/postings');
  return response.data.data;
}

/**
 * Fetches activity stats for student dashboard.
 */
export async function fetchStudentActivityAnalytics() {
  const response = await api.get('/analytics/students/activity');
  return response.data.data;
}
