# Internship Management (Component 09)

## Objective

This component implements the Internship Management module for Companies:
create, view own, edit, delete, and search internship postings — built on
top of Authentication (05), Student Module (06), Company Module (07), and
File Upload (08). It reuses the MVC skeleton, typed errors, response
envelope, pagination utilities, and auth/authorization middleware
established in earlier components without modification.

This component implements FR-COM-03 in
`docs/01_Software_Requirements_Specification.md`, extends the
`/internships` endpoint group documented in `docs/03_API_Design.md` §8.4,
and follows the ownership/authorization rules in
`docs/04_Project_Architecture.md` §7.

---

## Features Implemented

**Backend**

- `POST /internships` — create an internship posting, restricted to
  companies whose `approval_status` is `approved` (FR-COM-02).
- `GET /internships/my` — view the authenticated company's own postings,
  with keyword search (title/description), status filter, sorting, and
  pagination.
- `GET /internships/:internshipId` — public for `published` postings;
  the owning company or an admin may view a posting in **any** status
  (draft, closed, flagged, removed) via a new optional-authentication
  middleware. Non-owners requesting a non-published posting receive
  `404 Not Found` (not `403`), to avoid revealing its existence.
- `PUT /internships/:internshipId` — full/partial edit, owner-only.
  Companies may only set `status` to `draft`, `published`, or `closed`
  through this endpoint (matches `03_API_Design.md`).
- `PATCH /internships/:internshipId/status` — dedicated status-transition
  endpoint for quick publish/close actions; owner or admin. Companies are
  still restricted to `draft`/`published`/`closed`; `flagged`/`removed`
  remain admin-only, enforced in the controller.
- `DELETE /internships/:internshipId` — owner-only. If the posting has
  zero applications, it is hard-deleted (`204 No Content`). If it has one
  or more applications, it is soft-deleted (`status = 'removed'`,
  `200 OK` with the updated object), per the rule already documented in
  `03_API_Design.md` §8.4. Application count is read directly from the
  existing `applications` table (created in Component 02; no model for it
  exists yet, so this is a narrowly-scoped read query in the internship
  model, not a dependency on an unbuilt Applications module).
- All list/search results are paginated server-side (`LIMIT`/`OFFSET`),
  never fetched in full.
- All writes use parameterized queries; no raw SQL concatenation.

**Frontend**

- `ManagePostings` page: search bar, status filter, paginated table,
  and a modal-based create/edit form — all company-only, behind the
  existing `ProtectedRoute` + `RoleRoute(['company'])` guards.
- `PostingForm`: reusable create/edit form component (controlled inputs,
  Bootstrap validation classes, server-side field error mapping).
- `PostingsTable`: reusable, presentational table with Edit / Publish /
  Close / Delete actions; receives data and callbacks via props only.
- `Pagination`: new reusable common component (not previously created)
  for any future paginated list page.
- `internshipService.js`: Axios service layer isolating all HTTP calls
  for this resource from components, per architecture conventions.

---

## Folder Structure

```
internship-management-portal/
├── server/
│   ├── controllers/
│   │   └── internship.controller.js       (new)
│   ├── middleware/
│   │   └── optionalAuthenticate.js         (new)
│   ├── models/
│   │   └── internship.model.js             (new)
│   ├── routes/
│   │   ├── index.js                        (modified)
│   │   └── internship.routes.js            (new)
│   └── validators/
│       └── internship.validator.js         (new)
│
└── client/
    └── src/
        ├── components/
        │   ├── common/
        │   │   └── Pagination.jsx          (new)
        │   └── company/
        │       ├── PostingForm.jsx         (new)
        │       └── PostingsTable.jsx       (new)
        ├── pages/
        │   └── company/
        │       └── ManagePostings.jsx      (new)
        ├── routes/
        │   └── AppRoutes.jsx               (modified)
        └── services/
            └── internshipService.js        (new)
```

---

## Files Created

| File | Purpose |
|------|---------|
| `server/validators/internship.validator.js` | Express Validator schemas for create, update, status-transition, and search-query requests. |
| `server/models/internship.model.js` | All parameterized SQL access for `internships`: create, find by id (with owning company info), search/paginate by company, partial update, status update, application count, hard delete, soft (`removed`) delete. |
| `server/controllers/internship.controller.js` | Orchestrates all six internship use cases: create, list-own, get-by-id (public/owner-aware), update, status update, delete. Enforces company-approval gating and ownership checks. |
| `server/middleware/optionalAuthenticate.js` | Verifies a Bearer token if present and attaches `req.user`; never rejects the request if the token is missing/invalid, allowing `GET /internships/:internshipId` to serve both guests and owners/admins. |
| `server/routes/internship.routes.js` | Declares all `/internships/*` paths and their middleware chains. |
| `client/src/services/internshipService.js` | Axios calls for create/list/get/update/status-update/delete. |
| `client/src/components/common/Pagination.jsx` | Reusable Bootstrap pagination control. |
| `client/src/components/company/PostingForm.jsx` | Reusable create/edit form for internship postings. |
| `client/src/components/company/PostingsTable.jsx` | Reusable, presentational postings table with row actions. |
| `client/src/pages/company/ManagePostings.jsx` | Page composing search, filters, table, pagination, and the create/edit modal. |
| `docs/Components/09_Internship_Management.md` | This document. |

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `server/routes/index.js` | Mounted `internshipRoutes` at `/internships`, alongside the existing `auth`, `students`, `companies` routers. | This is the first component to introduce the internship resource router. |
| `client/src/routes/AppRoutes.jsx` | Added `company/postings` route, nested under the existing `ProtectedRoute` → `RoleRoute(['company'])` branch. | Registers the new page in the routing tree established in Components 04–05. |

No changes were made to `server/config/*`, `server/middleware/authenticate.js`,
`server/middleware/authorize.js`, `server/middleware/validateRequest.js`,
`server/utils/*`, or any Student/Company Module file — none required
modification for this component.

---

## Database Changes

**None.** The `internships` table created in Component 02
(`server/database/schema.sql`) already contains every column required by
this component (`title`, `description`, `required_skills`, `location`,
`duration`, `stipend`, `application_deadline`, `status`, timestamps), and
already has the indexes needed for search/filter/sort
(`idx_internships_status`, `idx_internships_company_id`,
`idx_internships_deadline`, `idx_internships_search`). Keyword search in
this component uses `LIKE` on `title`/`description` rather than the
`FULLTEXT` index, since company-owned result sets are small and `LIKE`
gives predictable substring matches on short queries; the existing
`FULLTEXT` index remains available for the future public search endpoint.

---

## API Endpoints

### New endpoint (not previously documented — addendum to `docs/03_API_Design.md` §8.4)

#### `GET /internships/my`
- **Description:** Retrieves the authenticated company's own internship postings.
- **Authentication Required:** Yes — **User Role:** Company
- **Query Parameters:** `search`, `status`, `page`, `limit`, `sort`
- **Success Response:** `200 OK` — paginated list of the company's postings (any status).
- **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (no company profile).

### Endpoints already documented in `docs/03_API_Design.md`, now implemented

| Endpoint | Notes on this implementation |
|----------|-------------------------------|
| `POST /internships` | Blocked with `403 Forbidden` if the company's `approval_status` is not `approved`. |
| `GET /internships/:internshipId` | Now owner/admin-aware via `optionalAuthenticate`; non-owners see `404` for any non-`published` posting. |
| `PUT /internships/:internshipId` | Owner-only; `status` restricted to `draft`/`published`/`closed`. |
| `PATCH /internships/:internshipId/status` | Owner or admin; company still restricted to `draft`/`published`/`closed`. |
| `DELETE /internships/:internshipId` | Hard delete if zero applications, else soft delete to `removed`, exactly as documented. |

---

## Backend Components

| Layer | File | Description |
|-------|------|--------------|
| Validator | `server/validators/internship.validator.js` | Field-level validation for all internship write/search requests. |
| Middleware | `server/middleware/optionalAuthenticate.js` | Non-blocking JWT verification for the public/owner-aware detail route. |
| Model | `server/models/internship.model.js` | All SQL access for `internships`, including a scoped read of `applications` for delete-mode decisions. |
| Controller | `server/controllers/internship.controller.js` | Business logic for create/list/get/update/status/delete. |
| Route | `server/routes/internship.routes.js` | `/internships/*` path-to-middleware-to-controller wiring. |

## Frontend Components

| Component/Page | File | Description |
|------------------|------|--------------|
| `ManagePostings` | `client/src/pages/company/ManagePostings.jsx` | Company dashboard page for full posting lifecycle management. |
| `PostingForm` | `client/src/components/company/PostingForm.jsx` | Reusable create/edit form. |
| `PostingsTable` | `client/src/components/company/PostingsTable.jsx` | Reusable postings list with row actions. |
| `Pagination` | `client/src/components/common/Pagination.jsx` | Reusable pagination control (available to any future list page). |

---

## Security Considerations

- **Approval gating enforced server-side.** `POST /internships` checks
  `company_profiles.approval_status === 'approved'` in the controller
  before any insert, independent of any client-side UI state (FR-COM-02).
- **Ownership enforced on every write.** `PUT`, `PATCH .../status`, and
  `DELETE` all verify `internship.companyUserId === req.user.userId`
  (or admin, for the status endpoint) before mutating anything.
- **No existence leakage for non-published postings.** A non-owner
  requesting a `draft`/`closed`/`flagged`/`removed` posting by id receives
  `404 Not Found`, not `403 Forbidden`, so guessing valid ids cannot be
  used to enumerate a competitor's unpublished postings.
- **Company-settable statuses are whitelisted.** Both `PUT` and
  `PATCH .../status` reject `flagged`/`removed` from company callers,
  even though the underlying `status` enum permits them — those remain
  admin-only moderation actions per the database and API design.
- **All SQL is parameterized.** No string concatenation is used in any
  query in `internship.model.js`, including the `LIKE`-based search.
- **Explicit column selection.** No query in this component ever uses
  `SELECT *`; `password_hash` is never reachable from any internship query.
- **`optionalAuthenticate` fails closed to "guest," never open to
  elevated access.** Any error verifying the token (expired, malformed,
  signature mismatch, deactivated user) results in `req.user` being left
  `undefined`, which the controller treats as an anonymous, published-only
  viewer — it never accidentally grants owner/admin visibility.

---

## Testing Checklist

- [ ] A pending or rejected company receives `403 Forbidden` when calling `POST /internships`, with a clear message.
- [ ] An approved company can create a posting with `status: "draft"` (default) or `status: "published"`.
- [ ] `POST /internships` rejects an `applicationDeadline` in the past with `422 Unprocessable Entity`.
- [ ] `GET /internships/my` returns only the authenticated company's own postings, in every status, paginated.
- [ ] `GET /internships/my?search=react` returns only postings whose title or description contains "react" (case-insensitive).
- [ ] `GET /internships/my?status=draft` returns only draft postings.
- [ ] `GET /internships/:internshipId` for a `published` posting succeeds with no `Authorization` header.
- [ ] `GET /internships/:internshipId` for a `draft` posting returns `404 Not Found` when called with no token or as a different company.
- [ ] `GET /internships/:internshipId` for a `draft` posting succeeds when called by its owning company or by an admin.
- [ ] `PUT /internships/:internshipId` as a non-owning company returns `403 Forbidden`.
- [ ] `PUT /internships/:internshipId` with `status: "flagged"` is rejected with `422` (not a valid update-endpoint value) — flagging is admin-only via `PATCH .../status` or the future moderation endpoint.
- [ ] `PATCH /internships/:internshipId/status` as the owning company can move `draft → published → closed`, but is rejected with `403` when attempting `flagged`/`removed`.
- [ ] `DELETE /internships/:internshipId` on a posting with zero applications returns `204 No Content` and the row no longer exists.
- [ ] `DELETE /internships/:internshipId` on a posting with one or more applications returns `200 OK` with `status: "removed"`, and the row (and its applications) still exist in the database.
- [ ] On the frontend, `ManagePostings` loads the company's postings on mount, supports search/filter/pagination, and refreshes the list after create/edit/delete/status-change actions.
- [ ] Submitting `PostingForm` with an invalid field surfaces the server's `422` field errors inline (Bootstrap `is-invalid`/`invalid-feedback`).

---

## Future Dependencies

- **Applications component** — will introduce `application.model.js`
  and reuse `internshipModel.countApplicationsForInternship` conceptually
  (or query `applications` directly) for its own business rules; it will
  also be the first component to write to the `applications` table this
  component only reads from.
- **Admin Module component** — will implement
  `PATCH /admin/internships/:internshipId/moderate` for `flagged`/`removed`/`restored`
  transitions, which this component's `PATCH /internships/:internshipId/status`
  intentionally does not allow companies to trigger.
- **Public Internship Listing component (student-facing)** — will add
  `GET /internships` (public, published-only, full-text search via the
  existing `idx_internships_search` index) as a separate, unauthenticated
  endpoint; this component's `getInternshipById` controller is already
  written to support that flow (public visibility for `published`
  postings) without modification.
- **Analytics component** — `GET /analytics/companies/postings` will
  likely reuse `internshipModel.findInternshipsByCompany`'s WHERE-clause
  pattern, joined against future `applications`/view counts.

---

## Notes

- **Assumption — `companyProfile.model.js` export name.** Component 05
  documented `companyProfile.model.js` as exposing "find a profile by
  user id" without specifying the exact function name. This component
  imports it as `findProfileByUserId(userId)`, returning the full profile
  row (including `id` and `approval_status`). If the actual exported name
  differs, only the import statement in `internship.controller.js` needs
  a one-line update.
- **Assumption — `generateToken.js` export name.** `optionalAuthenticate.js`
  imports `verifyAccessToken` from `server/utils/generateToken.js`,
  consistent with that file's documented purpose ("signs and verifies
  access...tokens" — Component 05). If the real export is named
  differently, only this one import needs updating.
- **Assumption — `user.model.js` export name.** `optionalAuthenticate.js`
  calls `userModel.findUserById(id)`, expected to return safe columns
  including `account_status`, mirroring the equivalent lookup already
  performed inside `authenticate.js` per Component 05's description.
- **Assumption — `sendSuccess` signature.** Used as
  `sendSuccess(res, { statusCode, message, data, meta })` with an implicit
  default `statusCode` of `200` when omitted, consistent with Component 03's
  description of a single shared success-envelope helper.
- **Assumption — `AppRoutes.jsx` prior structure.** The full prior content
  of this file was not available in this session (only its described
  structure from Components 04–05: layout route, public routes, an
  authenticated branch reserved for role-guarded routes). It was
  reconstructed consistent with that description and extended with the
  new `company/postings` route. If the actual file differs, only the new
  `<Route path="company/postings" ...>` entry needs to be merged in under
  the existing `RoleRoute(['company'])` branch.
- **Design choice — `LIKE`-based search over `FULLTEXT`.** For a single
  company's own (typically small) set of postings, `LIKE '%term%'` gives
  simpler, more predictable substring matching than MySQL's natural-language
  `FULLTEXT` mode (which has a default 4-character minimum word length and
  stopword exclusions). The `FULLTEXT` index created in Component 02
  remains available and is the right tool for the future public,
  large-scale internship search endpoint.
- **Limitation — no request rate limiting** on internship write endpoints;
  this was not in scope for this component and would be handled by the
  same general rate-limiting hardening noted as outstanding in Component 05.

---

*End of Document — 09_Internship_Management.md*
