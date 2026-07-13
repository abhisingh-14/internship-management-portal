# Component 16 — Testing & Final Review

## Objective

Test the complete Internship Management Portal (Components 01–15), fix any
remaining bugs, improve code quality where necessary, and confirm every
module works together correctly end-to-end. This component performs no
new feature work — it is a verification and hardening pass across the
entire existing codebase, per `Project_Components.md`'s Component 16 scope
(Backend API Testing, Frontend Testing, Authentication/Authorization
Testing, CRUD Testing, File Upload Testing, Bug Fixes, Code Cleanup).

The detailed, file-by-file findings from this pass are recorded in
`docs/reviews/review.md`, which this document summarizes and formalizes.

---

## Method

1. **Static verification** — `node --check` on every backend `.js` file
   (zero syntax errors); `npm run build` on the frontend (clean Vite build,
   151 modules, zero errors).
2. **Live boot verification** — `server/app.js` imported and started on an
   ephemeral port with `GET /health` exercised live, confirming the full
   middleware chain (CORS → body parsing → `/uploads` → `/api/v1` → 404 →
   centralized error handler) boots and responds correctly without a live
   MySQL connection required for the app module itself.
3. **Manual cross-reference read** — every controller, model, route,
   validator, middleware, and utility file on the backend, and every
   non-trivial page/component/service on the frontend, read in full and
   cross-checked field-by-field: DB column (snake_case) → model mapping
   (camelCase) → controller consumption → frontend consumption, looking
   specifically for the class of bug a partial/skimming review would miss
   (a property read under the wrong name, silently evaluating to
   `undefined` instead of throwing).
4. **Lint verification** — added the ESLint configuration that had been
   missing since Component 01 (see Bug Fixes below) and ran it to
   completion, fixing every finding.

---

## Bugs Found and Fixed

### Re-verified from the prior review pass (still fixed, confirmed correct)
1. **`auth.controller.js` login company-approval bypass** — `login()` now
   correctly reads `companyProfile.approvalStatus` (camelCase, as returned
   by the model) instead of the non-existent `companyProfile.approval_status`,
   so pending/rejected companies are correctly blocked from logging in.
2. **`internship.controller.js` create-internship false rejection** —
   `createInternship()` now correctly reads `companyProfile.approvalStatus`
   instead of the non-existent `companyProfile.approval_status`, so
   admin-approved companies can actually create internship postings.

### New in this pass
3. **`server/config/env.js` — `DB_CONNECTION_LIMIT` was never wired up.**
   `config/db.js` reads `env.db.connectionLimit || 10`, but `env.js` never
   populated `db.connectionLimit` from `process.env.DB_CONNECTION_LIMIT` at
   all. The connection pool silently always used the hardcoded fallback of
   `10`, regardless of what an operator configured — masked in local
   development only because the shipped `.env` happened to also set it to
   `10`. **Fixed** by reading and parsing the variable in `env.js`; also
   documented the variable in `server/.env.example` (it existed in `.env`
   but was undocumented in the template).
4. **`client/src/pages/admin/Internships.jsx` — invisible "Flagged" badge.**
   The status-badge map used `bg-orange text-white` for the `flagged`
   status. `bg-orange` is not a real Bootstrap 5 class and was never
   defined anywhere in the project's CSS, so the badge rendered with no
   background and white text — invisible against the table. **Fixed** by
   switching to the valid, visually distinct `bg-info text-dark`.

### Tooling gap found and fixed
5. **No ESLint configuration existed anywhere in `client/`.** Despite
   `eslint` and its React plugins being declared as devDependencies since
   Component 01, and every component's Testing Checklist claiming
   `npm run lint` passes, there was no `.eslintrc`/`eslint.config.*` file,
   so the command failed immediately with a "couldn't find a configuration
   file" error — it could never have actually been run successfully.
   **Fixed** by adding `client/.eslintrc.cjs`. Running it for the first
   time surfaced four small, genuine issues, all fixed in this pass:
   - An unused `eslint-disable-next-line no-alert` comment in
     `ManagePostings.jsx` (removed).
   - An unescaped apostrophe in `SavedInternships.jsx` (`react/no-unescaped-entities`,
     fixed with `&apos;`).
   - Two `useEffect` hooks (`admin/Companies.jsx`, `admin/Users.jsx`) with
     incomplete dependency arrays (`react-hooks/exhaustive-deps`) — fixed
     by wrapping the called functions in `useCallback` and depending on
     them properly, with no change in actual refetch behavior.
   - `AuthContext.jsx`'s intentional co-location of `AuthContext` and
     `AuthProvider` in one file trips a Fast-Refresh-only warning — resolved
     with a single, comment-justified targeted disable rather than
     restructuring the file layout established in Component 05.

### Minor cleanup (no functional impact)
6. Removed `server/check_tables_tmp.js`, an undocumented, ad hoc debug
   script that was never part of the documented architecture.
7. Removed a stale comment in `server/routes/index.js` incorrectly
   describing five fully-implemented routers as "reserved placeholders."
8. Confirmed `client/src/services/internshipService.js`'s default export
   now includes every named export (previously missing `getPublishedInternships`,
   noted but not required to fix in the prior pass since no consumer used
   the default import).

---

## Testing Performed

### Backend
- [x] Every `.js` file under `server/` (excluding `node_modules`) passes
      `node --check` with zero syntax errors.
- [x] `npm install` completes cleanly in `server/`.
- [x] `server/app.js` boots via `require('./app.js')` with no import/require
      errors and no live database connection required.
- [x] `GET /health` returns `200 { success: true, message: "Server is healthy", data: null }`.
- [x] `GET /api/v1/does-not-exist` returns `404` with the standard error
      envelope and a descriptive message.
- [x] Every route file's middleware chain (`authenticate` → `authorize` →
      validator → `validateRequest` → controller) manually traced for all
      11 route files; no missing steps, no incorrect route ordering
      (static paths like `/my`, `/unread-count`, `/read-all` all correctly
      declared before their colliding dynamic `:id` siblings).
- [x] Every model export name cross-checked against every controller call
      site — 100% match across all nine model files.
- [x] Every camelCase field a controller or the frontend reads from a
      model result cross-checked against that model's actual mapping
      function — no mismatches remaining beyond the two already-fixed
      critical bugs.

### Frontend
- [x] `npm install` completes cleanly in `client/`.
- [x] `npm run build` completes with zero errors (151 modules transformed).
- [x] `npm run lint` completes with zero errors and zero warnings (first
      time this has been achievable in the project's history — see Bug
      Fixes #5 above).
- [x] Every route declared in `AppRoutes.jsx` resolves to an existing page
      component, correctly nested under the right `ProtectedRoute`/`RoleRoute`
      guard.
- [x] Every service function's endpoint path and response-unwrapping shape
      cross-checked against its corresponding backend controller's actual
      response envelope, across all eight service files.
- [x] Every `bg-*` Bootstrap utility class used anywhere in `client/src`
      confirmed to be a real Bootstrap 5.3 class after fixing Bug #4.

### Authentication & Authorization
- [x] Confirmed (per prior pass, re-verified) that pending/rejected
      companies cannot log in.
- [x] Confirmed `authenticate` re-validates the user still exists and is
      active on every request (not just at token-issue time).
- [x] Confirmed `authorize(...roles)` and per-resource ownership checks are
      present on every write endpoint that needs them (internship
      edit/delete, application status update, notification read/delete,
      resume/logo access).
- [x] Confirmed admin-only endpoints (`/admin/*`) are unreachable without
      the `admin` role, and that admins cannot deactivate/delete their own
      account.

### CRUD & File Upload
- [x] Confirmed the full internship lifecycle (create → publish → close →
      hard-delete-if-no-applications / soft-delete-to-`removed`-otherwise)
      is implemented and enforced correctly end-to-end.
- [x] Confirmed the application lifecycle state machine
      (`applied → under_review → shortlisted → accepted|rejected`, plus
      student-only `withdrawn`) rejects invalid/backward transitions.
- [x] Confirmed resume/logo upload MIME-type and size validation happens
      before any file is written to disk, and that stored filenames are
      random UUIDs, never the original client-supplied name.
- [x] Confirmed resume access control: student owner, admin, or a company
      whose posting the student applied to — no one else.

---

## Files Changed in This Component

| File | Change |
|---|---|
| `server/config/env.js` | Added `DB_CONNECTION_LIMIT` wiring to the `db` config object (Bug #3). |
| `server/.env.example` | Documented the previously-undocumented `DB_CONNECTION_LIMIT` variable. |
| `server/routes/index.js` | Removed a stale, misleading comment (cleanup #7). |
| `server/check_tables_tmp.js` | Deleted — stray debug script (cleanup #6). |
| `client/.eslintrc.cjs` | **New** — ESLint configuration that never existed (Bug #5). |
| `client/src/pages/admin/Internships.jsx` | Fixed invalid `bg-orange` class (Bug #4). |
| `client/src/pages/admin/Companies.jsx` | Wrapped `loadPending` in `useCallback`; completed `useEffect` deps. |
| `client/src/pages/admin/Users.jsx` | Wrapped `loadUsers` in `useCallback`; completed `useEffect` deps. |
| `client/src/pages/company/ManagePostings.jsx` | Removed unused `eslint-disable` comment. |
| `client/src/pages/student/SavedInternships.jsx` | Escaped an apostrophe for `react/no-unescaped-entities`. |
| `client/src/context/AuthContext.jsx` | Added one targeted, justified `eslint-disable` for the Fast Refresh warning. |
| `docs/reviews/review.md` | Updated with this pass's full findings. |
| `docs/Components/16_Testing_Final_Review.md` | This document (new). |

No other files required changes — every other file read in this pass
(70+ backend and frontend files) was confirmed correct as-is.

---

## Database Changes

None. This component is verification-only and touches no schema, migration,
or seed data.

---

## Known, Accepted Limitations (carried forward, not regressions)

These were already documented as intentional scope boundaries by the
components that introduced them, and remain out of scope for Component 16:

- No automated test suite (unit/integration/E2E) exists yet — Component 16
  in `Project_Components.md` is a manual review/testing pass, not the
  introduction of a testing framework.
- No rate limiting on `/auth/login` / `/auth/register` — documented as an
  outstanding hardening item since Component 05.
- Company access to applicant resumes depends on an active application to
  that company's posting, exactly as implemented in Component 11 — this
  was verified correct, not changed.
- Two database views (`view_applicant_details`, `view_student_application_history`)
  remain defined but unused, as noted since Component 02 — harmless, and
  left as-is per "don't change working code unnecessarily."

---

*End of Document — 16_Testing_Final_Review.md*
