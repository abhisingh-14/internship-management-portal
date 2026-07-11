# API Design Specification
## Internship Management Portal

**Document Version:** 1.0
**Base URL (Development):** `http://localhost:5000/api/v1`
**Base URL (Production):** `https://api.internshipportal.com/api/v1`
**Related Documents:** `docs/00_Project_Overview.md`, `docs/01_Software_Requirements_Specification.md`, `docs/02_Database_Design.md`

---

## 1. API Standards

- **Naming convention:** Request/response bodies use `camelCase` field names (e.g., `resumeUrl`, `requiredSkills`, `applicationDeadline`), which map directly onto the `snake_case` columns defined in `docs/02_Database_Design.md` (e.g., `resume_url`, `required_skills`, `application_deadline`). This mapping is handled at the model/serialization layer and is noted per-resource below where it isn't a straightforward 1:1 transformation.

- The API follows **REST** architectural principles. Resources are represented as nouns; actions are expressed through HTTP methods.
- All endpoints are versioned under `/api/v1`.
- All request and response bodies use **JSON** (`Content-Type: application/json`), except file upload endpoints which use `multipart/form-data`.
- All endpoints are **stateless** — no server-side session is maintained; authentication is handled entirely via JWT on each request.
- Resource names in URLs are **plural nouns** (e.g., `/students`, `/internships`).
- Nested resources are expressed hierarchically where ownership is implied (e.g., `/internships/:internshipId/applications`).
- Filtering, sorting, and pagination are handled via query parameters, never via the request body, on `GET` requests.
- All timestamps are returned in **ISO 8601 UTC** format (e.g., `2026-07-11T10:30:00Z`).
- All list endpoints are **paginated** by default.
- All monetary/stipend values are represented as integers (smallest currency unit is avoided for simplicity; values represent whole currency amounts unless otherwise noted).

---

## 2. Authentication

- Authentication is handled via **JWT (JSON Web Tokens)**.
- Tokens are issued on successful login/registration and must be included on every protected request.
- Tokens are passed via the `Authorization` header using the `Bearer` scheme:

```
Authorization: Bearer <token>
```

- Tokens contain the following claims at minimum: `userId`, `role`, `iat` (issued at), `exp` (expiration).
- Access tokens expire after a configurable duration (default: **1 hour**).
- Refresh tokens (if enabled) expire after a longer duration (default: **7 days**) and are used solely to obtain new access tokens via `/auth/refresh-token`.
- Role-based authorization middleware validates the `role` claim against the permissions required for each endpoint, in addition to verifying the token's authenticity and expiration.

---

## 3. Request Format

- All request bodies must be valid JSON, except where `multipart/form-data` is explicitly required (file uploads).
- All requests must include the header:

```
Content-Type: application/json
```

- Query parameters are used for filtering, searching, sorting, and pagination on `GET` requests, using the pattern:

```
GET /internships?search=frontend&location=remote&page=1&limit=10&sort=-createdAt
```

- Sorting convention: prefix a field with `-` for descending order (e.g., `-createdAt`); no prefix means ascending.
- Pagination parameters:
  - `page` (default: `1`)
  - `limit` (default: `10`, max: `50`)

---

## 4. Response Format

All successful responses follow a consistent envelope:

```json
{
  "success": true,
  "message": "Resource retrieved successfully",
  "data": { },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5
  }
}
```

- `data` may be an object, an array, or `null`, depending on the endpoint.
- `meta` is included only for paginated list responses.
- Non-list endpoints omit the `meta` field entirely.

---

## 5. Error Format

All error responses follow a consistent structure:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email must be a valid email address"
    }
  ]
}
```

- `errors` is included only when there are field-level validation errors (e.g., from Express Validator). For non-validation errors (e.g., not found, unauthorized), `errors` is omitted and `message` describes the failure.
- Error messages are human-readable and never expose internal stack traces, SQL, or sensitive system details in production.

---

## 6. HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| `200 OK` | Success | Successful `GET`, `PUT`, `PATCH` requests |
| `201 Created` | Resource created | Successful `POST` that creates a resource |
| `204 No Content` | Success, no body | Successful `DELETE` |
| `400 Bad Request` | Invalid request | Malformed request, business rule violation |
| `401 Unauthorized` | Authentication failed | Missing, invalid, or expired token |
| `403 Forbidden` | Authorization failed | Valid token, but insufficient role/permissions |
| `404 Not Found` | Resource not found | Requested resource does not exist |
| `409 Conflict` | Conflict with current state | Duplicate application, duplicate email, etc. |
| `422 Unprocessable Entity` | Validation error | Field-level validation failures |
| `429 Too Many Requests` | Rate limit exceeded | Excessive requests from a client |
| `500 Internal Server Error` | Server fault | Unexpected server-side failure |

---

## 7. JWT Usage

- **Issuing:** JWTs are issued on `/auth/register` and `/auth/login` for Students and Companies. Admin tokens are issued only via `/auth/login` using pre-provisioned admin credentials.
- **Payload Claims:**
  ```json
  {
    "userId": 101,
    "role": "student",
    "iat": 1752230400,
    "exp": 1752234000
  }
  ```
- **Verification:** Every protected route passes through an `authenticate` middleware that verifies the token signature and expiration, then attaches the decoded payload to `req.user`.
- **Authorization:** A separate `authorize(...roles)` middleware checks `req.user.role` against the allowed roles for the route, returning `403 Forbidden` if the role is not permitted.
- **Expiration Handling:** Expired tokens return `401 Unauthorized` with `message: "Token has expired"`, prompting the client to re-authenticate or use the refresh token flow.
- **Logout:** Since JWTs are stateless, logout is handled client-side by discarding the token. The optional `/auth/logout` endpoint exists to support future token-blacklisting if introduced.

---

## 8. Endpoint Documentation

---

### 8.1 Authentication

#### `POST /auth/register`
- **Description:** Registers a new Student or Company account.
- **Authentication Required:** No
- **User Role:** Public
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
  *(`companyName` is required only when `role` is `"company"`; ignored otherwise.)*
- **Validation Rules:**
  - `role`: required, must be one of `student`, `company`.
  - `name`: required, string, 2–100 characters.
  - `email`: required, valid email format, must be unique.
  - `password`: required, minimum 8 characters, must include at least one letter and one number.
  - `companyName`: required if `role` is `company`, string, 2–150 characters.
- **Success Response:** `201 Created`
  ```json
  {
    "success": true,
    "message": "Account created successfully",
    "data": {
      "user": { "id": 12, "name": "Jane Doe", "email": "jane.doe@example.com", "role": "student" },
      "token": "<jwt>"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — validation failures.
  - `409 Conflict` — email already registered.

---

#### `POST /auth/login`
- **Description:** Authenticates a user and issues a JWT.
- **Authentication Required:** No
- **User Role:** Public
- **Request Body:**
  ```json
  { "email": "jane.doe@example.com", "password": "SecurePass123!" }
  ```
- **Validation Rules:**
  - `email`: required, valid email format.
  - `password`: required, non-empty string.
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Login successful",
    "data": {
      "user": { "id": 12, "name": "Jane Doe", "role": "student" },
      "token": "<jwt>"
    }
  }
  ```
- **Error Responses:**
  - `422 Unprocessable Entity` — validation failures.
  - `401 Unauthorized` — invalid credentials.
  - `403 Forbidden` — account deactivated, or company account pending approval.

---

#### `POST /auth/refresh-token`
- **Description:** Issues a new access token using a valid refresh token.
- **Authentication Required:** Yes (Refresh Token)
- **User Role:** Any authenticated
- **Request Body:**
  ```json
  { "refreshToken": "<refresh_token>" }
  ```
- **Validation Rules:**
  - `refreshToken`: required, non-empty string.
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Token refreshed", "data": { "token": "<new_jwt>" } }
  ```
- **Error Responses:**
  - `401 Unauthorized` — invalid or expired refresh token.

---

#### `POST /auth/logout`
- **Description:** Logs out the current user (client discards token; endpoint reserved for future blacklisting).
- **Authentication Required:** Yes
- **User Role:** Any authenticated
- **Request Body:** None
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Logged out successfully", "data": null }
  ```
- **Error Responses:**
  - `401 Unauthorized` — missing/invalid token.

---

#### `GET /auth/me`
- **Description:** Retrieves the currently authenticated user's basic identity.
- **Authentication Required:** Yes
- **User Role:** Any authenticated
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "User retrieved", "data": { "id": 12, "name": "Jane Doe", "role": "student" } }
  ```
- **Error Responses:**
  - `401 Unauthorized` — missing/invalid/expired token.

---

### 8.2 Students

#### `GET /students/profile`
- **Description:** Retrieves the authenticated student's full profile.
- **Authentication Required:** Yes
- **User Role:** Student
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Profile retrieved",
    "data": {
      "id": 12, "name": "Jane Doe", "email": "jane.doe@example.com",
      "education": "B.Tech Computer Science", "skills": ["React", "Node.js"],
      "bio": "Aspiring full-stack developer.", "resumeUrl": "/uploads/resumes/abc123.pdf"
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden` (non-student role), `404 Not Found`.

---

#### `PUT /students/profile`
- **Description:** Updates the authenticated student's profile details.
- **Authentication Required:** Yes
- **User Role:** Student
- **Request Body:**
  ```json
  { "name": "Jane Doe", "education": "B.Tech Computer Science", "skills": ["React", "Node.js"], "bio": "Aspiring full-stack developer." }
  ```
- **Validation Rules:**
  - `name`: optional, string, 2–100 characters.
  - `education`: optional, string, max 200 characters.
  - `skills`: optional, array of strings, max 20 items.
  - `bio`: optional, string, max 1000 characters.
- **Success Response:** `200 OK` — returns updated profile object.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`.

---

#### `POST /students/resume`
- **Description:** Uploads or replaces the student's resume file.
- **Authentication Required:** Yes
- **User Role:** Student
- **Request Body:** `multipart/form-data` with field `resume` (file).
- **Validation Rules:**
  - File type: PDF or DOCX only.
  - File size: max 5 MB.
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Resume uploaded successfully", "data": { "resumeUrl": "/uploads/resumes/abc123.pdf" } }
  ```
- **Error Responses:**
  - `400 Bad Request` — invalid file type or size exceeded.
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `DELETE /students/resume`
- **Description:** Deletes the student's currently uploaded resume.
- **Authentication Required:** Yes
- **User Role:** Student
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found` — no resume on file.

---

#### `GET /students/applications`
- **Description:** Retrieves the authenticated student's application history.
- **Authentication Required:** Yes
- **User Role:** Student
- **Query Parameters:** `status`, `page`, `limit`, `sort`
- **Success Response:** `200 OK` — paginated list of application objects.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

### 8.3 Companies

#### `GET /companies/profile`
- **Description:** Retrieves the authenticated company's profile.
- **Authentication Required:** Yes
- **User Role:** Company
- **Success Response:** `200 OK` — returns company profile including `approvalStatus` (`pending` | `approved` | `rejected`), corresponding to `company_profiles.approval_status` in the database design.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `PUT /companies/profile`
- **Description:** Updates the authenticated company's profile.
- **Authentication Required:** Yes
- **User Role:** Company
- **Request Body:**
  ```json
  { "companyName": "TechCorp Inc.", "description": "We build developer tools.", "website": "https://techcorp.com", "industry": "Software" }
  ```
- **Validation Rules:**
  - `companyName`: optional, string, 2–150 characters.
  - `description`: optional, string, max 2000 characters.
  - `website`: optional, valid URL format.
  - `industry`: optional, string, max 100 characters.
- **Success Response:** `200 OK` — returns updated company profile.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`.

---

#### `POST /companies/logo`
- **Description:** Uploads or replaces the company's logo image.
- **Authentication Required:** Yes
- **User Role:** Company
- **Request Body:** `multipart/form-data` with field `logo` (file).
- **Validation Rules:**
  - File type: JPG, PNG, or SVG only.
  - File size: max 2 MB.
- **Success Response:** `200 OK` — returns `{ "logoUrl": "/uploads/logos/xyz456.png" }`.
- **Error Responses:**
  - `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`.

---

#### `GET /companies/:companyId`
- **Description:** Retrieves a public company profile (for student viewing).
- **Authentication Required:** No
- **User Role:** Public
- **Success Response:** `200 OK` — returns public-facing company details.
- **Error Responses:**
  - `404 Not Found`.

---

#### `GET /companies/applicants`
- **Description:** Retrieves all applicants across all of the company's internship postings.
- **Authentication Required:** Yes
- **User Role:** Company
- **Query Parameters:** `internshipId`, `status`, `page`, `limit`, `sort`
- **Success Response:** `200 OK` — paginated list of applicant/application objects.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

### 8.4 Internships

#### `GET /internships`
- **Description:** Retrieves all published internships (public listing with search/filter).
- **Authentication Required:** No
- **User Role:** Public
- **Query Parameters:** `search`, `location`, `domain`, `minStipend`, `maxStipend`, `duration`, `page`, `limit`, `sort`
- **Success Response:** `200 OK` — paginated list of published internship postings.
- **Error Responses:**
  - `400 Bad Request` — invalid query parameter values.

---

#### `GET /internships/:internshipId`
- **Description:** Retrieves full details of a single internship posting.
- **Authentication Required:** No
- **User Role:** Public
- **Success Response:** `200 OK` — returns internship detail object including company summary.
- **Error Responses:**
  - `404 Not Found`.

---

#### `POST /internships`
- **Description:** Creates a new internship posting.
- **Authentication Required:** Yes
- **User Role:** Company (must be approved/verified)
- **Request Body:**
  ```json
  {
    "title": "Frontend Developer Intern",
    "description": "Work on our React-based dashboard.",
    "requiredSkills": ["React", "JavaScript"],
    "location": "Remote",
    "duration": "3 months",
    "stipend": 15000,
    "applicationDeadline": "2026-09-01",
    "status": "draft"
  }
  ```
- **Validation Rules:**
  - `title`: required, string, 5–150 characters.
  - `description`: required, string, 20–5000 characters.
  - `requiredSkills`: required, array of strings, min 1 item.
  - `location`: required, string, max 150 characters.
  - `duration`: required, string, max 50 characters.
  - `stipend`: required, integer, ≥ 0.
  - `applicationDeadline`: required, valid ISO date, must be in the future.
  - `status`: optional, one of `draft`, `published` (defaults to `draft`).
- **Success Response:** `201 Created` — returns created internship object.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden` (unverified company).

---

#### `PUT /internships/:internshipId`
- **Description:** Updates an existing internship posting owned by the authenticated company.
- **Authentication Required:** Yes
- **User Role:** Company (owner only)
- **Request Body:** Same shape as `POST /internships` (all fields optional on update).
- **Validation Rules:** Same as creation, applied only to provided fields.
- **Success Response:** `200 OK` — returns updated internship object.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden` (not owner), `404 Not Found`.

---

#### `PATCH /internships/:internshipId/status`
- **Description:** Changes the status of a posting (e.g., publish, close).
- **Authentication Required:** Yes
- **User Role:** Company (owner) or Admin
- **Request Body:**
  ```json
  { "status": "published" }
  ```
- **Validation Rules:**
  - `status`: required, one of `draft`, `published`, `closed`, `flagged`, `removed`. Company may only set `draft`, `published`, `closed`; `flagged`/`removed` are Admin-only.
- **Success Response:** `200 OK` — returns updated internship object.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `DELETE /internships/:internshipId`
- **Description:** Deletes an internship posting owned by the authenticated company. Per the database design's soft-deletion guidance, if the posting has zero applications it is hard-deleted; if it has one or more applications, the endpoint instead sets `internships.status` to `removed` (preserving associated `applications` rows for the affected students' history) and returns `200 OK` rather than `204 No Content`.
- **Authentication Required:** Yes
- **User Role:** Company (owner only)
- **Success Response:** `204 No Content` (hard delete, no applications) or `200 OK` with the updated internship object (soft delete, `status: "removed"`).
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `GET /internships/:internshipId/applications`
- **Description:** Retrieves all applications submitted to a specific internship posting.
- **Authentication Required:** Yes
- **User Role:** Company (owner only) or Admin
- **Query Parameters:** `status`, `page`, `limit`, `sort`
- **Success Response:** `200 OK` — paginated list of applications with student summary.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 8.5 Applications

> Corresponds to the `applications` table in `docs/02_Database_Design.md`. The full status lifecycle stored in the database is `applied` → `under_review` → `shortlisted` → `accepted` | `rejected`, with a parallel `withdrawn` state reachable from `applied` via student withdrawal. `applied` and `withdrawn` are system/student-managed and are not accepted as input to the company/admin status-update endpoint below.

#### `POST /internships/:internshipId/applications`
- **Description:** Submits a new application to an internship posting.
- **Authentication Required:** Yes
- **User Role:** Student
- **Request Body:**
  ```json
  { "coverLetter": "I am excited to apply for this role because..." }
  ```
- **Validation Rules:**
  - `coverLetter`: optional, string, max 3000 characters.
  - Student must have a resume on file prior to applying.
- **Success Response:** `201 Created` — returns created application object with status `applied`.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden` (not a student, or missing resume), `404 Not Found` (posting doesn't exist or isn't published), `409 Conflict` (duplicate application).

---

#### `GET /applications/:applicationId`
- **Description:** Retrieves details of a single application.
- **Authentication Required:** Yes
- **User Role:** Student (owner), Company (owner of related posting), or Admin
- **Success Response:** `200 OK` — returns full application object.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `PATCH /applications/:applicationId/status`
- **Description:** Updates the status of an application.
- **Authentication Required:** Yes
- **User Role:** Company (owner of related posting) or Admin
- **Request Body:**
  ```json
  { "status": "shortlisted" }
  ```
- **Validation Rules:**
  - `status`: required, one of `under_review`, `shortlisted`, `accepted`, `rejected`. Must follow valid lifecycle transition rules (no skipping backward, no reopening a closed application).
- **Success Response:** `200 OK` — returns updated application object; triggers a notification to the student.
- **Error Responses:**
  - `422 Unprocessable Entity` (invalid transition), `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `DELETE /applications/:applicationId`
- **Description:** Withdraws an application (student-initiated), permitted only while status is `applied`. Consistent with the database design's soft-deletion guidance, this does not remove the row — it transitions `applications.status` to `withdrawn` so the record is preserved for the student's application history and any future analytics.
- **Authentication Required:** Yes
- **User Role:** Student (owner only)
- **Success Response:** `200 OK` — returns the application object with `status: "withdrawn"`.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (application already progressed beyond `applied`).

---

### 8.6 Bookmarks

> "Bookmarks" is the user-facing term for what the database design (`docs/02_Database_Design.md`) models as the `saved_internships` table — a join table between `student_profiles` and `internships`. The `bookmarkId` field returned below corresponds to `saved_internships.id`.

#### `GET /bookmarks`
- **Description:** Retrieves the authenticated student's bookmarked internships.
- **Authentication Required:** Yes
- **User Role:** Student
- **Query Parameters:** `page`, `limit`
- **Success Response:** `200 OK` — paginated list of bookmarked internship postings.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `POST /bookmarks/:internshipId`
- **Description:** Bookmarks an internship posting for later reference.
- **Authentication Required:** Yes
- **User Role:** Student
- **Validation Rules:**
  - `internshipId`: must reference an existing, published internship.
- **Success Response:** `201 Created`
  ```json
  { "success": true, "message": "Internship bookmarked", "data": { "bookmarkId": 55, "internshipId": 21 } }
  ```
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict` (already bookmarked).

---

#### `DELETE /bookmarks/:internshipId`
- **Description:** Removes an internship from the student's bookmarks.
- **Authentication Required:** Yes
- **User Role:** Student
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 8.7 Notifications

#### `GET /notifications`
- **Description:** Retrieves the authenticated user's notifications.
- **Authentication Required:** Yes
- **User Role:** Any authenticated
- **Query Parameters:** `unreadOnly` (boolean), `page`, `limit`
- **Success Response:** `200 OK` — paginated list of notification objects.
- **Error Responses:**
  - `401 Unauthorized`.

---

#### `PATCH /notifications/:notificationId/read`
- **Description:** Marks a single notification as read.
- **Authentication Required:** Yes
- **User Role:** Any authenticated (owner only)
- **Success Response:** `200 OK` — returns updated notification object.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `PATCH /notifications/read-all`
- **Description:** Marks all of the authenticated user's notifications as read.
- **Authentication Required:** Yes
- **User Role:** Any authenticated
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "All notifications marked as read", "data": { "updatedCount": 8 } }
  ```
- **Error Responses:**
  - `401 Unauthorized`.

---

#### `DELETE /notifications/:notificationId`
- **Description:** Deletes a single notification.
- **Authentication Required:** Yes
- **User Role:** Any authenticated (owner only)
- **Success Response:** `204 No Content`
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

### 8.8 Admin

#### `GET /admin/users`
- **Description:** Retrieves all registered users (students and companies) with filters.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Query Parameters:** `role`, `status`, `search`, `page`, `limit`
- **Success Response:** `200 OK` — paginated list of user objects.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `PATCH /admin/users/:userId/status`
- **Description:** Activates or deactivates a user account.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Request Body:**
  ```json
  { "status": "deactivated" }
  ```
- **Validation Rules:**
  - `status`: required, one of `active`, `deactivated`.
- **Success Response:** `200 OK` — returns updated user object; action recorded in audit trail.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `GET /admin/companies/pending`
- **Description:** Retrieves all company registrations awaiting approval.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Query Parameters:** `page`, `limit`
- **Success Response:** `200 OK` — paginated list of pending company profiles.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `PATCH /admin/companies/:companyId/approval`
- **Description:** Approves or rejects a pending company registration.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Request Body:**
  ```json
  { "decision": "approved", "reason": "" }
  ```
- **Validation Rules:**
  - `decision`: required, one of `approved`, `rejected`.
  - `reason`: required if `decision` is `rejected`, string, max 500 characters.
- **Success Response:** `200 OK` — returns updated company object; triggers notification to company.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `GET /admin/internships`
- **Description:** Retrieves all internship postings platform-wide, including drafts and flagged postings.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Query Parameters:** `status`, `companyId`, `page`, `limit`
- **Success Response:** `200 OK` — paginated list of internship postings.
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `PATCH /admin/internships/:internshipId/moderate`
- **Description:** Flags or removes an internship posting for policy violations.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Request Body:**
  ```json
  { "action": "flagged", "reason": "Misleading stipend information" }
  ```
- **Validation Rules:**
  - `action`: required, one of `flagged`, `removed`, `restored`. Per the `internships.status` enum in `docs/02_Database_Design.md`, `flagged`/`removed` set that exact status; `restored` sets `status` back to `published`, reversing a prior `flagged`/`removed` moderation action.
  - `reason`: required if `action` is `flagged` or `removed`, string, max 500 characters.
- **Success Response:** `200 OK` — returns updated internship object; action recorded in audit trail.
- **Error Responses:**
  - `422 Unprocessable Entity`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`.

---

#### `GET /admin/audit-logs`
- **Description:** Retrieves a log of administrative actions for accountability.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Query Parameters:** `actorId`, `action`, `startDate`, `endDate`, `page`, `limit`
- **Success Response:** `200 OK` — paginated list of audit log entries (actor, action, target, timestamp).
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

### 8.9 Analytics

#### `GET /analytics/platform`
- **Description:** Retrieves platform-wide summary statistics.
- **Authentication Required:** Yes
- **User Role:** Admin
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Platform analytics retrieved",
    "data": {
      "totalStudents": 1240,
      "totalCompanies": 86,
      "pendingCompanyApprovals": 5,
      "totalInternships": 312,
      "activeInternships": 178,
      "totalApplications": 4521
    }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `GET /analytics/companies/postings`
- **Description:** Retrieves per-posting analytics (views, applicant counts) for the authenticated company.
- **Authentication Required:** Yes
- **User Role:** Company
- **Query Parameters:** `internshipId`, `page`, `limit`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Posting analytics retrieved",
    "data": [
      { "internshipId": 21, "title": "Frontend Developer Intern", "views": 340, "applicantCount": 27, "shortlistedCount": 6 }
    ]
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

#### `GET /analytics/students/activity`
- **Description:** Retrieves the authenticated student's own activity summary (applications sent, bookmarks, profile views received).
- **Authentication Required:** Yes
- **User Role:** Student
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Activity summary retrieved",
    "data": { "applicationsSubmitted": 12, "shortlisted": 3, "accepted": 1, "bookmarksCount": 8 }
  }
  ```
- **Error Responses:**
  - `401 Unauthorized`, `403 Forbidden`.

---

## Appendix: Role Access Summary

| Endpoint Group | Public | Student | Company | Admin |
|-----------------|--------|---------|---------|-------|
| Auth | ✅ (register/login) | ✅ | ✅ | ✅ (login only) |
| Students | ❌ | ✅ (own data) | ❌ | ❌ |
| Companies | ✅ (public profile) | ❌ | ✅ (own data) | ❌ |
| Internships (read) | ✅ (published only) | ✅ | ✅ (own) | ✅ (all) |
| Internships (write) | ❌ | ❌ | ✅ (own) | ✅ (moderation) |
| Applications | ❌ | ✅ (own) | ✅ (own postings) | ✅ (all) |
| Bookmarks (`saved_internships`) | ❌ | ✅ | ❌ | ❌ |
| Notifications | ❌ | ✅ (own) | ✅ (own) | ✅ (own) |
| Admin | ❌ | ❌ | ❌ | ✅ |
| Analytics | ❌ | ✅ (own) | ✅ (own) | ✅ (platform-wide) |

---

*End of Document — 03_API_Design.md*
