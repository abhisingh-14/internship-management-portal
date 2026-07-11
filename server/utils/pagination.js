/**
 * pagination.js
 *
 * Shared pagination utility used by every future list-returning model/
 * controller pair, per docs/03_API_Design.md §3 (`page` default 1,
 * `limit` default 10, max 50) and docs/05_Coding_Standards.md's rule
 * that list queries are always paginated at the query level (LIMIT/
 * OFFSET), never fetched in full and paginated in application memory.
 *
 * This module has no knowledge of any specific resource — it only
 * parses/validates generic pagination query parameters and computes the
 * `meta` block returned in the standard response envelope.
 */

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/**
 * Parses and sanitizes `page`/`limit` query parameters into safe integers,
 * falling back to defaults for missing, non-numeric, or out-of-range values.
 *
 * @param {Object} [query={}] - Express `req.query` object.
 * @returns {{page: number, limit: number, offset: number}}
 */
function parsePaginationParams(query = {}) {
  let page = parseInt(query.page, 10);
  let limit = parseInt(query.limit, 10);

  if (!Number.isInteger(page) || page < 1) {
    page = DEFAULT_PAGE;
  }

  if (!Number.isInteger(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  } else if (limit > MAX_LIMIT) {
    limit = MAX_LIMIT;
  }

  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

/**
 * Builds the `meta` object included on paginated list responses.
 *
 * @param {number} page - Current page number.
 * @param {number} limit - Page size.
 * @param {number} totalItems - Total number of matching rows.
 * @returns {{page: number, limit: number, totalItems: number, totalPages: number}}
 */
function buildPaginationMeta(page, limit, totalItems) {
  const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
  return { page, limit, totalItems, totalPages };
}

module.exports = {
  parsePaginationParams,
  buildPaginationMeta,
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
};
