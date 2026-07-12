# Internship Application (Component 11)

## Objective

This component implements the student-facing and company-facing Internship Application module. It enables:
- Students to apply for internships with an optional cover letter (if they have a resume on file).
- Students to view their application history and current status.
- Students to withdraw their applications (while in the `applied` status).
- Companies to view all applicants across their postings (or filtered by posting) and review candidate bio details, cover letters, and resumes.
- Companies to progress applicant status through a strict evaluation lifecycle (`applied` → `under_review` → `shortlisted` → `accepted` | `rejected`), sending in-app notifications to the student.

---

## Features Implemented

### Backend

- **Database Reuse:** Reuses the `applications` table defined in Component 02 and joins it with `student_profiles`, `company_profiles`, `internships`, and `users`.
- **Application Model (`application.model.js`):**
  - CRUD operations: `createApplication`, `findById`, `findStudentApplications` (paginated/sorted), `findCompanyApplicants` (paginated/sorted), `findInternshipApplications` (paginated/sorted), and `updateStatus`.
  - Duplicate check constraint: `checkDuplicate` prevents multiple active submissions for the same student-internship pair.
- **In-App Notifications (`notification.model.js`):**
  - Inserts notification logs into the `notifications` table to notify students on application evaluation updates.
- **Application Controller (`application.controller.js`):**
  - Handles business rule validations (e.g., student role checks, validating deadline expiry, verifying that student has a resume on file prior to application, enforcing unique application constraints).
  - Enforces strict lifecycle state transition checks (e.g., preventing going backward in status or reopening closed states).
- **Authentication Parameter Token Support (`authenticate.js`):**
  - Enhanced the `authenticate` middleware to check both the `Authorization` header and a query-string `token` parameter. This enables secure download and browser rendering of candidate resumes (`/uploads/resumes/:filename`) in new tabs.
- **Controlled Resume serving (`file.controller.js`):**
  - Extended the resume file serving logic to authorize company profile owners to view candidate resumes if and only if the student has applied to one of their active postings.

### Frontend

- **Application Service (`applicationService.js`):**
  - Exposes `applyForInternship`, `getStudentApplications`, `withdrawApplication`, `getCompanyApplicants`, and `updateApplicationStatus` AJAX wrapper calls.
- **Student Apply Interface (`InternshipDetails.jsx`):**
  - Activates the "Apply Now" button for students (previously a disabled placeholder).
  - Verifies if the student has a resume URL in their profile. If not, disables submission and advises uploading a resume first.
  - Checks if the student has already applied to prevent submitting duplicates.
  - Renders a cover letter entry Bootstrap modal (up to 3000 characters limit).
- **Student Application History (`StudentApplications.jsx`):**
  - Lists applications with status badge colors.
  - Integrates pagination, sorting, status filter, and cover letter view.
  - Allows withdrawing applications if their status is still `applied`.
- **Company Applicant Evaluation (`CompanyApplicants.jsx`):**
  - Serves as the dashboard view for companies to see who applied to their postings.
  - Supports filtering by individual posting or candidate status.
  - Displays candidate name, bio, email, cover letter preview, and links directly to their uploaded PDF resume.
  - Controls status updating actions ("Review", "Shortlist", "Accept", "Reject"), dynamically hiding buttons based on current state transitions.
- **Sidebar Integration (`MainLayout.jsx`):**
  - Student sidebar: adds "Browse Internships" and "My Applications".
  - Company sidebar: adds "Manage Postings" and "Applicants".
- **Router Hookup (`AppRoutes.jsx`):**
  - Declares role-guarded routes for student application lists and company evaluation views.

---

## Folder Structure

```
internship-management-portal/
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── application.controller.js    (new)
│   │   └── file.controller.js           (modified)
│   ├── middleware/
│   │   └── authenticate.js              (modified)
│   ├── models/
│   │   ├── application.model.js         (new)
│   │   └── notification.model.js        (new)
│   ├── routes/
│   │   ├── application.routes.js        (new)
│   │   ├── index.js                     (modified)
│   │   ├── student.routes.js            (modified)
│   │   ├── company.routes.js            (modified)
│   │   └── internship.routes.js         (modified)
│   └── validators/
│       └── application.validator.js     (new)
│
└── client/
    └── src/
        ├── components/
        │   ├── company/
        │   │   └── PostingsTable.jsx    (modified)
        │   └── student/
        │       └── InternshipDetails.jsx (modified)
        ├── pages/
        │   ├── company/
        │   │   └── CompanyApplicants.jsx (new)
        │   └── student/
        │       └── StudentApplications.jsx (new)
        ├── routes/
        │   └── AppRoutes.jsx            (modified)
        └── services/
            └── applicationService.js    (new)
```

---

## Architectural Decisions

1. **State Transition Rules:** State transitions are verified both on the server (in the controller) and on the client (rendering action buttons conditionally). This guarantees data consistency and prevents any illegal workflows.
2. **Query String Token Authentication:** SPA files served as download attachments cannot easily use Custom headers if opened via standard `_blank` windows. Reading tokens from request parameters allows browser native handles to load private files securely.
3. **Controlled Resume Serving for Companies:** Resolving access based on active applications allows candidates' data to remain private until they willingly submit an application.

---

## Verification

### Automated Verification
Run server and frontend tests or use raw HTTP client curls to inspect endpoints:
- `POST /api/v1/internships/:internshipId/applications`
- `GET /api/v1/students/applications`
- `DELETE /api/v1/applications/:applicationId`
- `GET /api/v1/companies/applicants`
- `PATCH /api/v1/applications/:applicationId/status`

### Manual Verification
1. Log in as student `jane.doe@example.com` (password `SecurePass123!`).
2. Navigate to "Browse Internships", click on a listing.
3. Submit application with cover letter.
4. Verify application listed in "My Applications".
5. Log in as company recruiter `contact@techcorp.com` (password `SecurePass123!`).
6. Go to "Applicants", view the cover letter and PDF resume.
7. Change status to "Shortlisted", then "Accepted".
8. Verify change reflected in student dashboard.
