# Software Requirements Specification (SRS)
## Internship Management Portal

**Document Version:** 1.0
**Status:** Approved for Development Planning
**Related Document:** `docs/00_Project_Overview.md`

---

## 1. Introduction

### 1.1 Purpose

This Software Requirements Specification (SRS) defines the functional and non-functional requirements for the Internship Management Portal. It serves as the authoritative reference for the development team, guiding the design, implementation, and testing of the system. This document translates the vision and objectives established in the Project Overview into precise, verifiable requirements.

### 1.2 Scope

The Internship Management Portal is a full-stack web application that enables:

- **Students** to discover, apply for, and track internship opportunities.
- **Companies** to post internships and manage the applicant pipeline.
- **Administrators** to moderate users, companies, and postings, and maintain platform integrity.

The system will be built using React (frontend), Node.js/Express (backend), MySQL (database), JWT/bcrypt (authentication/security), and Multer (file handling). This SRS covers all web-based functionality of the platform. It does not cover native mobile applications, third-party integrations (e.g., LinkedIn import), or AI-based resume parsing — these are documented as future enhancements.

### 1.3 Definitions

| Term | Definition |
|------|-----------|
| **JWT** | JSON Web Token — a signed token used for stateless authentication. |
| **RBAC** | Role-Based Access Control — restricting system access based on user role. |
| **CRUD** | Create, Read, Update, Delete — the four basic persistence operations. |
| **API** | Application Programming Interface. |
| **MVC** | Model-View-Controller — architectural pattern separating data, logic, and presentation. |
| **Applicant** | A student who has submitted an application to an internship posting. |
| **Posting** | An internship listing created by a company. |
| **Admin** | A platform user with elevated privileges to moderate the system. |

### 1.4 Intended Audience

- Software architects and developers implementing the system.
- QA engineers designing test plans.
- Project managers tracking scope and delivery.
- Stakeholders and reviewers evaluating platform requirements.
- Future maintainers onboarding onto the codebase.

---

## 2. Overall Description

### 2.1 Product Perspective

The Internship Management Portal is a standalone, self-contained web application. It is not a component of a larger system, though it is architected with modular boundaries (MVC on the backend, component-based structure on the frontend) so that it can later integrate with external services (e.g., email providers, LinkedIn, AI resume parsers) without significant rearchitecture.

The system follows a client-server architecture:
- The **client** (React SPA) communicates with the **server** (Express REST API) exclusively over HTTP(S) using JSON payloads via Axios.
- The **server** persists data in a **MySQL** relational database and handles all business logic, authentication, and authorization.

### 2.2 Product Functions

At a high level, the system provides:

- Secure registration and login for three distinct roles.
- Internship posting creation, management, and discovery.
- End-to-end application submission and tracking.
- Resume and company logo file uploads.
- Role-based dashboards and permissions.
- Administrative moderation of users, companies, and postings.
- Search, filtering, and status-based views across internships and applications.

### 2.3 User Classes

| User Class | Description | Access Level |
|------------|-------------|--------------|
| **Student** | Job/internship seeker | Can manage own profile, applications, and resume |
| **Company** | Organization posting internships | Can manage own postings and applicants (post-verification) |
| **Admin** | Platform moderator/operator | Full access to moderate users, companies, and postings |
| **Guest (Unauthenticated)** | Visitor browsing public listings | Read-only access to public internship listings |

### 2.4 Operating Environment

- **Client:** Modern evergreen browsers (Chrome, Firefox, Edge, Safari) on desktop, tablet, and mobile viewports.
- **Server:** Node.js runtime (LTS version), deployed behind HTTPS.
- **Database:** MySQL relational database server.
- **File Storage:** Server-side filesystem storage (via Multer) for resumes and logos; abstracted so it could later migrate to cloud object storage.

### 2.5 Design Constraints

- Must strictly follow MVC architecture on the backend (routes, controllers, models, middleware, utilities separated).
- Must use JWT for stateless authentication and bcrypt for password hashing.
- All user input must be validated server-side using Express Validator, regardless of client-side validation.
- Styling must use Bootstrap 5 exclusively (no additional CSS frameworks).
- Environment-specific configuration must be handled via environment variables, never hardcoded.
- Database schema must be normalized and use foreign keys with appropriate cascade rules.

### 2.6 Assumptions

- Users have consistent internet access and a modern web browser.
- Companies act in good faith when registering, subject to admin verification before their postings go live.
- A single MySQL instance is sufficient for the expected initial scale; horizontal scaling is a future consideration.
- Email delivery infrastructure (for notifications) may not be available in the initial release; in-app notifications will be the primary mechanism initially.

---

## 3. Functional Requirements

Each requirement is identified with a unique ID for traceability.

### 3.1 Student Module

| ID | Requirement |
|----|-------------|
| FR-STU-01 | Students shall be able to register with name, email, password, and role selection. |
| FR-STU-02 | Students shall be able to create and edit a profile including education, skills, and bio. |
| FR-STU-03 | Students shall be able to upload, replace, and delete their resume. |
| FR-STU-04 | Students shall be able to browse and search all published, approved internships. |
| FR-STU-05 | Students shall be able to apply to an internship exactly once per posting. |
| FR-STU-06 | Students shall be able to view the real-time status of each application. |
| FR-STU-07 | Students shall be able to withdraw an application while it remains in "Applied" status. |
| FR-STU-08 | Students shall be able to view their full application history. |

### 3.2 Company Module

| ID | Requirement |
|----|-------------|
| FR-COM-01 | Companies shall be able to register and submit profile details for admin verification. |
| FR-COM-02 | Companies shall not be able to publish internship postings until their account is approved by an admin. |
| FR-COM-03 | Companies shall be able to create, edit, publish, unpublish, and delete internship postings. |
| FR-COM-04 | Companies shall be able to view a list of applicants per posting. |
| FR-COM-05 | Companies shall be able to filter and sort applicants by status, application date, or skills. |
| FR-COM-06 | Companies shall be able to update an applicant's status (Under Review, Shortlisted, Accepted, Rejected). |
| FR-COM-07 | Companies shall be able to view and download student resumes for review. |
| FR-COM-08 | Companies shall be able to manage their company profile (name, description, logo, website, industry). |

### 3.3 Admin Module

| ID | Requirement |
|----|-------------|
| FR-ADM-01 | Admins shall be able to view a list of all registered students and companies. |
| FR-ADM-02 | Admins shall be able to approve or reject pending company registrations. |
| FR-ADM-03 | Admins shall be able to activate or deactivate any user account. |
| FR-ADM-04 | Admins shall be able to review, approve, flag, or remove internship postings. |
| FR-ADM-05 | Admins shall be able to view platform-wide statistics (total users, active postings, total applications). |
| FR-ADM-06 | Admin actions on user/company/posting status shall be persisted with an audit trail (timestamp, actor, action). |

### 3.4 Authentication

| ID | Requirement |
|----|-------------|
| FR-AUTH-01 | The system shall support registration and login for Students and Companies; Admin accounts shall be provisioned separately (not via public registration). |
| FR-AUTH-02 | Passwords shall be hashed using bcrypt before storage; plaintext passwords shall never be persisted or logged. |
| FR-AUTH-03 | Successful login shall issue a signed JWT containing user ID and role, with a defined expiration time. |
| FR-AUTH-04 | Protected API routes shall validate the JWT and enforce role-based access control before processing the request. |
| FR-AUTH-05 | The system shall provide a mechanism to invalidate sessions (logout) on the client by discarding the token. |
| FR-AUTH-06 | The system shall reject requests with expired, malformed, or missing tokens on protected routes with a `401 Unauthorized` response. |

### 3.5 Resume Upload

| ID | Requirement |
|----|-------------|
| FR-RES-01 | The system shall allow students to upload resumes in PDF or DOCX format only. |
| FR-RES-02 | The system shall enforce a maximum file size limit (e.g., 5 MB) on resume uploads. |
| FR-RES-03 | The system shall store uploaded resumes with unique, non-guessable filenames to prevent collisions and unauthorized access. |
| FR-RES-04 | The system shall reject uploads that do not conform to allowed MIME types, regardless of file extension. |
| FR-RES-05 | Companies shall only be able to access resumes of students who applied to their own postings. |

### 3.6 Internship Management

| ID | Requirement |
|----|-------------|
| FR-INT-01 | Internship postings shall include title, description, required skills, location, duration, stipend, and application deadline. |
| FR-INT-02 | Postings shall have a status field (Draft, Published, Closed, Flagged, Removed). |
| FR-INT-03 | Only postings with "Published" status shall be visible to students. |
| FR-INT-04 | Companies shall only be able to edit or delete their own postings. |
| FR-INT-05 | The system shall automatically close postings past their application deadline. |

### 3.7 Applications

| ID | Requirement |
|----|-------------|
| FR-APP-01 | An application shall link exactly one student to exactly one internship posting. |
| FR-APP-02 | The system shall prevent duplicate applications from the same student to the same posting. |
| FR-APP-03 | Each application shall track a status lifecycle: Applied → Under Review → Shortlisted → Accepted/Rejected. |
| FR-APP-04 | Status transitions shall only be performed by the owning company or an admin. |
| FR-APP-05 | Students shall receive an in-app notification when their application status changes. |

### 3.8 Search & Filters

| ID | Requirement |
|----|-------------|
| FR-SRCH-01 | Students shall be able to search internships by keyword (title, company, skill). |
| FR-SRCH-02 | Students shall be able to filter internships by location, duration, stipend range, and domain/category. |
| FR-SRCH-03 | Companies shall be able to filter applicants by status and application date range. |
| FR-SRCH-04 | Search and filter operations shall be performed server-side with paginated results. |

### 3.9 Notifications

| ID | Requirement |
|----|-------------|
| FR-NOT-01 | The system shall generate an in-app notification for key events (application status change, posting approval/rejection, account approval). |
| FR-NOT-02 | Users shall be able to view a list of their notifications, marked as read/unread. |
| FR-NOT-03 | The notification system shall be designed to allow future extension to email/SMS delivery without breaking existing structure. |

---

## 4. Non-Functional Requirements

### 4.1 Performance
- API endpoints shall respond within 500ms under normal load (excluding file uploads).
- Paginated endpoints shall limit result sets (default page size, configurable) to avoid excessive payloads.

### 4.2 Security
- All traffic shall be served over HTTPS in production.
- Passwords shall be hashed with bcrypt using an appropriate salt/cost factor.
- All inputs shall be validated and sanitized server-side to prevent SQL injection and XSS.
- JWTs shall have a reasonable expiration window and shall not contain sensitive data beyond user ID and role.
- File uploads shall be restricted by type and size, and stored outside of publicly executable paths where possible.

### 4.3 Scalability
- The backend shall be stateless (aside from the database) to support horizontal scaling behind a load balancer.
- The database schema shall be normalized to reduce redundancy and support efficient indexing as data volume grows.

### 4.4 Maintainability
- The codebase shall adhere to MVC architecture and SOLID principles.
- Code shall use consistent naming conventions, modular file structure, and reusable components/utilities.
- Business logic shall reside in controllers/services, not in route definitions.

### 4.5 Reliability
- The system shall implement centralized error handling middleware to ensure consistent, predictable error responses.
- Critical operations (e.g., application submission, status updates) shall be wrapped in proper transaction handling where applicable to avoid partial writes.

### 4.6 Availability
- The system shall target high availability suitable for production use, with graceful degradation (informative error messages) during backend/database outages rather than silent failures.

### 4.7 Usability
- The UI shall be fully responsive across desktop, tablet, and mobile breakpoints using Bootstrap 5's grid system.
- Forms shall provide clear, immediate validation feedback.
- Navigation and dashboards shall be role-specific, showing only relevant actions to each user type.

---

## 5. User Stories

**Student**
- As a student, I want to create a profile with my education and skills so that companies can evaluate my fit for internships.
- As a student, I want to upload my resume so that I can apply to internships without re-entering my details each time.
- As a student, I want to search and filter internships by location and stipend so that I can find opportunities relevant to me.
- As a student, I want to track my application status so that I know where I stand without contacting the company directly.
- As a student, I want to withdraw an application I no longer wish to pursue.

**Company**
- As a company, I want to register and get verified so that I can be trusted to post legitimate internships.
- As a company, I want to post an internship with clear requirements so that I attract suitable candidates.
- As a company, I want to view and filter applicants so that I can efficiently shortlist candidates.
- As a company, I want to update an applicant's status so that students are informed of their progress.

**Admin**
- As an admin, I want to review and approve new company registrations so that only legitimate organizations can post internships.
- As an admin, I want to moderate internship postings so that inappropriate or fraudulent listings are removed.
- As an admin, I want to view platform statistics so that I can monitor overall system health and usage.
- As an admin, I want to deactivate a user account so that I can respond to policy violations.

---

## 6. Use Cases

### Use Case UC-01: Student Applies to Internship
- **Actor:** Student
- **Precondition:** Student is authenticated and has an uploaded resume.
- **Main Flow:**
  1. Student browses/searches published internships.
  2. Student selects an internship and views details.
  3. Student clicks "Apply" and confirms submission.
  4. System validates no duplicate application exists.
  5. System creates the application record with status "Applied."
  6. System notifies the company of a new applicant.
- **Postcondition:** Application is recorded and visible in the student's dashboard.
- **Alternate Flow:** If student has already applied, the system displays an error and blocks resubmission.

### Use Case UC-02: Company Publishes Internship Posting
- **Actor:** Company (verified)
- **Precondition:** Company account is approved by admin.
- **Main Flow:**
  1. Company fills out internship posting form (title, description, skills, deadline, etc.).
  2. System validates required fields.
  3. Company saves as Draft or Publishes directly.
  4. If published, posting becomes visible to students.
- **Postcondition:** Posting is stored and, if published, discoverable via search.

### Use Case UC-03: Admin Approves Company Registration
- **Actor:** Admin
- **Precondition:** A company has registered and is in "Pending Approval" status.
- **Main Flow:**
  1. Admin views list of pending company registrations.
  2. Admin reviews company profile details.
  3. Admin approves or rejects the registration.
  4. System updates company status and notifies the company.
- **Postcondition:** Approved companies can now publish postings; rejected companies cannot.

### Use Case UC-04: Company Updates Applicant Status
- **Actor:** Company
- **Precondition:** Applicant has applied to one of the company's postings.
- **Main Flow:**
  1. Company views applicant list for a posting.
  2. Company selects an applicant and changes status (e.g., Shortlisted).
  3. System validates the transition and updates the record.
  4. System notifies the student of the status change.
- **Postcondition:** Application status is updated and reflected on both dashboards.

---

## 7. Acceptance Criteria

- A student cannot apply to the same internship posting more than once.
- A company cannot publish internship postings until their account has been explicitly approved by an admin.
- Passwords are never stored or transmitted in plaintext at any point in the system.
- All protected routes reject requests without a valid JWT with a `401 Unauthorized` response.
- Resume uploads reject files that are not PDF/DOCX or exceed the configured size limit.
- Application status can only progress through the defined lifecycle states; invalid transitions are rejected.
- Search and filter results are paginated and return only published, non-expired postings to students.
- All API error responses follow a consistent structure (status code, message, optional details).
- Admins can deactivate any user account, immediately preventing that user from logging in.
- Every functional requirement listed in Section 3 has at least one corresponding automated or manual test case prior to release.

---

## 8. Future Enhancements

- Email and SMS notification delivery in addition to in-app notifications.
- AI-assisted resume parsing and profile auto-fill.
- In-app real-time messaging between students and companies.
- Company ratings and reviews submitted by students.
- Advanced admin analytics dashboard with trend visualization.
- LinkedIn integration for profile import.
- Multi-language (i18n) support.
- Full audit logging system for all administrative actions.
- Migration of file storage to cloud object storage (e.g., S3-compatible service).
- Automated end-to-end test suite integrated into CI/CD pipeline.

---

*End of Document — 01_Software_Requirements_Specification.md*
