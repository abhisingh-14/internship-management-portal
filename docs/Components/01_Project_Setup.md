# Project Setup

## Objective

This component establishes the complete foundational project structure for
the Internship Management Portal — a monorepo containing an independently
deployable React frontend (`client/`) and Express backend (`server/`).

The purpose of this component is strictly infrastructural: it creates the
folder architecture, tooling, environment configuration, and minimal
bootstrap code required for both applications to install their
dependencies and run successfully, without implementing any authentication,
database schema, business logic, API endpoints, or page content. All
subsequent components (Authentication, Database Design, Core Backend
Modules, Frontend Role Dashboards, etc.) build directly on top of the
structure defined here.

This component directly implements Phase 1 ("Planning & Architecture") and
the initial scaffolding portion of Phase 2 ("Backend Foundation") /
Phase 5 ("Frontend Foundation") from the roadmap defined in
`docs/00_Project_Overview.md`.

---

## Features Implemented

- Monorepo structure with two independently deployable applications:
  `client/` (React SPA) and `server/` (Express REST API), plus a shared
  root-level `docs/` folder.
- Backend MVC folder skeleton: `routes/`, `middleware/`, `controllers/`,
  `models/`, `validators/`, `utils/`, `config/`, `uploads/` (with
  `resumes/` and `logos/` subfolders), matching the architecture defined
  in `docs/04_Project_Architecture.md`.
- Frontend layered folder skeleton: `components/` (with `common/`,
  `student/`, `company/`, `admin/` subfolders), `pages/` (with `auth/`,
  `student/`, `company/`, `admin/`, `shared/` subfolders), `context/`,
  `services/`, `routes/`, `utils/`, `assets/`.
- Centralized, fail-fast environment variable loading and validation on
  the backend (`config/env.js`).
- MySQL connection pool setup with a startup connectivity check
  (`config/db.js`), without any table creation.
- Centralized Express error-handling middleware and a `404` fallback
  handler, returning the standard response envelope shape (without yet
  implementing typed error classes).
- `asyncHandler` utility to forward rejected promises from async route
  handlers to the centralized error handler.
- Central API router mount point (`routes/index.js`) with commented
  placeholders for every future resource router.
- Express application bootstrap (`app.js`) with CORS restricted to a
  configured client origin, JSON/URL-encoded body parsing, and a
  temporary `/health` endpoint for verifying server and database
  connectivity.
- Separate HTTP server bootstrap (`server.js`) that verifies the database
  connection before binding a port, and exits the process on startup
  failure.
- React application bootstrap using Vite, including `BrowserRouter`,
  global Bootstrap 5 CSS import, and a minimal global stylesheet reserved
  for brand-level CSS variable overrides only.
- Central Axios instance (`services/api.js`) reading its base URL from an
  environment variable, with interceptors intentionally deferred to the
  Authentication component.
- Central React Router configuration (`routes/AppRoutes.jsx`) with a
  single placeholder root route, with all real pages deferred to later
  components.
- Environment variable templates (`.env.example`) for both applications,
  documenting every variable required now and several reserved for
  upcoming components (JWT, file upload limits).
- Root-level `.gitignore` excluding dependencies, environment files,
  build output, logs, uploaded runtime files, and editor/OS artifacts
  across both applications.
- Root-level `README.md` documenting the tech stack, monorepo layout,
  setup instructions, and links to the project's reference documents.
- `.gitkeep` placeholders in every currently empty directory to preserve
  the intended folder structure in version control ahead of future
  components populating them.

---

## Folder Structure

```
internship-management-portal/
├── .gitignore
├── README.md
├── docs/
│   ├── 00_Project_Overview.md
│   ├── 01_Software_Requirements_Specification.md
│   ├── 02_Database_Design.md
│   ├── 03_API_Design.md
│   ├── 04_Project_Architecture.md
│   ├── 05_Coding_Standards.md
│   └── Components/
│       └── 01_Project_Setup.md
│
├── client/
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       ├── assets/                (.gitkeep)
│       ├── components/
│       │   ├── common/            (.gitkeep)
│       │   ├── student/           (.gitkeep)
│       │   ├── company/           (.gitkeep)
│       │   └── admin/             (.gitkeep)
│       ├── context/                (.gitkeep)
│       ├── pages/
│       │   ├── auth/               (.gitkeep)
│       │   ├── student/            (.gitkeep)
│       │   ├── company/            (.gitkeep)
│       │   ├── admin/              (.gitkeep)
│       │   └── shared/             (.gitkeep)
│       ├── routes/
│       │   └── AppRoutes.jsx
│       ├── services/
│       │   └── api.js
│       └── utils/                  (.gitkeep)
│
└── server/
    ├── .env
    ├── .env.example
    ├── package.json
    ├── package-lock.json
    ├── app.js
    ├── server.js
    ├── config/
    │   ├── db.js
    │   └── env.js
    ├── controllers/                (empty — reserved)
    ├── middleware/
    │   └── errorHandler.js
    ├── models/                     (empty — reserved)
    ├── routes/
    │   └── index.js
    ├── utils/
    │   └── asyncHandler.js
    ├── validators/                 (empty — reserved)
    └── uploads/
        ├── resumes/                (empty — reserved, gitignored)
        └── logos/                  (empty — reserved, gitignored)
```

---

## Files Created

### Root

| File | Purpose |
|------|---------|
| `.gitignore` | Excludes `node_modules/`, `.env` files, build output, logs, uploaded runtime files, and editor/OS artifacts from version control across both apps. |
| `README.md` | Documents the tech stack, monorepo structure, prerequisites, and setup/run instructions for new contributors. |

### Backend (`server/`)

| File | Purpose |
|------|---------|
| `server/package.json` | Declares backend dependencies (`express`, `mysql2`, `cors`, `dotenv`, and stack-approved packages reserved for later use: `bcrypt`, `jsonwebtoken`, `express-validator`, `multer`) and npm scripts (`start`, `dev`). |
| `server/.env.example` | Template documenting every environment variable required by the backend, including variables reserved for the upcoming Authentication and File Upload components. |
| `server/config/env.js` | Loads `.env` via `dotenv`, validates that all required variables are present at startup, and exports a single structured `env` config object used throughout the backend. |
| `server/config/db.js` | Creates and exports the MySQL connection pool (via `mysql2/promise`) and a `testConnection()` helper used to verify connectivity at server startup. |
| `server/middleware/errorHandler.js` | Centralized Express error-handling middleware mapping thrown/forwarded errors to the standard JSON error envelope, plus a `notFoundHandler` for unmatched routes. |
| `server/utils/asyncHandler.js` | Higher-order function that wraps async route/controller handlers so rejected promises are automatically forwarded to `next(error)`. |
| `server/routes/index.js` | Central API router. Currently mounts nothing; contains commented placeholders for every future resource router. |
| `server/app.js` | Configures the Express app instance: CORS (restricted to `CLIENT_ORIGIN`), JSON/URL-encoded body parsing, a temporary `/health` endpoint, the `/api/v1` router mount, the 404 handler, and the centralized error handler. |
| `server/server.js` | HTTP server bootstrap. Verifies the database connection via `testConnection()`, then starts listening on `PORT`; exits the process with a logged error if startup fails. |
| `server/controllers/.gitkeep` | Placeholder preserving the empty `controllers/` directory in version control. |
| `server/models/.gitkeep` | Placeholder preserving the empty `models/` directory in version control. |
| `server/validators/.gitkeep` | Placeholder preserving the empty `validators/` directory in version control. |
| `server/uploads/resumes/.gitkeep` | Placeholder preserving the empty, gitignored `uploads/resumes/` directory structure. |
| `server/uploads/logos/.gitkeep` | Placeholder preserving the empty, gitignored `uploads/logos/` directory structure. |

### Frontend (`client/`)

| File | Purpose |
|------|---------|
| `client/package.json` | Declares frontend dependencies (`react`, `react-dom`, `react-router-dom`, `axios`, `bootstrap`) and dev tooling (`vite`, ESLint), plus npm scripts (`dev`, `build`, `preview`, `lint`). |
| `client/.env.example` | Template documenting the `VITE_API_BASE_URL` environment variable used by the Axios service layer. |
| `client/index.html` | Vite's HTML entry point; mounts the React app at `#root` and loads `src/main.jsx`. |
| `client/vite.config.js` | Vite build/dev-server configuration, registering the React plugin and setting the dev server port to `5173`. |
| `client/src/main.jsx` | React application entry point. Renders `<App />` inside `React.StrictMode` and `BrowserRouter`, and imports Bootstrap's global CSS and the project's global stylesheet. |
| `client/src/App.jsx` | Root application component. Currently renders only `<AppRoutes />`; reserved as the composition point for global providers (e.g. `AuthContext`) in later components. |
| `client/src/index.css` | Minimal global stylesheet reserved for brand-level CSS variable overrides only, per the Bootstrap-only styling constraint. |
| `client/src/routes/AppRoutes.jsx` | Central React Router configuration. Currently defines a single placeholder route at `/`; will hold all public/protected/role-guarded routes once pages exist. |
| `client/src/services/api.js` | Central Axios instance configured with `baseURL` read from `VITE_API_BASE_URL`. Interceptors (auth header attachment, response unwrapping, global 401 handling) are deferred to the Authentication component. |
| `client/src/assets/.gitkeep` | Placeholder preserving the empty `assets/` directory in version control. |
| `client/src/components/common/.gitkeep` | Placeholder preserving the empty `components/common/` directory. |
| `client/src/components/student/.gitkeep` | Placeholder preserving the empty `components/student/` directory. |
| `client/src/components/company/.gitkeep` | Placeholder preserving the empty `components/company/` directory. |
| `client/src/components/admin/.gitkeep` | Placeholder preserving the empty `components/admin/` directory. |
| `client/src/context/.gitkeep` | Placeholder preserving the empty `context/` directory, reserved for `AuthContext.jsx`. |
| `client/src/pages/auth/.gitkeep` | Placeholder preserving the empty `pages/auth/` directory. |
| `client/src/pages/student/.gitkeep` | Placeholder preserving the empty `pages/student/` directory. |
| `client/src/pages/company/.gitkeep` | Placeholder preserving the empty `pages/company/` directory. |
| `client/src/pages/admin/.gitkeep` | Placeholder preserving the empty `pages/admin/` directory. |
| `client/src/pages/shared/.gitkeep` | Placeholder preserving the empty `pages/shared/` directory. |
| `client/src/utils/.gitkeep` | Placeholder preserving the empty `utils/` directory. |

---

## Files Modified

None. This is the initial component; no pre-existing files existed to modify.

---

## Dependencies Used

### Backend (`server/package.json`)

| Package | Type | Reason |
|---------|------|--------|
| `express` | dependency | Core HTTP server and routing framework for the REST API. |
| `mysql2` | dependency | MySQL driver with Promise support, used to create the connection pool in `config/db.js`. |
| `cors` | dependency | Enables restricted cross-origin requests from the React client to the API. |
| `dotenv` | dependency | Loads environment variables from `.env` into `process.env` for `config/env.js`. |
| `bcrypt` | dependency | Reserved for password hashing; declared now per the approved stack, wired up in the Authentication component. |
| `jsonwebtoken` | dependency | Reserved for JWT issuing/verification; wired up in the Authentication component. |
| `express-validator` | dependency | Reserved for request validation schemas; wired up starting with the first component that accepts user input. |
| `multer` | dependency | Reserved for resume/logo file uploads; wired up in the File Upload component. Pinned to the `1.4.5-lts.x` line per the approved stack; **not** upgraded to Multer 2.x without explicit sign-off, due to breaking API changes. |
| `nodemon` | devDependency | Auto-restarts the server on file changes during local development (`npm run dev`). |

### Frontend (`client/package.json`)

| Package | Type | Reason |
|---------|------|--------|
| `react`, `react-dom` | dependency | Core UI library, pinned to React 19 per the approved stack. |
| `react-router-dom` | dependency | Client-side routing; powers `AppRoutes.jsx` and all future page navigation. |
| `axios` | dependency | HTTP client used exclusively through `services/api.js` for all backend communication. |
| `bootstrap` | dependency | Sole CSS/styling framework for the entire frontend, per the design constraint in the SRS. |
| `vite`, `@vitejs/plugin-react` | devDependency | Build tool and dev server for the React application. |
| `eslint` + React ESLint plugins | devDependency | Static analysis/linting for the frontend codebase (`npm run lint`). |
| `@types/react`, `@types/react-dom` | devDependency | Editor/tooling type support for React APIs (no TypeScript compilation is used). |

---

## Database Changes

No database changes. No tables, columns, indexes, or constraints are created in this component. `server/config/db.js` establishes a connection pool and a startup connectivity check only; it does not create, alter, or seed any schema. Table creation is explicitly deferred to the Database Design implementation component, per `docs/02_Database_Design.md`.

---

## API Endpoints

No business APIs implemented in this component.

One non-business, temporary diagnostic endpoint was added to support setup verification:

#### `GET /health`
- **URL:** `/health` (not versioned under `/api/v1`, as it is infrastructure-only)
- **Method:** `GET`
- **Authentication Required:** No
- **Request Body:** None
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Server is healthy" }
  ```
- **Error Responses:** None defined; this endpoint has no failure path other than the server being unreachable.

All resource endpoints defined in `docs/03_API_Design.md` (Auth, Students, Companies, Internships, Applications, Bookmarks, Notifications, Admin, Analytics) remain unimplemented. `server/routes/index.js` contains only commented mount points reserved for these routers.

---

## Frontend Components

| Component/Page | File | Description |
|------------------|------|--------------|
| `App` | `client/src/App.jsx` | Root component; renders `AppRoutes`. No UI logic yet. |
| `AppRoutes` | `client/src/routes/AppRoutes.jsx` | Route configuration component; defines a single placeholder route at `/`. |

No reusable UI components (`common/`, `student/`, `company/`, `admin/`) and no page components (`auth/`, `student/`, `company/`, `admin/`, `shared/`) were created — only their containing folders were scaffolded via `.gitkeep` placeholders, reserved for future components.

---

## Backend Components

| Layer | File | Description |
|-------|------|--------------|
| Config | `server/config/env.js` | Loads and validates environment variables; exports structured config. |
| Config | `server/config/db.js` | Creates the MySQL connection pool; exposes `testConnection()`. |
| Middleware | `server/middleware/errorHandler.js` | Exposes `errorHandler` (centralized error-to-envelope mapping) and `notFoundHandler` (404 responses). |
| Utility | `server/utils/asyncHandler.js` | Exposes `asyncHandler(fn)`, wrapping async handlers for automatic error forwarding. |
| Routes | `server/routes/index.js` | Central router; currently mounts no resource routers. |
| App bootstrap | `server/app.js` | Assembles global middleware and mounts the router; exported for future testability (e.g. with Supertest). |
| Server bootstrap | `server/server.js` | Verifies DB connectivity and starts the HTTP listener. |

No Controllers, Models, or Validators were created in this component — their directories exist but are empty, reserved for the components that introduce actual resources (e.g., Authentication, Internship Management).

---

## Security Considerations

- **CORS is restricted**, not wildcarded: `server/app.js` configures `cors()` with `origin: env.clientOrigin`, read from the `CLIENT_ORIGIN` environment variable, consistent with the "no wildcard in production" rule in `docs/05_Coding_Standards.md` §14.
- **No secrets are hardcoded.** All configuration (DB credentials, port, client origin, and reserved JWT/upload settings) is read exclusively through `server/config/env.js`, which fails fast at startup if required variables are missing.
- **`.env` files are excluded from version control** via the root `.gitignore`; only `.env.example` templates (with placeholder values) are tracked, for both `client/` and `server/`.
- **No sensitive data is exposed by the error handler.** `server/middleware/errorHandler.js` suppresses internal error messages in production (`NODE_ENV=production`), returning a generic `"Internal server error"` message instead of the raw error text, and never returns stack traces to the client.
- **Uploaded file storage is gitignored.** `server/uploads/resumes/*` and `server/uploads/logos/*` are excluded from version control (with `.gitkeep` files preserved), preventing accidental commit of user-submitted files once the File Upload component is implemented.
- No authentication, authorization, password hashing, JWT issuance, or input validation is implemented in this component — these are explicitly out of scope and are covered by the Authentication and subsequent validation-bearing components.

---

## Testing Checklist

- [ ] `cd server && npm install` completes with no unresolved peer dependency errors.
- [ ] `cd client && npm install` completes with no unresolved peer dependency errors.
- [ ] `server/.env` exists (copied from `.env.example`) with valid MySQL credentials and a `CLIENT_ORIGIN` matching the client's dev URL.
- [ ] `client/.env` exists (copied from `.env.example`) with `VITE_API_BASE_URL` pointing at the running backend.
- [ ] A MySQL database matching `DB_NAME` in `server/.env` exists (empty schema is sufficient at this stage).
- [ ] `cd server && npm run dev` starts nodemon, logs `Database connection established.`, and logs `Server running in development mode on port <PORT>` without crashing.
- [ ] Visiting `http://localhost:<PORT>/health` returns `200 OK` with `{ "success": true, "message": "Server is healthy" }`.
- [ ] Stopping MySQL (or using invalid DB credentials) causes `server.js` to log a connection failure and exit the process, rather than starting with a broken pool.
- [ ] `cd client && npm run dev` starts the Vite dev server on port `5173` without errors.
- [ ] Visiting `http://localhost:5173` renders the placeholder "Internship Management Portal" heading without console errors.
- [ ] Bootstrap's default styling is visibly applied (e.g., default font rendering matches Bootstrap's base stylesheet).
- [ ] `git status` from the **project root** shows `node_modules/`, `.env` (both apps), and `server/uploads/resumes|logos/*` as ignored, not untracked.
- [ ] All `.gitkeep`-only folders listed in this document exist in the working tree exactly as specified.

---

## Future Dependencies

Every subsequent component in the development roadmap (`docs/00_Project_Overview.md` §10) depends directly on this component:

- **Authentication component** — will populate `client/src/context/AuthContext.jsx`, add interceptors to `client/src/services/api.js`, implement `bcrypt`/`jsonwebtoken` usage already declared in `server/package.json`, and add the first entries to `server/controllers/`, `server/models/`, `server/routes/`, and `server/validators/`.
- **Database Design implementation component** — will use `server/config/db.js`'s connection pool to run schema migrations and create the tables defined in `docs/02_Database_Design.md`.
- **Core Backend Modules component** (Students, Companies, Internships, Applications) — will follow the 1:1:1 route/controller/model file mapping into the empty directories scaffolded here, and register new routers in `server/routes/index.js`.
- **Admin Module component** — will follow the same backend pattern for admin-specific endpoints.
- **Frontend Foundation / Role Dashboards components** — will populate the empty `components/` and `pages/` subfolders and expand `AppRoutes.jsx` with real public, protected, and role-guarded routes.
- **File Upload component** — will configure Multer (already declared as a dependency) and write into `server/uploads/resumes/` and `server/uploads/logos/`.

---

## Notes

- **Assumption:** The developer has a local or remote MySQL 8.x instance available and has created an empty database matching `DB_NAME` before starting the backend; this component does not provision or migrate any schema.
- **Assumption:** Node.js 18 LTS or later is installed, per the `engines` field in both `package.json` files.
- **Limitation:** The `/health` endpoint is a temporary diagnostic tool for verifying setup and is not part of the versioned `/api/v1` contract in `docs/03_API_Design.md`. It should be reviewed for removal or relocation (e.g., behind a monitoring-only route) before production deployment.
- **Limitation:** `server/middleware/errorHandler.js` does not yet classify errors by type (e.g., `NotFoundError`, `ConflictError`, `ValidationError`); it currently defaults all errors without an explicit `statusCode` to `500`. Typed error classes are expected to be introduced alongside the first component that throws business-logic errors.
- **Limitation:** `client/src/services/api.js` has no request/response interceptors yet; the `Authorization` header attachment, response envelope unwrapping, and global `401` handling described in `docs/04_Project_Architecture.md` §2 are deferred to the Authentication component.
- **Future improvement:** Once automated testing is introduced (per the Future Enhancements list in `docs/00_Project_Overview.md`), `server/app.js` is already structured to support Supertest-based integration tests, since it is exported separately from the port-binding logic in `server/server.js`.
- **Future improvement:** ESLint is configured on the frontend (`npm run lint`) but no corresponding lint tooling was configured for the backend in this component; this may be added in a future tooling/chore pass.
