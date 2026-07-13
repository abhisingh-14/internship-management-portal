# Component 16 — Testing & Final Review

## Objective

Test the complete Internship Management Portal application, review functionality, fix outstanding issues/placeholders, and document the test scenarios and results.

---

## 1. Backend API Testing

### 1.1. Authentication & Authorization
- **Register Endpoint** (`POST /api/v1/auth/register`):
  - Verified creation of student and company accounts.
  - Validated password hashing via bcrypt.
  - Validated that duplicate email registration returns a `409 Conflict` error.
- **Login Endpoint** (`POST /api/v1/auth/login`):
  - Verified credentials validation.
  - Verified JWT access and refresh token issuing.
  - Verified restriction on deactivated users and pending/rejected company registrations (`403 Forbidden`).
- **Token Refresh** (`POST /api/v1/auth/refresh-token`):
  - Verified access token reissue from a valid refresh token.
- **Access Control Middleware** (`authenticate` & `authorize`):
  - Validated that private endpoints require a valid Bearer token (`401 Unauthorized` for missing/expired tokens).
  - Validated that role restrictions prevent students from accessing admin/company actions and vice-versa (`403 Forbidden`).

### 1.2. CRUD Resources & Transactions
- **Student Profile**:
  - Validated student bio updates (`PUT /api/v1/students/profile`).
  - Tested nested education history and skill list additions, modifications, and deletions.
- **Company Profile**:
  - Tested profile field updates (`PUT /api/v1/companies/profile`).
- **Internships**:
  - Verified internship creation, listing, updating, and status transitions (`draft`, `published`, `closed`).
  - Tested query filters (search, location, stipend range, duration) and sorting options.
- **Applications**:
  - Verified submission of applications with cover letters.
  - Verified status transitions (`applied` -> `under_review` -> `shortlisted` -> `accepted` / `rejected`).
  - Verified student withdrawal of application.
- **Bookmarks (Saved Internships)**:
  - Tested bookmarking and unbookmarking of postings.

### 1.3. File Uploads
- **Multer Middleware**:
  - Validated MIME type restriction (only PDF/DOCX for resumes; JPG/PNG/SVG for logos).
  - Validated file size limit checks (5 MB for resumes, 2 MB for logos).
  - Verified name obfuscation on-disk using cryptographically random UUIDs.
  - Tested replacement logic: old file is deleted from disk when a new file is uploaded.
- **Controlled File Serving**:
  - Tested `GET /uploads/resumes/:filename` (only authenticated admins, the owner student, or companies with an active application from the student can access).
  - Tested path traversal prevention (filenames resolved via `path.basename()`).

---

## 2. Frontend Integration Testing

### 2.1. Authentication & Routing
- Tested login/registration forms with field validation and server error responses.
- Verified that protected routes block unauthenticated users and redirect them to `/login`.
- Verified that role routes prevent incorrect roles and redirect them to `/unauthorized`.
- Verified auto-logout on token expiration (handling `auth:unauthorized` event from axios interceptor).

### 2.2. Student Workflows
- **Profile Page**:
  - Tested bio editing, resume uploading/replacing/deleting, and education/skills modal CRUD.
  - Replaced manual path concatenation with `resolveFileUrl` helper for robust resume URLs.
- **Internship Browse & Application**:
  - Tested searching, filtering, and sorting of internship listings.
  - Tested applying to a posting with cover letter submission and instantly displaying the application status.
  - Tested saving/unsaving postings from detail and bookmark list pages.

### 2.3. Company Workflows
- **Dashboard**:
  - Verified display of profile completeness, internship metrics, and recent notifications.
- **Profile Management**:
  - Implemented the actual logo upload feature on the Company Profile page, replacing the "Logo upload is coming soon" placeholder.
- **Applicant Management**:
  - Tested reviewing applicants, viewing submitted resumes, and updating application status.

### 2.4. Admin Workflows
- **Dashboard**:
  - Verified global stats (students, companies, applications) and pending approvals.
- **User Management**:
  - Tested activating/deactivating accounts and hard deleting users.
- **Company Verification**:
  - Tested approving/rejecting pending registrations with audit logging and student notifications.
- **Internship Moderation**:
  - Tested flagging/removing postings and verified badge rendering with the newly added `.bg-orange` utility class for flagged postings.

---

## 3. Bug Fixes & Code Cleanup

The following enhancements were made during this final testing component:
1. **Added Company Logo Upload Interface**:
   - Extended `client/src/services/companyService.js` with the `uploadCompanyLogo` method.
   - Updated `client/src/pages/company/CompanyProfile.jsx` to render the company logo and support logo upload/replace with loading and error handling.
2. **Fixed Flagged Badge Background Style**:
   - Added the `.bg-orange { background-color: #fd7e14 !important; }` utility class to `client/src/index.css` to fix formatting of flagged status badges.
3. **Refactored Resume View Link**:
   - Replaced manual path construction with `resolveFileUrl` helper in `client/src/pages/student/Profile.jsx` for clean URL resolution.
