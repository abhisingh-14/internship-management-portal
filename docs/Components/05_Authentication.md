# Authentication

## Objective

This component implements complete, production-ready authentication for
the Internship Management Portal, covering both backend and frontend.

On the backend, it provides Student/Company self-registration, login,
logout, JWT issuance (access + refresh tokens), bcrypt password hashing,
token verification, and reusable role-based authorization middleware — all
built strictly on top of the MVC skeleton, error-handling utilities, and
response/pagination helpers already established in the Project Setup and
Backend Boilerplate components.

On the frontend, it provides a global authentication state store
(`AuthContext`), session persistence and restoration across page reloads,
an Axios interceptor pipeline that automatically attaches tokens and
reacts to expired sessions, route guards for authenticated and
role-specific pages, and the Login/Register form pages themselves.

This component satisfies FR-AUTH-01 through FR-AUTH-06 and FR-STU-01 in
`docs/01_Software_Requirements_Specification.md`, and implements the
authentication endpoints, JWT usage rules, and authentication/authorization
flows documented in `docs/03_API_Design.md` §2, §7, §8.1 and
`docs/04_Project_Architecture.md` §6–§7. It is a prerequisite for every
subsequent component that introduces a protected or role-specific
endpoint or page.

---

## Features Implemented

**Backend**

- Self-registration for Student and Company accounts in a single endpoint,
  with role-specific profile creation (`student_profiles` /
  `company_profiles`) performed atomically alongside the `users` row.
- Admin accounts are intentionally excluded from public registration
  (FR-AUTH-01) — no code path in this component can create a `role:
  'admin'` user.
- Login with bcrypt password verification, deactivated-account rejection,
  and company-approval-status gating (a company whose `approval_status` is
  `pending` or `rejected` cannot log in, even with correct credentials).
- Stateless logout endpoint, reserved for future token-blacklisting since
  JWTs carry no server-side session.
- Access token (short-lived) and refresh token (long-lived) issuance on
  both register and login.
- Access-token renewal via a dedicated refresh-token endpoint.
- "Current user" endpoint for retrieving the authenticated identity from a
  valid token.
- `authenticate` middleware: verifies JWT signature and expiration,
  re-confirms the referenced user still exists and is active, and attaches
  a minimal `req.user` object for downstream use.
- `authorize(...roles)` middleware: generic, reusable role-based access
  control for any future protected route.
- Full server-side validation (Express Validator) for registration and
  login payloads, including conditional validation of `companyName` only
  when `role` is `company`.
- bcrypt password hashing with a configurable cost factor; password hashes
  are never selected into any API response.

**Frontend**

- `AuthContext` (Context API + `useReducer`) as the single global
  authentication state, per the "only one global context" rule in the
  architecture document.
- Automatic session restoration on page load/refresh by re-validating the
  stored token against the "current user" endpoint.
- `useAuth()` hook for ergonomic, guarded access to authentication state
  and actions from any component.
- Axios request interceptor that automatically attaches the stored access
  token to every outgoing API call.
- Axios response interceptor that normalizes all API errors into a
  consistent shape and broadcasts a global "unauthorized" signal on any
  `401` response, allowing `AuthContext` to clear the session without a
  direct dependency between the service layer and React state.
- `ProtectedRoute` — guards nested routes behind authentication, showing a
  loading state during session restoration and redirecting to the login
  page (preserving the originally requested destination) otherwise.
- `RoleRoute` — guards nested routes behind a specific set of allowed
  roles, redirecting to an "unauthorized" page otherwise.
- Login and Register pages with Bootstrap-styled forms, inline field-level
  validation error display sourced from the API's error response shape,
  and client-side checks (password strength, confirm-password match,
  conditional company name) as a UX convenience layered on top of — never
  a replacement for — server-side validation.
- Navbar updated to conditionally render Login/Register links versus a
  signed-in user greeting and Logout action.

---

## Folder Structure

```
internship-management-portal/
├── server/
│   ├── config/
│   │   └── env.js
│   ├── controllers/
│   │   └── auth.controller.js
│   ├── middleware/
│   │   ├── authenticate.js
│   │   └── authorize.js
│   ├── models/
│   │   ├── user.model.js
│   │   ├── studentProfile.model.js
│   │   └── companyProfile.model.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   └── index.js
│   ├── utils/
│   │   └── generateToken.js
│   ├── validators/
│   │   └── auth.validator.js
│   └── .env.example
│
└── client/
    └── src/
        ├── context/
        │   └── AuthContext.jsx
        ├── hooks/
        │   └── useAuth.js
        ├── services/
        │   ├── authService.js
        │   └── api.js
        ├── components/
        │   └── common/
        │       ├── ProtectedRoute.jsx
        │       ├── RoleRoute.jsx
        │       └── Navbar.jsx
        ├── pages/
        │   └── auth/
        │       ├── Login.jsx
        │       └── Register.jsx
        ├── routes/
        │   └── AppRoutes.jsx
        └── App.jsx
```

No new top-level directories were introduced. `server/models/`,
`server/controllers/`, `server/validators/`, and `client/src/pages/auth/`
were previously empty/`.gitkeep`-only placeholders from earlier components
and now hold their first real files.

---

## Files Created

| File | Purpose |
|------|---------|
| `server/utils/generateToken.js` | Signs and verifies short-lived access tokens and longer-lived refresh tokens, reading secrets and expiration windows from environment configuration. |
| `server/models/user.model.js` | All parameterized SQL access for the `users` table: insert a new user, find by email (safe columns), find by email including the password hash (login-only), find by id (safe columns). |
| `server/models/studentProfile.model.js` | Parameterized SQL access for `student_profiles`: insert a new profile row linked to a user, find a profile by user id. |
| `server/models/companyProfile.model.js` | Parameterized SQL access for `company_profiles`: insert a new profile row (defaulting to pending approval) linked to a user, find a profile by user id. |
| `server/validators/auth.validator.js` | Express Validator rule sets for registration, login, and refresh-token requests, including conditional validation of `companyName`. |
| `server/middleware/authenticate.js` | Verifies the Bearer token from the `Authorization` header, re-checks the referenced user's existence and account status, and attaches `req.user`. |
| `server/middleware/authorize.js` | Returns a middleware function that restricts a route to a given list of allowed roles, using `req.user.role` set by `authenticate`. |
| `server/controllers/auth.controller.js` | Orchestrates the five authentication use cases: register, login, refresh token, logout, get current user. Coordinates models, bcrypt, and token utilities, and shapes every response into the standard envelope. |
| `server/routes/auth.routes.js` | Declares the `/auth/*` route paths and attaches the correct validator, `validateRequest`, `authenticate` (where required), and controller function to each. |
| `client/src/context/AuthContext.jsx` | Global authentication state provider. Manages `user`, `token`, `role`, `isAuthenticated`, `isLoading`, `isSubmitting`, and `error`; exposes `register`, `login`, and `logout` actions; restores session on mount; listens for global unauthorized events. |
| `client/src/hooks/useAuth.js` | Convenience hook wrapping `useContext(AuthContext)`, throwing a clear development-time error if used outside an `AuthProvider`. |
| `client/src/services/authService.js` | Axios-based service functions for register, login, logout, get-current-user, and refresh-access-token, isolating all HTTP details from components. |
| `client/src/components/common/ProtectedRoute.jsx` | Route guard that renders a loading indicator during session restoration, redirects unauthenticated users to the login page (preserving their intended destination), and otherwise renders the nested route. |
| `client/src/components/common/RoleRoute.jsx` | Route guard that redirects to an "unauthorized" page if the current user's role is not in the allowed list for the nested route branch. |
| `client/src/pages/auth/Login.jsx` | Login page: email/password form, inline validation error display, redirect-after-login support. |
| `client/src/pages/auth/Register.jsx` | Registration page: role selection (Student/Company), conditional company name field, password confirmation, inline validation error display. |

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `server/config/env.js` | Added required-variable validation and structured config exports for `JWT_SECRET`, `JWT_EXPIRES_IN`, `JWT_REFRESH_SECRET`, `JWT_REFRESH_EXPIRES_IN`, and `BCRYPT_SALT_ROUNDS`. | These variables were declared as "reserved for upcoming components" during initial project setup but never actually loaded or validated. This is the first component that signs tokens and hashes passwords, so the fail-fast environment loader must know about them. |
| `server/.env.example` | Documented the five new variables above with placeholder values and comments. | Keeps the environment template in sync with what `env.js` now requires, so new environments can be configured correctly from the template alone. |
| `server/routes/index.js` | Mounted the new authentication router at the `/auth` path prefix. | This is the first resource router to exist; the central router previously contained only commented-out placeholders for future routers. |
| `client/src/services/api.js` | Added a request interceptor that attaches the stored access token as an `Authorization: Bearer` header on every outgoing request, and extended the existing response interceptor to broadcast a global "unauthorized" browser event whenever a `401` response is received. | The generic error-normalization behavior from the prior frontend boilerplate component intentionally deferred all authentication-specific interceptor logic to this component. |
| `client/src/components/common/Navbar.jsx` | Now reads authentication state and conditionally renders either Login/Register links or a signed-in user greeting with a Logout action. | The Navbar was originally built role-agnostic and auth-agnostic on purpose, since no authentication state existed yet; this change fulfills that documented follow-up. |
| `client/src/routes/AppRoutes.jsx` | Added public routes for the login and registration pages, and introduced an authenticated-only route branch (currently empty, reserved for role-guarded dashboard routes added by future components). | Establishes the routing structure that future role-specific dashboard components will attach to, without building any dashboard content prematurely. |
| `client/src/App.jsx` | Wrapped the application's route tree in the global authentication state provider. | Authentication state must be available to every page and component in the tree, including the Navbar and all route guards. |

No other previously created files required modification for this
component.

---

## Dependencies Used

| Package | Type | Reason |
|---------|------|--------|
| `bcrypt` | Backend dependency | Hashes and verifies user passwords. Declared during initial backend setup and first put to use in this component; no plaintext password is ever stored or compared. |
| `jsonwebtoken` | Backend dependency | Signs and verifies access and refresh JSON Web Tokens used for stateless authentication on every protected request. |
| `express-validator` | Backend dependency | Declares and enforces field-level validation rules for registration and login request bodies before any controller logic executes. |
| `express` | Backend dependency (existing) | Provides the router and middleware pipeline that the new authentication routes and middleware are built on. |
| `mysql2` | Backend dependency (existing) | Underlies the connection pool used by the new user/profile models to execute parameterized queries, including the transactional registration flow. |
| `axios` | Frontend dependency (existing) | HTTP client underlying the authentication service functions and the interceptor pipeline that attaches tokens and normalizes errors. |
| `react-router-dom` | Frontend dependency (existing) | Powers the new login/register routes and the `ProtectedRoute`/`RoleRoute` navigation guards (redirects, location-state preservation). |
| `prop-types` | Frontend dependency (existing) | Runtime prop validation on the new reusable guard components and the updated Navbar. |

No new npm packages were added in this component; `bcrypt`,
`jsonwebtoken`, and `express-validator` were already declared (but unused)
in the backend's dependency list from the initial project setup, and are
put into active use here for the first time.

---

## Database Changes

No database changes. This component reads from and writes to the
existing `users`, `student_profiles`, and `company_profiles` tables
exactly as defined by the database design component. No tables, columns,
indexes, or constraints were added, removed, or altered.

---

## API Endpoints

### `POST /api/v1/auth/register`

- **Authentication Required:** No
- **Request Body:**
  ```json
  {
    "role": "student",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "password": "SecurePass123!",
    "companyName": "TechCorp Inc."
  }
  ```
  `companyName` is required only when `role` is `"company"`; it is ignored
  for student registrations.
- **Success Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "user": { "id": 12, "name": "Jane Doe", "email": "jane.doe@example.com", "role": "student" },
      "token": "<access_token>",
      "refreshToken": "<refresh_token>"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — one or more fields failed validation (e.g. weak password, missing company name for a company account, invalid email format).
  - `409 Conflict` — the supplied email is already registered.

---

### `POST /api/v1/auth/login`

- **Authentication Required:** No
- **Request Body:**
  ```json
  { "email": "jane.doe@example.com", "password": "SecurePass123!" }
  ```
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": 12, "name": "Jane Doe", "email": "jane.doe@example.com", "role": "student" },
      "token": "<access_token>",
      "refreshToken": "<refresh_token>"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — missing or malformed email/password.
  - `401 Unauthorized` — email not found, or password does not match.
  - `403 Forbidden` — the account is deactivated, or the account is a company account that is still pending admin approval or has been rejected.

---

### `POST /api/v1/auth/refresh-token`

- **Authentication Required:** No (authenticated implicitly via the refresh token supplied in the request body)
- **Request Body:**
  ```json
  { "refreshToken": "<refresh_token>" }
  ```
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Token refreshed", "data": { "token": "<new_access_token>" } }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — `refreshToken` missing or not a string.
  - `401 Unauthorized` — the refresh token is invalid, expired, or refers to a user that no longer exists or has been deactivated.

---

### `POST /api/v1/auth/logout`

- **Authentication Required:** Yes
- **Request Body:** None
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Logged out successfully", "data": null }
  ```
- **Error Responses:**
  - `401 Unauthorized` — missing, invalid, or expired access token.

---

### `GET /api/v1/auth/me`

- **Authentication Required:** Yes
- **Request Body:** None
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "User retrieved",
    "data": { "id": 12, "name": "Jane Doe", "email": "jane.doe@example.com", "role": "student" }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized` — missing, invalid, or expired access token.
  - `404 Not Found` — the token is structurally valid but no longer refers to an existing user (edge case; guarded against separately in `authenticate` for the common case).

---

## Frontend Components

| Component/Page | Type | Description |
|------------------|------|--------------|
| `AuthProvider` (`AuthContext.jsx`) | Context provider | Owns and exposes all global authentication state and actions to the entire application. |
| `useAuth` | Custom hook | Ergonomic, guarded accessor for `AuthContext` from any component. |
| `ProtectedRoute` | Route guard component | Blocks unauthenticated access to nested routes; handles the session-restoration loading state. |
| `RoleRoute` | Route guard component | Blocks access to nested routes for users whose role is not in the allowed list. |
| `Login` | Page | Renders and handles the login form. |
| `Register` | Page | Renders and handles the registration form for both Student and Company account types. |

The Navbar component (`components/common/Navbar.jsx`) was not created in
this component but was significantly modified — see **Files Modified**
above.

---

## Backend Components

| Layer | File | Description |
|-------|------|--------------|
| Utility | `server/utils/generateToken.js` | Access/refresh token signing and verification. |
| Model | `server/models/user.model.js` | Data access for the `users` table. |
| Model | `server/models/studentProfile.model.js` | Data access for the `student_profiles` table. |
| Model | `server/models/companyProfile.model.js` | Data access for the `company_profiles` table. |
| Validator | `server/validators/auth.validator.js` | Field-level validation rules for register, login, and refresh-token requests. |
| Middleware | `server/middleware/authenticate.js` | JWT verification and `req.user` attachment. |
| Middleware | `server/middleware/authorize.js` | Role-based access control. |
| Controller | `server/controllers/auth.controller.js` | Business logic for all five authentication use cases. |
| Route | `server/routes/auth.routes.js` | HTTP path-to-middleware-to-controller wiring for `/auth/*`. |

---

## Security Considerations

- **Passwords are never stored or exposed in plaintext.** Only the bcrypt
  hash is persisted; every model query that returns user data to a
  controller excludes `password_hash` except for a single, narrowly
  scoped login query, and that hash is discarded immediately after
  comparison — it is never included in any API response.
- **JWT payloads are minimal.** Access and refresh tokens carry only a
  user identifier and role, with no additional personal information, so a
  leaked or intercepted token exposes the least possible data.
- **Authentication is re-verified per request, not just per token.** The
  authentication middleware confirms the referenced user still exists and
  is still active on every request, so deactivating a user immediately
  blocks further access even if their previously issued token has not yet
  expired.
- **Company accounts are gated on admin approval.** A company cannot log
  in while its approval status is pending or rejected, even with entirely
  correct credentials, enforcing the platform's verification requirement
  at the authentication layer rather than relying solely on downstream
  posting restrictions.
- **Registration is atomic.** The user account and its role-specific
  profile are created within a single database transaction; if either
  insert fails, both are rolled back, preventing orphaned user records
  without a corresponding profile.
- **All input is validated server-side**, independent of any client-side
  checks, using explicit field-level rules for every registration and
  login field, including conditional rules for company-only fields.
- **Generic authentication failure messaging.** Invalid email and invalid
  password both return the same generic "Invalid email or password"
  message, avoiding user-enumeration through differing error text.
- **Global session invalidation on any `401`.** The frontend listens for
  authorization failures from any API call — not just from the login form
  — and clears local session state and storage consistently, so an
  expired token cannot be left in a stale, partially-authenticated UI
  state.
- **Rate limiting on authentication endpoints is not yet implemented** and
  is called out explicitly as an outstanding item in **Notes** below.

---

## Testing Checklist

- [ ] Registering a new student with a valid payload succeeds and returns
      an access token, a refresh token, and the created user's public
      details.
- [ ] Registering a new company with a valid payload, including
      `companyName`, succeeds and the resulting company profile is created
      with a pending approval status.
- [ ] Registering with an email address that is already in use returns a
      conflict error and does not create a duplicate account.
- [ ] Registering with a password that does not meet the minimum strength
      requirements returns a validation error identifying the `password`
      field.
- [ ] Registering as a company without supplying a company name returns a
      validation error identifying the `companyName` field.
- [ ] Logging in with correct credentials for an active, approved account
      succeeds and returns a valid access token.
- [ ] Logging in with an incorrect password returns an authentication
      failure with a generic error message.
- [ ] Logging in as a company whose account is still pending approval is
      rejected with a clear, specific error message.
- [ ] Logging in as a deactivated account is rejected regardless of
      whether the supplied credentials are correct.
- [ ] Requesting the current-user endpoint without a token is rejected.
- [ ] Requesting the current-user endpoint with a valid token returns the
      correct identity and never includes the password hash.
- [ ] Requesting the current-user endpoint with an expired token returns a
      clear "token expired" error.
- [ ] Exchanging a valid refresh token for a new access token succeeds,
      and the newly issued access token is itself valid against the
      current-user endpoint.
- [ ] Logging out with a valid token succeeds.
- [ ] On the frontend, successfully registering or logging in updates the
      Navbar immediately to reflect the signed-in state.
- [ ] Refreshing the browser after a successful login preserves the
      signed-in session without requiring the user to log in again.
- [ ] Manually clearing the stored session and refreshing the browser
      returns the interface to its signed-out state.
- [ ] Attempting to visit a route guarded by the authentication guard
      while signed out redirects to the login page, and signing in
      successfully returns the user to the originally requested page.
- [ ] Submitting the registration form with mismatched password and
      confirm-password values is blocked client-side before any network
      request is made.

---

## Future Dependencies

- **Core Backend Modules component** (Students, Companies, Internships,
  Applications) — every new protected endpoint will reuse the
  authentication and authorization middleware introduced here exactly as
  built, and will read the authenticated user's identifier and role from
  the request context this component establishes.
- **Admin Module component** — admin-only endpoints will use the same
  role-based authorization middleware; since administrator accounts
  cannot be created through public registration, that component (or a
  dedicated provisioning step) remains responsible for how the first
  administrator account is created.
- **File Upload component** — resume and logo upload endpoints will be
  placed behind the same authentication and role-authorization middleware
  established here, restricted to the student and company roles
  respectively.
- **Frontend Role Dashboards component** — will nest role-guarded
  dashboard routes inside the authenticated route branch introduced in
  this component's routing configuration, and will rely on the global
  authentication state for both access control and rendering
  role-appropriate navigation and content.
- **Every future frontend data-fetching feature** — will automatically
  benefit from the token-attachment and session-expiration handling
  already wired into the shared HTTP client, without needing to duplicate
  that logic.

---

## Notes

- **Design decision — refresh token included in register/login
  responses.** The originally documented response examples for these two
  endpoints showed only an access token. Since a fully specified
  refresh-token endpoint already existed in the API design with no other
  documented mechanism for a client to obtain a refresh token, this
  component adds a `refreshToken` field alongside the existing, unchanged
  `user` and `token` fields so the refresh flow is actually usable
  end-to-end. This is an additive change only; no previously documented
  field was altered or removed.
- **Design decision — browser local storage for session persistence.**
  The strategy for persisting the session across page reloads was
  intentionally left open by earlier architecture planning. Local storage
  was chosen for simplicity and to survive full page reloads without
  requiring any server-side session state. This is a reasonable default
  but is not the only valid choice; switching to an httpOnly-cookie-based
  approach for stronger protection against script-based token theft would
  be a deliberate, coordinated change affecting the HTTP client
  configuration, the global state provider, and the backend's
  cross-origin and cookie handling together, and is noted here as a
  candidate future hardening step rather than an oversight.
- **Limitation — authentication endpoints are not yet rate-limited.**
  Project coding standards call for rate limiting on the login and
  registration endpoints to reduce brute-force and credential-stuffing
  risk. This was deliberately deferred rather than introducing a new,
  previously undeclared dependency without explicit sign-off; it should
  be treated as required hardening before any production deployment.
- **Limitation — no email verification step.** Given that email delivery
  infrastructure was documented as potentially unavailable in the initial
  release, newly registered accounts are considered active (for students)
  or pending admin review (for companies) immediately upon registration,
  with no confirmation-link step in between.
- **Limitation — refresh tokens are not rotated or revocable.** A valid
  refresh token remains usable for its entire configured lifetime; there
  is currently no server-side mechanism to invalidate a specific refresh
  token early (for example, upon suspected compromise) short of rotating
  the shared signing secret, which would invalidate all outstanding
  tokens at once. Supporting per-token revocation would require
  persisting issued refresh tokens, which is a larger, deliberate future
  change rather than an in-scope part of this component.
- **Assumption:** the backend's password-hashing, token-signing, and
  request-validation libraries were already declared as project
  dependencies by earlier setup work and required no new package
  installation to use in this component.
- **Assumption:** the frontend's HTTP client, routing, and prop-validation
  libraries were already declared as project dependencies by earlier
  setup work and required no new package installation to use in this
  component.

---

*End of Document — 05_Authentication.md*
