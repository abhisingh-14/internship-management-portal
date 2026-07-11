// client/src/services/api.js

import axios from 'axios';
import { AUTH_TOKEN_KEY } from '../context/AuthContext';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach the stored access token, if one exists, to
// every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Normalizes any Axios error — network failure, timeout, or a server error
 * envelope per docs/03_API_Design.md §5 — into a single predictable shape.
 */
function normalizeApiError(error) {
  if (error.response) {
    const { status, data } = error.response;
    return {
      status,
      message: data?.message || 'An unexpected error occurred',
      errors: data?.errors || null,
    };
  }

  if (error.request) {
    return {
      status: null,
      message: 'Unable to reach the server. Please check your connection.',
      errors: null,
    };
  }

  return {
    status: null,
    message: error.message || 'An unexpected error occurred',
    errors: null,
  };
}

// Response interceptor: normalize every error, and broadcast a global
// event on 401 so AuthContext can clear the session without this
// resource-agnostic file needing to import React state directly.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalizedError = normalizeApiError(error);

    if (normalizedError.status === 401) {
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }

    return Promise.reject(normalizedError);
  }
);

export default api;