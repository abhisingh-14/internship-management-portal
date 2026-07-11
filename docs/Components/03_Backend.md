# Backend Boilerplate

## Objective

This component completes the generic, resource-agnostic backend
architecture on top of `server/`'s skeleton from the Project Setup
component. It introduces typed, classifiable errors; a shared success-
response helper; a generic pagination utility; a generic Express
Validator result-handling middleware; and a structured logging utility —
the remaining infrastructural pieces required before any real resource
(students, companies, internships, applications, etc.) is implemented.

No authentication and no business logic are introduced in this
component, per `Project_Components.md`'s explicit exclusions for
Component 03.

---

## Features Implemented

- A small hierarchy of typed `ApiError` classes (`BadRequestError`,
  `UnauthorizedError`, `ForbiddenError`, `NotFoundError`,
  `ConflictError`, `ValidationError`, `InternalServerError`), so
  controllers and models can throw meaningful, classifiable errors
  instead of generic `Error` objects or string-matched messages.
- A rewritten centralized error-handling middleware
  (`server/middleware/errorHandler.js`) that classifies these typed
  errors, maps them to the correct HTTP status code and the standard
  error envelope from `docs/03_API_Design.md` §5, and suppresses
  internal error detail in production for unclassified (unexpected)
  errors.
- A shared success-response helper (`sendSuccess`) enforcing the
  standard `{ success, message, data, meta }` envelope from
  `docs/03_API_Design.md` §4 on every successful response.
- A generic pagination utility (`parsePaginationParams`,
  `buildPaginationMeta`) implementing the `page`/`limit` defaults and
  the `MAX_LIMIT` of 50 defined in `docs/03_API_Design.md` §3, ready for
  every future paginated list endpoint.
- A generic Express Validator result-handling middleware
  (`validateRequest`) that turns any resource's validator schema
  failures into a `ValidationError` (422, field-level `errors` array),
  per `docs/05_Coding_Standards.md` §10.
- A centralized Winston logger (`server/utils/logger.js`) with
  environment-driven verbosity (`debug` in development, `info` and
  above in production by default, overridable via `LOG_LEVEL`) and
  environment-driven format (human-readable in development, structured
  JSON in production), per `docs/05_Coding_Standards.md` §11.
- `server/app.js` and `server/server.js` updated to log exclusively
  through this logger instead of `console.log`/`console.error`.

---

## Folder Structure

```
internship-management-portal/
└── server/
    ├── package.json                    (modified — added winston)
    ├── app.js                          (modified — logger + sendSuccess)
    ├── server.js                       (modified — logger)
    ├── middleware/
    │   ├── errorHandler.js             (modified — typed error classification)
    │   └── validateRequest.js          (new)
    └── utils/
        ├── asyncHandler.js             (unchanged, from Project Setup)
        ├── apiError.js                 (new)
        ├── apiResponse.js              (new)
        ├── pagination.js               (new)
        └── logger.js                   (new)
```

---

## Files Created

| File | Purpose |
|------|---------|
| `server/utils/apiError.js` | Defines `ApiError` and its typed subclasses (`BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`, `ValidationError`, `InternalServerError`), each carrying its own HTTP status code so the centralized error handler never needs to string-match a message. |
| `server/utils/apiResponse.js` | Exposes `sendSuccess(res, options)`, the single shared way to send a successful response using the standard `{ success, message, data, meta }` envelope. |
| `server/utils/pagination.js` | Exposes `parsePaginationParams(query)` (returns sanitized `page`/`limit`/`offset`) and `buildPaginationMeta(page, limit, totalItems)` (returns the `meta` block for paginated responses), with `DEFAULT_PAGE = 1`, `DEFAULT_LIMIT = 10`, `MAX_LIMIT = 50`. |
| `server/utils/logger.js` | Configures and exports a single Winston logger instance used everywhere instead of `console.log`, with environment-driven level and format. |
| `server/middleware/validateRequest.js` | Generic middleware that reads the accumulated Express Validator result on `req` and forwards a `ValidationError` (with a `{ field, message }[]` array) to the error handler if any rule failed. |

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `server/middleware/errorHandler.js` | Rewritten to check `err instanceof ApiError`, use its `statusCode`/`errors`, log via `logger` (warn for 4xx, error for 5xx, including stack trace), and suppress internal detail for unclassified errors in production. | Component 01 shipped a minimal handler that defaulted every error without an explicit `statusCode` to 500 and used `console`-based logging; this was documented as a known limitation to be resolved once typed errors existed. |
| `server/app.js` | `/health` now uses `sendSuccess`; no more direct `console.log`. | Enforces the standard response envelope everywhere, including the diagnostic endpoint, and removes direct console usage per Coding Standards §11. |
| `server/server.js` | Startup success/failure messages now go through `logger.info`/`logger.error` instead of `console.log`/`console.error`. | Same logging-consistency rule; failure logs now include structured `stack`/`message` fields. |
| `server/package.json` | Added `winston` to `dependencies`. | Required by the new `server/utils/logger.js`. |

No changes were made to `server/config/env.js`, `server/config/db.js`, `server/routes/index.js`, `server/utils/asyncHandler.js`, or any file under `client/` — none required modification for this component.

---

## Database Changes

None. This component contains no models, migrations, or SQL of any kind.

---

## API Endpoints

None. No resource routes, controllers, or models are introduced. `server/routes/index.js` continues to mount nothing, exactly as left by the Project Setup component. The existing `GET /health` diagnostic endpoint is unchanged in behavior, only in implementation (now built on `sendSuccess`).

---

## Backend Components

| Layer | File | Description |
|-------|------|--------------|
| Utility | `server/utils/apiError.js` | Typed, classifiable error hierarchy. |
| Utility | `server/utils/apiResponse.js` | Shared success-response envelope helper. |
| Utility | `server/utils/pagination.js` | Shared pagination parsing/meta-building helper. |
| Utility | `server/utils/logger.js` | Centralized Winston logger. |
| Middleware | `server/middleware/validateRequest.js` | Generic Express Validator result handler. |
| Middleware | `server/middleware/errorHandler.js` | Centralized, typed-error-aware error handler and 404 fallback. |

No Controllers, Models, Routes, or Validators were added — `server/controllers/`, `server/models/`, and `server/validators/` remain empty and reserved, exactly as scaffolded by the Project Setup component, since populating them requires real resources and is explicitly out of scope here (see Components 05–13).

---

## Security Considerations

- **No internal detail leaks to clients.** Unclassified (unexpected) errors return a generic `"Internal server error"` message in production; stack traces and raw error text are logged server-side only, via `logger.error`, never included in the HTTP response.
- **Validation failures never expose internals.** `ValidationError` only ever carries the `{ field, message }` pairs produced by Express Validator schemas — never raw request bodies or query text.
- **Logs avoid sensitive data by construction.** The logger itself has no knowledge of request bodies or credentials; it only receives whatever a caller explicitly passes (e.g., `method`, `path`, `statusCode`, `stack`). Future components that log request-specific context must continue to exclude passwords, hashes, and tokens, per `docs/05_Coding_Standards.md` §11.
- **No new attack surface.** This component adds no new routes, no new user input handling, and no new database access — it is purely internal plumbing (errors, responses, pagination math, logging) consumed by future components.

---

## Testing Checklist

- [ ] `cd server && npm install` completes successfully and installs `winston` alongside the existing dependencies.
- [ ] `npm run dev` starts the server, logs `Database connection established.` and `Server running in development mode on port <PORT>` via the new colorized development log format (no raw `console.log` output).
- [ ] Visiting `http://localhost:<PORT>/health` still returns `200 OK` with `{ "success": true, "message": "Server is healthy", "data": null }`.
- [ ] Visiting an undefined route (e.g. `/api/v1/does-not-exist`) returns `404 Not Found` with the standard error envelope: `{ "success": false, "message": "Route not found: GET /api/v1/does-not-exist" }`.
- [ ] Temporarily throwing `new (require('./utils/apiError').ConflictError)('Test conflict')` from a test route returns `409 Conflict` with `{ "success": false, "message": "Test conflict" }` and no `errors` field.
- [ ] Temporarily throwing `new (require('./utils/apiError').ValidationError)([{ field: 'email', message: 'Invalid' }])` from a test route returns `422 Unprocessable Entity` with the `errors` array present.
- [ ] Setting `NODE_ENV=production` and throwing a plain, un-typed `Error('boom')` from a test route returns `500 Internal Server Error` with the generic message `"Internal server error"` (not `"boom"`), while the full message and stack still appear in the server-side log output.
- [ ] `parsePaginationParams({ page: '2', limit: '100' })` returns `{ page: 2, limit: 50, offset: 50 }` (limit correctly clamped to `MAX_LIMIT`).
- [ ] `parsePaginationParams({})` returns `{ page: 1, limit: 10, offset: 0 }` (defaults applied).
- [ ] Stopping MySQL still causes `server.js` to log a connectivity failure via `logger.error` and exit the process, exactly as before, now with structured log output instead of `console.error`.

---

## Future Dependencies

- **Authentication component** — will be the first to throw real `UnauthorizedError`/`ForbiddenError`/`ConflictError` instances (invalid credentials, duplicate email, deactivated account) and will use `validateRequest` on `/auth/register` and `/auth/login` validator schemas.
- **Core Backend Modules component** (Students, Companies, Internships, Applications) — every new model/controller will use `NotFoundError`/`ConflictError`/`ValidationError` for its business rules, `sendSuccess` for every successful response, and `parsePaginationParams`/`buildPaginationMeta` for every list endpoint (`GET /internships`, `GET /students/applications`, etc.).
- **Admin Module component** — will reuse the same error/response/pagination utilities for `GET /admin/users`, `GET /admin/companies/pending`, and moderation endpoints.
- **File Upload component** — Multer configuration will throw `BadRequestError` (via `validateRequest`-style handling or a dedicated Multer error adapter) for invalid MIME types or oversized files, funneling into the same centralized `errorHandler`.
- **Testing component** — the typed error classes and `sendSuccess`/pagination helpers give test suites stable, predictable response shapes to assert against.

---

## Notes

- **Assumption:** All previously generated files from the Project Setup and Database components are correct and unchanged except where explicitly listed in "Files Modified" above.
- **Design choice:** `ApiError` subclasses were grouped into a single file (`apiError.js`) rather than one file per class, since `docs/05_Coding_Standards.md` §1 permits grouping "small, tightly related named exports" in one module — seven one-line error classes did not warrant seven files.
- **Design choice:** The logger's `LOG_LEVEL` is read directly from `process.env.LOG_LEVEL` with an in-code default, rather than being added to `server/config/env.js`'s required-variable validation, so that this component does not need to modify the Project Setup component's environment loader/validator for an optional, non-critical setting.
- **Limitation:** No test files/framework are introduced here — automated test tooling is explicitly deferred to Component 16 (Testing) per `Project_Components.md`.
- **Limitation:** `server/models/`, `server/controllers/`, and `server/validators/` remain empty (`.gitkeep`-only) after this component; this is intentional, not an oversight, since populating them requires real resources.

---

*End of Document — 03_Backend.md*
