/**
 * fileUrl.js — shared utility for resolving server-relative file paths
 * into fully-qualified URLs.
 *
 * Background
 * ----------
 * The backend serves static uploads (logos, resumes, …) at paths like
 * /uploads/logos/<filename> rooted at the server origin
 * (e.g. http://localhost:5000).  When those relative paths are used
 * directly as <img src> or <a href> values in the Vite dev server
 * (http://localhost:5173), the browser resolves them against the *frontend*
 * origin and the requests 404.
 *
 * The canonical server origin is derived from VITE_API_BASE_URL which is
 * already defined in client/.env as:
 *   VITE_API_BASE_URL=http://localhost:5000/api/v1
 *
 * Stripping the "/api/v1" suffix gives the bare server origin.
 *
 * Usage
 * -----
 *   import { resolveFileUrl } from '../utils/fileUrl';
 *
 *   // Returns the full URL when path is relative, or the original value when
 *   // it is already absolute (handles future CDN / cloud-storage migrations).
 *   <img src={resolveFileUrl(company.logoUrl)} alt="logo" />
 *
 * Returns null/undefined as-is so callers can keep their existing
 * `logoUrl ? <img … /> : <fallback />` guard patterns unchanged.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

/**
 * Derives the bare server origin from VITE_API_BASE_URL by stripping
 * the "/api/v1" path suffix.  Falls back to an empty string so that
 * relative paths are at least rendered (useful in unit-test environments
 * where the env var may be absent).
 *
 * @type {string}
 */
export const SERVER_ORIGIN = API_BASE_URL.replace(/\/api\/v1\/?$/, '');

/**
 * Converts a server-relative file path (e.g. "/uploads/logos/abc.png")
 * into a fully-qualified URL by prepending the server origin.
 *
 * If `filePath` is already an absolute URL (starts with "http://" or
 * "https://") it is returned unchanged, which makes this utility safe to
 * use after a future migration to cloud object storage.
 *
 * Nullish values are returned as-is so existing conditional rendering
 * guards (`logoUrl ? <img /> : <fallback />`) continue to work without
 * any modification.
 *
 * @param {string | null | undefined} filePath - The path returned by the API.
 * @returns {string | null | undefined} A fully-qualified URL, or the original
 *   nullish value.
 */
export function resolveFileUrl(filePath) {
  if (!filePath) return filePath;
  if (/^https?:\/\//i.test(filePath)) return filePath;
  // Ensure there is exactly one "/" between the origin and the path.
  const separator = filePath.startsWith('/') ? '' : '/';
  return `${SERVER_ORIGIN}${separator}${filePath}`;
}
