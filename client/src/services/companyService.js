import api from './api';

/**
 * Fetches the authenticated company's dashboard summary
 * (profile snapshot, completeness percentage, internship stats).
 */
export async function fetchCompanyDashboard() {
  const response = await api.get('/companies/dashboard');
  return response.data.data;
}

/**
 * Fetches the authenticated company's full profile.
 */
export async function fetchCompanyProfile() {
  const response = await api.get('/companies/profile');
  return response.data.data;
}

/**
 * Updates the authenticated company's editable profile fields.
 * @param {{ companyName?: string, description?: string|null, website?: string|null, industry?: string|null }} payload
 */
export async function updateCompanyProfile(payload) {
  const response = await api.put('/companies/profile', payload);
  return response.data.data;
}
