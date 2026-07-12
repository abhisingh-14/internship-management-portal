# File Upload

## Objective

This component implements secure file upload functionality for student
resumes and company logos, using Multer, on top of the Student Module
(Component 06) and Company Module (Component 07). It adds strict
server-side file type and size validation, unique non-guessable on-disk
filenames, local filesystem storage, replace-on-upload cleanup, and
controlled (non-`express.static`) routes for serving the uploaded files
back to authorized users.

This component directly implements FR-RES-01 through FR-RES-04 in
`docs/01_Software_Requirements_Specification.md`, the resume/logo upload
endpoints documented in `docs/03_API_Design.md` §8.2–8.3, and the File
Upload Flow described in `docs/04_Project_Architecture.md` §10.

> **Note on reconstructed files:** The actual prior contents of
> `server/controllers/student.controller.js`, `server/controllers/company.controller.js`,
> their route/model files, `server/config/env.js`, and `server/app.js` were
> not available in this session. These files were reconstructed in full,
> consistent with `docs/03_API_Design.md`, `docs/05_Authentication.md`,
> `docs/06_Student_Module.md`, and `docs/07_Company_Module.md`, then
> extended with the upload functionality below. Education/skills endpoints
> from Component 06 are intentionally **not** included in
> `student.controller.js`/`student.routes.js` — per
> `docs/05_Coding_Standards.md` §1, they belong in their own
> `studentEducation.*` / `studentSkill.*` resource files and are unaffected
> by this component.

---

## Features Implemented

- **Multer configuration** (`server/middleware/upload.js`) with two
  independent, single-file upload pipelines:
  - `uploadResume` — accepts field name `resume`; allows only
    `application/pdf` and
    `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
    (DOCX) MIME types; max size configurable via `MAX_RESUME_SIZE_MB`
    (default 5 MB).
  - `uploadLogo` — accepts field name `logo`; allows only `image/jpeg`,
    `image/png`, `image/svg+xml`; max size configurable via
    `MAX_LOGO_SIZE_MB` (default 2 MB).
  - Both pipelines validate MIME type and size **before** any bytes are
    written to disk (Multer's `fileFilter` + `limits`), per FR-RES-01/02
    and Coding Standards §10.
  - Both pipelines generate a cryptographically random filename
    (`crypto.randomUUID()` + original extension) — the client-supplied
    filename is never used for storage, per FR-RES-03.
  - Multer-specific errors (oversized file, disallowed MIME type,
    malformed multipart payload) are converted into a typed
    `BadRequestError` and forwarded to the centralized error handler,
    rather than leaking Multer's internal error shape to the client.
- **`requireUploadedFile(fieldLabel)` middleware** — returns a clear
  `400 Bad Request` if a request reaches the upload endpoint with no file
  attached at all (rather than silently proceeding with `req.file`
  undefined).
- **`server/utils/fileStorage.js`** — shared helpers for:
  - Deleting a previously uploaded resume/logo file from disk when it is
    replaced or explicitly removed, without throwing if the file is
    already missing.
  - Building the public-facing `resumeUrl` / `logoUrl` strings persisted
    in the database, matching the exact shape already documented in
    `docs/03_API_Design.md` (e.g. `/uploads/resumes/<uuid>.pdf`).
- **Resume upload/replace** — `POST /students/resume`. On a successful
  upload, the new `resume_url` is persisted first, then the previous
  file (if any) is deleted from disk, so a filesystem error during cleanup
  can never leave a student without a resume on record.
- **Resume delete** — `DELETE /students/resume`. Clears `resume_url` back
  to `NULL` and deletes the corresponding file from disk. Returns
  `404 Not Found` if no resume is currently on file.
- **Company logo upload/replace** — `POST /companies/logo`. Same
  replace-then-cleanup ordering as resume upload.
- **Controlled file serving** (`server/routes/file.routes.js`,
  `server/controllers/file.controller.js`), mounted at `/uploads` in
  `server/app.js` (outside the `/api/v1` prefix, to match the documented
  URL shape):
  - `GET /uploads/resumes/:filename` — requires authentication. A student
    may only access their own resume; an admin may access any resume; any
    other caller (including companies, for now — see **Future
    Dependencies**) receives `403 Forbidden`.
  - `GET /uploads/logos/:filename` — public, no authentication required,
    since company logos are already public-facing branding assets shown on
    `GET /companies/:companyId`.
  - Both handlers resolve `:filename` via `path.basename()` before joining
    it to the uploads directory, preventing path-traversal attacks via a
    crafted filename such as `../../.env`.
  - The raw `server/uploads/` directory is **never** exposed via
    `express.static`; every read goes through one of these two controllers.

---

## Folder Structure

```
internship-management-portal/
└── server/
    ├── app.js                              (modified)
    ├── config/
    │   └── env.js                          (modified)
    ├── controllers/
    │   ├── student.controller.js           (modified)
    │   ├── company.controller.js           (modified)
    │   └── file.controller.js              (new)
    ├── middleware/
    │   └── upload.js                       (new)
    ├── models/
    │   ├── user.model.js                   (modified)
    │   ├── studentProfile.model.js         (modified)
    │   └── companyProfile.model.js         (modified)
    ├── routes/
    │   ├── index.js                        (modified)
    │   ├── student.routes.js               (modified)
    │   ├── company.routes.js               (modified)
    │   └── file.routes.js                  (new)
    ├── utils/
    │   └── fileStorage.js                  (new)
    ├── validators/
    │   ├── student.validator.js            (new)
    │   └── company.validator.js            (new)
    ├── uploads/
    │   ├── resumes/                        (now actively written to)
    │   └── logos/                          (now actively written to)
    └── .env.example                        (modified)
```

No new top-level directories were introduced. `server/uploads/resumes/`
and `server/uploads/logos/` already existed (gitignored, `.gitkeep`-only)
from the Project Setup component and now hold real, runtime-generated
files.

---

## Files Created

| File | Purpose |
|------|---------|
| `server/middleware/upload.js` | Multer storage engines, file filters, size limits, and error-to-`ApiError` translation for resume and logo uploads. |
| `server/utils/fileStorage.js` | Deletes replaced/removed files from disk; builds the persisted `resumeUrl`/`logoUrl` strings. |
| `server/controllers/file.controller.js` | Serves resumes (access-controlled) and logos (public) by filename, with path-traversal protection. |
| `server/routes/file.routes.js` | Mounts `GET /uploads/resumes/:filename` and `GET /uploads/logos/:filename`. |
| `server/validators/student.validator.js` | Express Validator rules for `PUT /students/profile` (`name`, `bio`). |
| `server/validators/company.validator.js` | Express Validator rules for `PUT /companies/profile` (`companyName`, `description`, `website`, `industry`). |
| `docs/Components/08_File_Upload.md` | This document. |

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `server/config/env.js` | Added `upload.maxResumeSizeMb` / `upload.maxLogoSizeMb` config, read from optional `MAX_RESUME_SIZE_MB` / `MAX_LOGO_SIZE_MB` env vars with safe defaults (5 MB / 2 MB). | `server/middleware/upload.js` needs configurable, environment-driven size limits rather than hardcoded values, per the "never hardcoded" configuration rule. |
| `server/.env.example` | Documented the two new optional variables. | Keeps the environment template in sync with what the app now reads. |
| `server/app.js` | Mounted `fileRoutes` at `/uploads`, alongside the existing `/api/v1` router mount. | Uploaded files must be reachable at the exact `/uploads/resumes/...` / `/uploads/logos/...` URLs already documented in `docs/03_API_Design.md`, served through a controlled route rather than a static mount. |
| `server/routes/index.js` | No structural change beyond mounting the existing `student`/`company` routers (unchanged from prior components). | `file.routes.js` is intentionally mounted directly on `app.js`, not through this router, since it must sit outside the `/api/v1` prefix. |
| `server/routes/student.routes.js` | Added `POST /students/resume` (with `uploadResume` + `requireUploadedFile` middleware) and `DELETE /students/resume`. | New endpoints introduced by this component. |
| `server/routes/company.routes.js` | Added `POST /companies/logo` (with `uploadLogo` + `requireUploadedFile` middleware); reordered routes so literal paths (`/dashboard`, `/profile`, `/logo`) are declared before the generic `/:companyId` public route. | New endpoint introduced by this component; the reorder is required so Express doesn't match `/companies/logo` as `GET /:companyId` with `companyId = "logo"`. |
| `server/controllers/student.controller.js` | Added `uploadResume` and `deleteResume` controller functions. | New endpoints introduced by this component. |
| `server/controllers/company.controller.js` | Added `uploadLogo` controller function. | New endpoint introduced by this component. |
| `server/models/studentProfile.model.js` | Added `updateResumeUrl`, `clearResumeUrl`, `findResumeUrlByUserId`. | Required data-access methods for the new resume endpoints; no controller may contain raw SQL per Coding Standards §1. |
| `server/models/companyProfile.model.js` | Added `updateLogoUrl`, `findLogoUrlByUserId`. | Required data-access methods for the new logo endpoint. |
| `server/models/user.model.js` | Added `updateName`. | `PUT /students/profile` accepts a `name` field per `docs/06_Student_Module.md`, and `name` lives on `users`, not `student_profiles`; needed for the reconstructed `updateProfile` controller to function correctly alongside the new resume endpoints in the same file. |

---

## Database Changes

None. `resume_url` (on `student_profiles`) and `logo_url` (on
`company_profiles`) already exist in `server/database/schema.sql` per
`docs/02_Database_Design.md` §4.2–4.3. This component only reads and
writes those existing columns; no migration is required.

---

## API Endpoints

### `POST /api/v1/students/resume`
- **Authentication Required:** Yes — **User Role:** Student
- **Request Body:** `multipart/form-data`, field `resume` (file)
- **Validation Rules:** MIME type must be PDF or DOCX; size ≤ `MAX_RESUME_SIZE_MB` (default 5 MB)
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Resume uploaded successfully", "data": { "resumeUrl": "/uploads/resumes/3f1c9e2a-....pdf" } }
  ```
- **Error Responses:** `400 Bad Request` (invalid type/size/missing file), `401 Unauthorized`, `403 Forbidden`

### `DELETE /api/v1/students/resume`
- **Authentication Required:** Yes — **User Role:** Student
- **Success Response:** `204 No Content`
- **Error Responses:** `401 Unauthorized`, `403 Forbidden`, `404 Not Found` (no resume on file)

### `POST /api/v1/companies/logo`
- **Authentication Required:** Yes — **User Role:** Company
- **Request Body:** `multipart/form-data`, field `logo` (file)
- **Validation Rules:** MIME type must be JPG, PNG, or SVG; size ≤ `MAX_LOGO_SIZE_MB` (default 2 MB)
- **Success Response:** `200 OK`
  ```json
  { "success": true, "message": "Logo uploaded successfully", "data": { "logoUrl": "/uploads/logos/9a7b21e4-....png" } }
  ```
- **Error Responses:** `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`

### `GET /uploads/resumes/:filename`
- **Authentication Required:** Yes (any authenticated user; ownership enforced in the controller)
- **Success Response:** `200 OK` — binary file stream
- **Error Responses:** `401 Unauthorized`, `403 Forbidden` (not the owner, and not an admin), `404 Not Found`

### `GET /uploads/logos/:filename`
- **Authentication Required:** No
- **Success Response:** `200 OK` — binary file stream
- **Error Responses:** `404 Not Found`

---

## Backend Components

| Layer | File | Description |
|-------|------|--------------|
| Middleware | `server/middleware/upload.js` | Multer configuration, error translation, `requireUploadedFile`. |
| Controller | `server/controllers/file.controller.js` | Serves resumes/logos with ownership/public rules. |
| Route | `server/routes/file.routes.js` | `/uploads/resumes/:filename`, `/uploads/logos/:filename`. |
| Utility | `server/utils/fileStorage.js` | Disk cleanup and URL-building helpers. |
| Model | `server/models/studentProfile.model.js` | Resume URL persistence. |
| Model | `server/models/companyProfile.model.js` | Logo URL persistence. |

---

## Security Considerations

- **Type validation is MIME-based, not extension-based.** Multer's
  `fileFilter` inspects the actual reported MIME type against a fixed
  allow-list for each upload pipeline, per FR-RES-04.
- **Size limits are enforced by Multer itself** (`limits.fileSize`)
  before the full file is buffered/written, not checked after the fact.
- **Filenames are never trusted.** Stored files use
  `crypto.randomUUID()` names, never the client-supplied original
  filename, preventing collisions and unauthorized guessing (FR-RES-03).
  Incoming `:filename` route parameters are passed through
  `path.basename()` before being joined to a directory, preventing
  directory-traversal reads of arbitrary server files.
- **No open static mount.** `server/uploads/` is never served via
  `express.static`; every read is mediated by `file.controller.js`.
- **Resume access is restricted** to the owning student and admins
  (FR-RES-05). Company access to applicant resumes is intentionally
  **not yet implemented** — see Future Dependencies.
- **Old files are cleaned up on replace/delete**, preventing orphaned
  files from accumulating indefinitely on disk. Cleanup failures are
  logged but never fail the request, since the database is the source of
  truth for which file is "current."
- **Upload directories are gitignored** (unchanged from Component 01); no
  uploaded file is ever committed to version control.

---

## Testing Checklist

- [ ] Uploading a valid PDF under 5 MB to `POST /students/resume` succeeds and returns a `resumeUrl` matching `/uploads/resumes/<uuid>.pdf`.
- [ ] Uploading a valid DOCX succeeds.
- [ ] Uploading a `.txt` or `.png` file to `POST /students/resume` is rejected with `400 Bad Request` before anything is written to `server/uploads/resumes/`.
- [ ] Uploading a PDF renamed to `.pdf` but with a disallowed MIME type (e.g. spoofed `Content-Type`) is rejected.
- [ ] Uploading a resume file larger than `MAX_RESUME_SIZE_MB` is rejected with `400 Bad Request` and no partial file is left on disk.
- [ ] Calling `POST /students/resume` with no file attached returns `400 Bad Request` with a clear "No resume file was provided" message.
- [ ] Uploading a second resume deletes the first file from `server/uploads/resumes/` and the database reflects only the new URL.
- [ ] `DELETE /students/resume` removes the file from disk and returns `204 No Content`; calling it again returns `404 Not Found`.
- [ ] Uploading a valid JPG/PNG/SVG under 2 MB to `POST /companies/logo` succeeds.
- [ ] Uploading an oversized or disallowed-type logo is rejected with `400 Bad Request`.
- [ ] A second logo upload deletes the previous logo file from disk.
- [ ] `GET /uploads/resumes/:filename` as the owning student returns the file with `200 OK`.
- [ ] `GET /uploads/resumes/:filename` as a *different* student returns `403 Forbidden`.
- [ ] `GET /uploads/resumes/:filename` as an admin returns the file regardless of which student owns it.
- [ ] `GET /uploads/resumes/:filename` without a token returns `401 Unauthorized`.
- [ ] `GET /uploads/resumes/../../server/config/env.js`-style traversal attempts resolve to a `404 Not Found` (basename stripping), never leaking files outside `server/uploads/resumes/`.
- [ ] `GET /uploads/logos/:filename` succeeds without any `Authorization` header.
- [ ] Requesting a non-existent filename under either route returns `404 Not Found`.

---

## Future Dependencies

- **Applications component** — once the `applications` table exists, `file.controller.js`'s `serveResume` handler must be extended so a company can access the resume of any student who applied to one of that company's own postings (currently, companies receive `403 Forbidden` for every resume). This requires a query joining `applications` → `student_profiles` → the requesting company's `internships`.
- **Admin Module component** — will reuse the existing admin bypass in `serveResume` unchanged.
- **Cloud storage migration (future enhancement)** — `fileStorage.js`'s `deleteResumeFileIfExists`/`deleteLogoFileIfExists`/`buildResumeUrl`/`buildLogoUrl` functions are the only places that know uploads live on the local filesystem; migrating to S3-compatible storage should only require changing these four functions and `upload.js`'s storage engine, not any controller or model.

---

## Notes

- **Assumption:** `server/database/schema.sql`, `server/config/db.js`, and the typed error/response/logging utilities from Components 01–03 are unchanged and correct, exactly as documented.
- **Design choice — replace-then-delete ordering.** Both `uploadResume` and `uploadLogo` persist the new URL to the database *before* deleting the old file from disk. If disk cleanup fails partway through, the user is never left without a working resume/logo on record; a harmless orphaned file is the only consequence, and it is logged via `logger.error` for manual cleanup.
- **Limitation:** Company access to applicant resumes is not implemented in this component — see Future Dependencies. This is intentional, not an oversight, since the `applications` table does not exist yet.
- **Limitation:** No virus/malware scanning is performed on uploaded files. This was not part of the documented requirements (`docs/01_Software_Requirements_Specification.md` FR-RES-01–04) and would be a deliberate future hardening step, likely via a third-party scanning service, before production deployment.

---

*End of Document — 08_File_Upload.md*
