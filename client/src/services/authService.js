// client/src/services/authService.js

import api from './api';

/**
 * Registers a new Student or Company account.
 * @param {{ role: string, name: string, email: string, password: string, companyName?: string }} formData
 * @returns {Promise<{ user: object, token: string, refreshToken: string }>}
 */
export async function register(formData) {
  const response = await api.post('/auth/register', formData);
  return response.data.data;
}

/**
 * Authenticates a user and returns their identity plus tokens.
 * @param {{ email: string, password: string }} credentials
 * @returns {Promise<{ user: object, token: string, refreshToken: string }>}
 */
export async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  return response.data.data;
}

/**
 * Notifies the server of logout (reserved for future token-blacklisting).
 * @returns {Promise<void>}
 */
export async function logout() {
  await api.post('/auth/logout');
}

/**
 * Retrieves the currently authenticated user's basic identity.
 * @returns {Promise<object>}
 */
export async function getMe() {
  const response = await api.get('/auth/me');
  return response.data.data;
}

/**
 * Exchanges a refresh token for a new access token.
 * @param {string} refreshToken
 * @returns {Promise<string>} new access token
 */
export async function refreshAccessToken(refreshToken) {
  const response = await api.post('/auth/refresh-token', { refreshToken });
  return response.data.data.token;
}