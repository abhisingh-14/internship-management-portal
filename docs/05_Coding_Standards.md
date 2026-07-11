# Coding Standards
## Internship Management Portal

**Document Version:** 1.0
**Status:** Approved for Development
**Related Documents:** `docs/00_Project_Overview.md`, `docs/01_Software_Requirements_Specification.md`, `docs/02_Database_Design.md`, `docs/03_API_Design.md`, `docs/04_Project_Architecture.md`

---

## Purpose

This document defines the mandatory coding standards for the Internship Management Portal. It exists so that any engineer — present or future — can read, review, and extend the codebase without guessing at conventions. These standards are binding for all contributors and are enforced during code review. Deviations require explicit justification and reviewer sign-off, not silent exceptions.

---

## 1. Project Structure Rules

- The project is a **monorepo** with two top-level applications, `client/` and `server/`, plus a shared `docs/` folder. No code is shared between `client/` and `server/` via relative imports across the boundary — if logic must be shared, it is duplicated deliberately or extracted into a published package, never imported across `../../client` / `../../server`.
- The backend strictly follows **MVC layering** as defined in `docs/04_Project_Architecture.md`: `routes/` → `middleware/` → `controllers/` → `models/`, with `validators/` and `utils/` as supporting layers. No layer may be skipped (e.g., a route must never call a model directly, bypassing its controller).
- The frontend strictly separates **pages** (route-level, data-orchestrating) from **components** (reusable, presentational) from **services** (all HTTP access) from **context** (global state), as defined in `docs/04_Project_Architecture.md`. A component must never import Axios or call `fetch` directly — it always goes through `services/`.
- Every backend resource (e.g., `internship`, `application`) must have a matching `route`, `controller`, and `model` file using the same base name. A resource is never split across mismatched file names.
- No business logic in route files. Routes only declare `METHOD path -> [middleware..., controller]`.
- No direct SQL in controllers. All SQL lives in `models/`.
- Configuration (DB credentials, JWT secret, port, upload limits, CORS origin) is never hardcoded. It is always read from `process.env` via `server/config/env.js`, which validates required variables exist at startup and fails fast if they don't.
- One default export per file for components, controllers, and models, unless a file explicitly groups small, tightly related named exports (e.g., a `utils/validators.js` helper file).
- Dead code, commented-out code blocks, and unused imports are not committed. If code is no longer needed, it is deleted — version control preserves history.

---

## 2. Folder Naming

- All folders use **lowercase, singular or plural nouns matching their contents** — never mixed casing.
- Backend top-level folders are **plural nouns** describing their content type: `controllers/`, `models/`, `routes/`, `middleware/`, `validators/`, `utils/`, `uploads/`.
- Frontend folders follow the same plural convention: `components/`, `pages/`, `services/`, `context/`, `routes/`, `utils/`, `assets/`.
- Role-scoped subfolders use the **lowercase role name** exactly as defined in the database `role` enum: `student/`, `company/`, `admin/`. Shared, role-agnostic content lives in `common/`.
- No spaces, underscores, or camelCase in folder names. Use `kebab-case` only if a folder name is inherently multi-word and not already covered by an existing convention (e.g., `saved-internships/` if a dedicated folder were ever needed, though the current design keeps this resource within existing `applications`-style folders).
- Folder depth should stay shallow and predictable — a maximum of three levels under `src/` or the resource-layer root before reaching a file, so any file's purpose is inferable from its path alone.

---

## 3. File Naming

### Backend

| File Type | Convention | Example |
|-----------|-----------|---------|
| Route | `<resource>.routes.js` | `internship.routes.js` |
| Controller | `<resource>.controller.js` | `internship.controller.js` |
| Model | `<resource>.model.js` | `internship.model.js` |
| Middleware | `<purpose>.js` (verb or noun, no suffix) | `authenticate.js`, `errorHandler.js` |
| Validator | `<resource>.validator.js` | `internship.validator.js` |
| Utility | `<purpose>.js` (camelCase, descriptive) | `generateToken.js`, `pagination.js` |
| Config | `<purpose>.js` | `db.js`, `env.js` |

### Frontend

| File Type | Convention | Example |
|-----------|-----------|---------|
| React component | `PascalCase.jsx` | `InternshipCard.jsx` |
| Page component | `PascalCase.jsx`, matches route intent | `MyApplications.jsx` |
| Context | `PascalCase` + `Context.jsx` | `AuthContext.jsx` |
| Service | `camelCase` + `Service.js` | `internshipService.js` |
| Utility | `camelCase.js` | `formatDate.js` |
| Non-component JS/config | `camelCase.js` | `constants.js` |

**Rules:**

- File names always match their primary export's name (e.g., `InternshipCard.jsx` exports `InternshipCard`).
- One React component per file. Small, tightly coupled sub-components used only by their parent may live in the same file, but anything reused elsewhere gets its own file.
- Test files mirror the file under test with a `.test.js`/`.test.jsx` suffix and live alongside the source file or in a parallel `__tests__/` folder, consistently across the codebase (pick one pattern per app and do not mix).

---

## 4. Component Naming

- React components are named in **PascalCase**, always nouns or noun phrases describing what they render, never what they do internally (`InternshipCard`, not `RenderInternshipItem`).
- Role-scoped components are **not** prefixed with the role name in the component name itself (the folder already conveys that) — e.g., `components/company/PostingForm.jsx` exports `PostingForm`, not `CompanyPostingForm`.
- Wrapper/guard components describe their behavior: `ProtectedRoute`, `RoleRoute`.
- Compound UI patterns use a clear parent-child naming relationship when split into multiple files: `ApplicantTable.jsx` + `ApplicantTableRow.jsx`, not `Table.jsx` + `Row.jsx`.
- Boolean-oriented display components (badges, statuses) are suffixed with their type: `ApplicationStatusBadge`, not `StatusThing`.
- Props are named for what they represent, not their type: `internship`, not `data` or `props1`.

---

## 5. Function Naming

- Functions are named as **verb + noun**, describing the action performed: `getInternships`, `createApplication`, `validateResumeFile`.
- **Controllers** follow the pattern `<verb><Resource>` matching the HTTP intent: `getInternshipById`, `createInternship`, `updateApplicationStatus`, `deleteNotification`.
- **Models** follow the pattern `<verb><Resource>` at the data-access level: `findPublishedInternships`, `insertApplication`, `updateStatus`. Model function names describe the query's intent, not the raw SQL operation (`findByEmail`, not `selectFromUsers`).
- **Middleware** functions are named for the concern they enforce, as a verb or noun phrase: `authenticate`, `authorize`, `validateRequest`, `handleUploadErrors`.
- **React event handlers** are prefixed `handle`: `handleSubmit`, `handleStatusChange`, `handleDeleteClick`.
- **Boolean-returning functions** are prefixed `is`, `has`, or `can`: `isTokenExpired`, `hasAppliedAlready`, `canEditPosting`.
- **Async functions** are not suffixed with `Async` — `async`/`await` usage is visible at the call site and in the function signature already; adding a suffix is redundant.
- Utility/helper functions are named for their single responsibility and avoid vague names like `handleData`, `process`, or `doStuff`.

---

## 6. Variable Naming

- Variables and function parameters use **camelCase** throughout both frontend and backend JavaScript.
- Constants that never change (config values, enum-like sets) use **UPPER_SNAKE_CASE**: `MAX_FILE_SIZE_MB`, `ALLOWED_RESUME_TYPES`, `TOKEN_EXPIRY`.
- Boolean variables are prefixed `is`, `has`, `can`, or `should`: `isLoading`, `hasResume`, `canPublish`.
- Arrays are named as plural nouns: `internships`, `applicants`, `notifications`. Singular items pulled from an array use the singular form: `internship`, `applicant`.
- Avoid single-letter variable names except for conventional, tightly-scoped loop indices (`i`, `j`) or well-understood shorthand in small callback scopes (`(err, req, res, next)` in Express middleware, which is an established Express convention and is preserved as-is).
- Avoid abbreviations that aren't broadly obvious (`internship`, not `intshp`; `application`, not `appln`). Well-known abbreviations are acceptable (`id`, `url`, `db`).
- Request/response objects always use Express's conventional names: `req`, `res`, `next`. Do not rename these.
- Do not reuse a variable name for a different type or purpose within the same function scope.

---

## 7. API Naming

These rules extend and enforce the standards already defined in `docs/03_API_Design.md`; this section restates them as binding conventions for implementation.

- All endpoint paths use **plural nouns** for resources: `/internships`, `/applications`, `/notifications`.
- Nested resources reflect real ownership, not arbitrary grouping: `/internships/:internshipId/applications`.
- No verbs in URLs. Actions are expressed via HTTP method, not path segments — `POST /applications`, not `POST /applications/create`. The one accepted exception is a small, fixed set of **state-transition sub-resources** already defined in the API spec (`PATCH /admin/companies/:companyId/approval`, `PATCH /admin/internships/:internshipId/moderate`, `PATCH /notifications/:notificationId/read`), where the sub-path names the specific state being transitioned, not a generic verb.
- Path parameters use **camelCase** and are descriptive, not generic: `:internshipId`, not `:id`, when there is any ambiguity about which resource the ID belongs to.
- Query parameters are always camelCase and consistent across endpoints: `page`, `limit`, `sort`, `search`, `status`, `unreadOnly`.
- Request and response body fields use **camelCase**, mapping to `snake_case` database columns only at the model/serialization boundary — this mapping never leaks into the API contract.
- Every new endpoint added during implementation must first be reflected in `docs/03_API_Design.md` before being built — the documented API is the source of truth, not the implementation.

---

## 8. SQL Naming

These rules extend the standards already defined in `docs/02_Database_Design.md`.

- Table names are **lowercase, plural, snake_case**: `users`, `internships`, `student_profiles`, `saved_internships`.
- Column names are **lowercase snake_case**: `password_hash`, `application_deadline`, `created_at`.
- Primary keys are always named `id`. Foreign keys are named `<singular_referenced_table>_id`: `company_id`, `internship_id`, `student_id`, `user_id`.
- Enum columns are named for the property they represent, not the word "type" or "status" alone when ambiguous across tables: `role`, `account_status`, `approval_status`, `status` (only when the table has exactly one status concept, e.g. `internships.status`, `applications.status`).
- Indexes follow the pattern `idx_<table>_<column(s)>`: `idx_internships_status`, `idx_applications_student_id`. Composite indexes list columns in query-priority order: `idx_notifications_user_id_is_read`.
- Unique constraints follow the pattern `uq_<table>_<column(s)>`: `uq_applications_internship_student`, `uq_saved_student_internship`.
- Foreign key constraints follow the pattern `fk_<table>_<referenced_table>`: `fk_internships_company`.
- All SQL keywords in raw `.sql` migration files are written in **UPPERCASE** (`SELECT`, `WHERE`, `CREATE TABLE`) for readability; identifiers remain lowercase.
- Migrations are named with a timestamp or sequential prefix plus a descriptive snake_case suffix: `20260101_001_create_users_table.sql`. Migrations are never edited after being merged and run in any shared environment — a correction is a new migration.

---

## 9. Error Handling Rules

- All backend errors resolve through the **single centralized error-handling middleware** defined in `docs/04_Project_Architecture.md` §13. No controller writes its own ad hoc error response shape.
- Controllers do not use `try/catch` to swallow errors silently. Async controllers are wrapped (via an `asyncHandler` utility or equivalent) so thrown/rejected errors are automatically forwarded to `next(error)`.
- Errors are thrown as typed/classed errors where practical (e.g., a `NotFoundError`, `ConflictError`, `ValidationError` with an associated status code) so the centralized handler can classify them without string-matching messages.
- Client-facing error messages are **human-readable and specific enough to act on**, but never expose stack traces, raw SQL, internal file paths, or library-specific error text in production.
- Every error response follows the exact envelope defined in `docs/03_API_Design.md` §5 — `success`, `message`, and `errors` only when there are field-level validation failures.
- HTTP status codes are chosen precisely per the table in `docs/03_API_Design.md` §6 — `401` for authentication failures, `403` for authorization failures, `404` for missing resources, `409` for conflicts, `422` for validation failures, `500` only for genuinely unexpected server faults.
- On the frontend, every service call site that can fail in a way the user should know about handles the rejected promise and surfaces a message via the shared alert/toast component — errors are never left as an unhandled promise rejection or a silent console log in production code paths.
- A top-level React Error Boundary catches unexpected render-time exceptions and shows a fallback UI; it is not used as a substitute for handling expected, recoverable errors at the point they occur.

---

## 10. Validation Rules

- **All input is validated server-side**, regardless of any client-side validation already performed — client-side validation is a UX convenience only and is never trusted as the security boundary, per the design constraint in `docs/01_Software_Requirements_Specification.md`.
- Every route that accepts a request body or file upload has a corresponding schema in `validators/`, applied as middleware before the controller executes.
- Validation rules are defined once per field, in the validator file for that resource, and reused across create/update variants where the rules are identical, rather than being redefined inline in multiple places.
- Validation failures always return `422 Unprocessable Entity` with the `errors` array format (`field`, `message`) defined in `docs/03_API_Design.md` §5 — never a generic `400` for field-level issues.
- File uploads are validated for MIME type and size **before** being written to disk, using Multer's file filter and limits configuration — never validated after the fact.
- Business-rule validation that requires a database lookup (e.g., "email must be unique," "student may not apply twice to the same posting") is validated at the application layer for a clear error message, and is additionally backed by a database-level constraint (`UNIQUE`) as a second line of defense against race conditions.
- On the frontend, forms provide immediate, field-level validation feedback before submission, mirroring (but never replacing) the server-side rules, per NFR 4.7 in the SRS.

---

## 11. Logging Rules

- The backend uses a single, consistent logging utility across the codebase (e.g., a configured Winston or Pino logger) — no direct `console.log` calls in committed application code, with the narrow exception of temporary local debugging that is removed before commit.
- Logs are categorized by level: `error` (unexpected failures, caught exceptions), `warn` (recoverable but noteworthy conditions, e.g., repeated failed login attempts), `info` (significant application events, e.g., server start, successful admin actions), and `debug` (verbose detail, enabled only in development).
- Every error logged server-side includes enough context to diagnose it (request method + path, relevant resource ID, error message and stack) but **never logs sensitive data**: no plaintext passwords, no password hashes, no full JWTs, no raw request bodies containing credentials.
- Logs intended for production are structured (JSON) so they can be ingested by log aggregation tooling, rather than free-form strings.
- Admin-triggered state changes (company approval/rejection, posting moderation, user activation/deactivation) are recorded both as an application log entry and as a persisted audit-log record (`admin_audit_logs`), per FR-ADM-06 — these serve different purposes and neither replaces the other.
- Log verbosity is environment-driven: verbose/debug logging is enabled in development only; production runs at `info` level and above by default, configurable via an environment variable.

---

## 12. Bootstrap Usage Guidelines

- **Bootstrap 5 is the only styling framework** used in this project, per the design constraint in `docs/01_Software_Requirements_Specification.md`. No additional CSS frameworks or utility-class libraries (e.g., Tailwind) are introduced.
- Layout is built using Bootstrap's grid system (`container`, `row`, `col-*`) rather than custom flex/grid CSS, unless Bootstrap's grid genuinely cannot express the required layout.
- Prefer Bootstrap's built-in components (`Modal`, `Card`, `Table`, `Badge`, `Form`, `Alert`, `Navbar`, `Pagination`) over custom-built equivalents. Custom components should wrap Bootstrap markup/classes rather than reinvent it.
- Custom CSS is kept minimal and scoped — either in a single small global stylesheet for truly global overrides (e.g., brand colors as CSS variables) or in a component-scoped CSS file, never as large blocks of inline `style` props.
- Responsive behavior is achieved through Bootstrap's breakpoint classes (`col-md-6`, `d-none d-lg-block`, etc.), tested at mobile, tablet, and desktop widths per NFR 4.7.
- Form validation states use Bootstrap's built-in validation classes (`is-invalid`, `invalid-feedback`) so client-side error display is visually consistent across every form in the app.
- Icons, if used, come from a single consistent icon set (chosen once, documented, and used everywhere) rather than mixing multiple icon libraries.

---

## 13. React Best Practices

- **Functional components only**, using Hooks. No class components anywhere in the codebase.
- Components remain small and single-purpose; if a component's JSX exceeds roughly 150–200 lines or it's handling more than one clear responsibility, it is split into smaller components.
- Data fetching happens in **pages**, not in reusable **components**; components receive data via props and remain easily testable/reusable in isolation.
- `useEffect` dependency arrays are always accurate and complete — no suppressing the exhaustive-deps lint rule without a documented reason in a comment.
- Derived values are computed during render (or memoized with `useMemo` when the computation is expensive), not duplicated into extra `useState` that must be kept in sync manually.
- Keys in list rendering are always a stable, unique identifier from the data (e.g., `internship.id`), never the array index, except for static lists that never reorder.
- Forms are controlled components; form state lives in the component (or a small custom hook), not read from the DOM.
- Side effects that depend on props/state changing are expressed through `useEffect` with correct dependencies — not triggered from event handlers in ways that duplicate effect logic.
- Shared logic across multiple components (e.g., pagination state, debounced search) is extracted into a custom hook (`useAuth`, `usePagination`, `useDebounce`) rather than copy-pasted.
- PropTypes or equivalent lightweight runtime/type checking is used for shared, reusable components to catch integration mistakes early.
- No direct DOM manipulation outside of `ref`-based patterns explicitly required by a third-party library.

---

## 14. Express Best Practices

- Every route handler is `async` and wrapped so errors are forwarded to the centralized error handler — never left to reject unhandled.
- Middleware order is deliberate and consistent across all route files: CORS → body parsing → route-specific `authenticate` → `authorize` → `validateRequest` → controller.
- Route files only wire paths to middleware/controllers; they contain no conditional logic, no data transformation, and no direct database access.
- Controllers do one thing: orchestrate a single use case. A controller function that grows to handle multiple unrelated responsibilities is split.
- Environment-specific behavior (e.g., verbose error output) is gated behind `process.env.NODE_ENV`, checked in one place (the error handler / app bootstrap), not scattered across the codebase.
- The Express app instance (`app.js`) and the HTTP server bootstrap (`server.js`) are kept separate, so the app can be imported and tested (e.g., with Supertest) without binding a real port.
- CORS is explicitly configured with an allow-list of origins read from environment variables — never a wildcard `*` in production.
- Rate limiting is applied to authentication endpoints (`/auth/login`, `/auth/register`) to mitigate brute-force and credential-stuffing attempts.
- Multer is configured once, centrally, with explicit file size limits and MIME-type filters, and is mounted only on the specific routes that need it — never globally on the app.

---

## 15. MySQL Best Practices

- All tables use the **InnoDB** storage engine and **`utf8mb4`** character set, per `docs/02_Database_Design.md`.
- All application-layer database access uses **parameterized queries / prepared statements**. String concatenation into SQL is never used, under any circumstance.
- Every model function selects **explicit columns**, never `SELECT *`, and never returns `password_hash` or other sensitive columns to the caller.
- Multi-step writes that must be atomic (status update + notification insert, company approval + audit log entry) are wrapped in an explicit transaction with proper `COMMIT`/`ROLLBACK` handling, including on error paths.
- Foreign keys are always declared with explicit `ON DELETE` / `ON UPDATE` behavior — never left to default — matching the cascade rules defined in the database design document.
- List queries are always paginated at the query level (`LIMIT`/`OFFSET`), never fetched in full and paginated in application memory.
- New indexes are added deliberately, based on the query patterns actually used by the API (as documented in `docs/02_Database_Design.md` §7), not speculatively.
- Schema changes are made exclusively through version-controlled migration files, never through manual, undocumented changes to a shared database.
- Database credentials are read from environment variables only; the connection pool is configured with a sane maximum size appropriate to the deployment environment.

---

## 16. Git Workflow

- The `main` branch always reflects a working, deployable state. Nothing is committed directly to `main`.
- All work happens on feature branches created from the latest `main`, merged back via Pull Request only.
- Pull Requests require at least one reviewer approval before merging, and all automated checks (lint, build, tests) must pass.
- Merges into `main` use **squash merge** by default, keeping `main`'s history one clean commit per feature/fix, with the PR title as the resulting commit message.
- Branches are deleted after merge to keep the repository clean.
- Large features are broken into small, reviewable Pull Requests rather than one large PR spanning multiple unrelated concerns.
- `.env` files are never committed. Only `.env.example` (with placeholder values and comments) is tracked in version control.
- Generated or environment-specific files (`node_modules/`, build output, uploaded files under `server/uploads/`) are excluded via `.gitignore` and never committed.

---

## 17. Commit Message Convention

Commit messages follow the **Conventional Commits** format:

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:**

| Type | Meaning |
|------|---------|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation-only changes |
| `style` | Formatting/whitespace changes with no code behavior change |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `test` | Adding or correcting tests |
| `chore` | Build process, tooling, or dependency changes |
| `perf` | Performance improvement |
| `security` | Security-related fix or hardening |

**Rules:**

- The scope names the affected module or resource: `feat(internship): add search and filter endpoint`, `fix(auth): correct token expiration check`.
- The short summary is written in the **imperative mood** ("add", not "added" or "adds"), lowercase, no trailing period, and under ~72 characters.
- The optional body explains *why* the change was made when it isn't obvious from the summary alone.
- Breaking changes are flagged with a `!` after the type/scope (`feat(api)!: change internship response shape`) and explained in the footer.
- Each commit represents one logical change. Unrelated changes (e.g., a formatting pass and a bug fix) are committed separately.

---

## 18. Branch Naming

Branches follow the pattern:

```
<type>/<short-kebab-case-description>
```

| Type | Usage | Example |
|------|-------|---------|
| `feature/` | New functionality | `feature/company-applicant-filtering` |
| `fix/` | Bug fixes | `fix/duplicate-application-race-condition` |
| `refactor/` | Non-behavioral restructuring | `refactor/extract-pagination-util` |
| `docs/` | Documentation changes | `docs/update-api-design` |
| `chore/` | Tooling, dependencies, config | `chore/upgrade-express-validator` |
| `hotfix/` | Urgent production fix, branched from `main` | `hotfix/jwt-expiry-bug` |

- Branch names are all lowercase, hyphen-separated, and descriptive enough to understand the change's purpose without opening the branch.
- Ticket/issue numbers, if used, are appended or prefixed consistently across the team (e.g., `feature/IMP-142-company-applicant-filtering`).

---

## 19. Code Review Checklist

Reviewers confirm each of the following before approving a Pull Request:

**Correctness & Design**
- [ ] The change does what the PR description says, and only that.
- [ ] MVC boundaries are respected — no business logic in routes, no SQL in controllers, no data fetching in reusable components.
- [ ] New endpoints match what's documented in `docs/03_API_Design.md` (or the doc was updated alongside the code).
- [ ] Naming follows the conventions in this document (files, functions, variables, routes, SQL identifiers).

**Validation & Error Handling**
- [ ] All new inputs are validated server-side via a validator schema.
- [ ] Errors are thrown/forwarded to the centralized error handler, using the correct HTTP status code.
- [ ] No sensitive data (passwords, hashes, tokens) is logged or returned in responses.

**Security**
- [ ] New/changed routes have correct `authenticate` and `authorize` middleware applied.
- [ ] Ownership checks are present wherever a user acts on a specific resource.
- [ ] All new SQL uses parameterized queries.
- [ ] File uploads (if any) validate type and size before writing to disk.

**Frontend**
- [ ] New components are placed in the correct folder (`common`/role-specific) and are appropriately reusable.
- [ ] Loading and error states are handled for every new data-fetching page.
- [ ] Bootstrap is used for styling; no unnecessary custom CSS or competing frameworks introduced.

**General Hygiene**
- [ ] No commented-out code, stray `console.log`s, or unused imports/variables.
- [ ] No secrets or environment-specific values hardcoded.
- [ ] Commit messages follow the Conventional Commits format.
- [ ] Tests (where applicable) cover the new behavior, including at least one failure/edge case.

---

## 20. Security Checklist

Before any Pull Request touching authentication, authorization, data access, or file handling is merged, confirm:

- [ ] Passwords are hashed with bcrypt before storage; plaintext passwords are never logged, stored, or returned in any response.
- [ ] JWTs contain only `userId`, `role`, and standard claims (`iat`, `exp`) — no additional PII.
- [ ] Every protected route passes through `authenticate` before any business logic executes.
- [ ] Every route enforces the correct role(s) via `authorize(...roles)`, matching the Role Access Summary in `docs/03_API_Design.md`.
- [ ] Ownership is verified for any endpoint acting on a specific resource (a company can only manage its own postings/applicants; a student can only manage their own applications/profile).
- [ ] All SQL queries are parameterized; no string concatenation builds a query.
- [ ] Sensitive columns (`password_hash`) are never selected into an API response.
- [ ] File uploads reject disallowed MIME types and oversized files before writing to disk, and stored filenames are unique and non-guessable.
- [ ] CORS is restricted to known origins in staging/production — no wildcard.
- [ ] Rate limiting is applied to authentication endpoints.
- [ ] No secrets, credentials, or `.env` files are committed to version control.
- [ ] Error responses in production never leak stack traces, SQL text, or internal file paths.
- [ ] Any new admin-privileged action is recorded in the audit log, per FR-ADM-06.

---

*End of Document — 05_Coding_Standards.md*
