# Project Overview
## Internship Management Portal

**Document Version:** 1.0
**Status:** Planning Phase
**Prepared As:** Senior Software Architecture Document

---

## 1. Project Vision

The Internship Management Portal aims to become a centralized, reliable, and scalable digital platform that connects students seeking internship opportunities with companies looking to hire early-career talent, while giving platform administrators complete oversight and control over the ecosystem.

The vision is to eliminate the fragmented, informal, and manual processes currently used by educational institutions and companies to manage internship placements — replacing spreadsheets, emails, and disconnected job boards with a single, secure, role-based web application that streamlines the entire internship lifecycle from posting to hiring.

---

## 2. Problem Statement

Currently, internship discovery and management suffer from several structural problems:

- **Students** struggle to find verified, relevant internship opportunities in one place and have no standardized way to track their application status.
- **Companies** lack a structured system to post internships, manage incoming applications, and evaluate candidates efficiently. Manual tracking via email or spreadsheets is error-prone and time-consuming.
- **Educational institutions/administrators** have no visibility or control over the internship ecosystem — they cannot monitor platform activity, verify company legitimacy, or moderate content.
- There is no unified authentication and authorization system that securely separates the concerns and permissions of students, companies, and administrators.

The absence of a purpose-built platform results in inefficiency, poor communication, lost opportunities, and a lack of accountability for all parties involved.

---

## 3. Objectives

1. Provide a secure, role-based platform for students, companies, and administrators.
2. Enable companies to post, edit, and manage internship listings with ease.
3. Allow students to browse, filter, and apply for internships, and track their application status in real time.
4. Give companies tools to review, shortlist, accept, or reject applicants.
5. Equip administrators with tools to moderate users, companies, and internship postings.
6. Ensure data integrity, security, and scalability through a well-normalized relational database and secure authentication.
7. Deliver a responsive, accessible, and intuitive user interface using React and Bootstrap.
8. Build the system using clean, modular, maintainable code following MVC and SOLID principles.

---

## 4. User Roles

The platform supports three distinct user roles, each with dedicated permissions and dashboards:

1. **Student** — Seeks and applies for internships.
2. **Company** — Posts internships and manages applicants.
3. **Admin** — Oversees and moderates the entire platform.

---

## 5. Features by Role

### 5.1 Student Features
- Register and log in securely (JWT-based authentication).
- Create and edit a personal profile (education, skills, resume upload).
- Browse and search internship listings with filters (location, domain, stipend, duration).
- View detailed internship descriptions and company profiles.
- Apply to internships with resume/cover letter attachment.
- Track application status (Applied, Under Review, Shortlisted, Accepted, Rejected).
- View application history.
- Receive notifications/status updates on applications.
- Update or withdraw an application before it is reviewed.

### 5.2 Company Features
- Register and log in securely; profile requires admin verification before posting.
- Create, edit, publish, and close internship postings.
- View and manage all applicants for each posting.
- Filter and sort applicants (by skill, status, application date).
- Update applicant status (Shortlist, Accept, Reject).
- View student profiles and uploaded resumes.
- Manage company profile (logo, description, industry, website).
- View analytics on postings (number of applicants, views).

### 5.3 Admin Features
- Secure admin login with elevated privileges.
- Approve or reject newly registered companies.
- View, manage, and deactivate/reactivate any user account (student or company).
- Moderate internship postings (approve, flag, remove inappropriate listings).
- View platform-wide statistics (total users, active internships, applications).
- Manage role-based access and platform-wide settings.
- Audit logs for critical actions (optional future enhancement).

---

## 6. Functional Requirements

| ID | Requirement |
|----|-------------|
| FR-1 | System shall allow users to register with role selection (Student/Company). |
| FR-2 | System shall authenticate users via JWT and hash passwords using bcrypt. |
| FR-3 | System shall enforce role-based access control (RBAC) on all protected routes. |
| FR-4 | Companies shall be able to perform full CRUD operations on internship postings. |
| FR-5 | Students shall be able to apply to internships only once per posting. |
| FR-6 | System shall support file uploads (resumes, company logos) via Multer with validation on file type/size. |
| FR-7 | System shall validate all incoming request data using Express Validator. |
| FR-8 | Companies shall be able to update application status; students shall be notified of changes. |
| FR-9 | Admins shall be able to approve/reject company accounts before they can post internships. |
| FR-10 | System shall provide search and filter capabilities for internship listings. |
| FR-11 | System shall maintain referential integrity across all related entities using foreign keys and cascade rules. |
| FR-12 | System shall return consistent, structured error responses for all failure cases. |

---

## 7. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Security** | All passwords hashed with bcrypt; JWT tokens with expiration; input sanitization; protection against SQL injection and XSS. |
| **Performance** | API responses should return within acceptable latency (<500ms under normal load) for standard queries. |
| **Scalability** | Backend architecture (MVC, service layers) should support horizontal scaling and future feature additions without major refactors. |
| **Maintainability** | Codebase must follow SOLID principles, modular folder structure, and consistent naming conventions. |
| **Usability** | UI must be responsive (mobile, tablet, desktop) using Bootstrap 5 grid and components. |
| **Reliability** | Proper error handling and logging across frontend and backend to minimize downtime and ease debugging. |
| **Portability** | Environment-based configuration (.env) to support deployment across dev, staging, and production environments. |
| **Data Integrity** | Enforced normalization and foreign key constraints in MySQL schema. |

---

## 8. Technology Stack

### Frontend
- React 19
- Vite
- Bootstrap 5
- React Router DOM
- Axios

### Backend
- Node.js
- Express.js

### Authentication
- JWT (JSON Web Tokens)
- bcrypt (password hashing)

### Database
- MySQL

### File Upload
- Multer

### Validation
- Express Validator

### Architecture Patterns
- **Frontend:** Component-based architecture, Context API for authentication state, Axios service layer for API communication.
- **Backend:** MVC architecture with clearly separated Routes, Controllers, Middleware, Models, and Utility functions.

---

## 9. Folder Structure

```
internship-management-portal/
│
├── client/                          # React frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── common/
│   │   │   ├── student/
│   │   │   ├── company/
│   │   │   └── admin/
│   │   ├── context/                 # Auth Context API
│   │   ├── pages/                   # Route-level pages
│   │   │   ├── student/
│   │   │   ├── company/
│   │   │   └── admin/
│   │   ├── services/                 # Axios API service layer
│   │   ├── routes/                   # React Router configuration
│   │   ├── utils/                    # Frontend helper functions
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                          # Node.js/Express backend
│   ├── config/                      # DB config, env loading
│   ├── controllers/                 # Business logic per resource
│   ├── middleware/                  # Auth, error handling, validation
│   ├── models/                      # MySQL models/queries
│   ├── routes/                      # Express route definitions
│   ├── utils/                       # Helper/utility functions
│   ├── uploads/                     # Multer file storage
│   ├── validators/                  # Express Validator schemas
│   ├── app.js
│   ├── server.js
│   └── package.json
│
├── docs/                            # Project documentation
│   └── 00_Project_Overview.md
│
├── .env.example
├── .gitignore
└── README.md
```

---

## 10. Development Roadmap

**Phase 1 — Planning & Architecture**
- Finalize project overview, database schema, and API contract.

**Phase 2 — Backend Foundation**
- Set up Express server, environment configuration, MySQL connection.
- Implement authentication (register/login, JWT, bcrypt) and role middleware.

**Phase 3 — Core Backend Modules**
- Build models, controllers, and routes for Students, Companies, Internships, and Applications.
- Implement file upload handling (resumes, logos) and input validation.

**Phase 4 — Admin Module**
- Build admin-specific endpoints for user/company/internship moderation.

**Phase 5 — Frontend Foundation**
- Set up React project, routing, Context API for authentication, Axios service layer.

**Phase 6 — Frontend Role Dashboards**
- Build Student, Company, and Admin dashboards and workflows.

**Phase 7 — Integration & Testing**
- Connect frontend to backend, end-to-end testing of all workflows.

**Phase 8 — Polish & Deployment**
- UI refinement, error handling review, security hardening, deployment configuration.

---

## 11. Risks

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Improper role-based access control | High — unauthorized data access | Centralized auth middleware, thorough route testing |
| Unvalidated file uploads | High — security vulnerability | Strict Multer file type/size validation |
| Inconsistent error handling | Medium — poor UX, harder debugging | Centralized error-handling middleware and standardized response format |
| Database design flaws | High — data integrity issues later | Careful schema design with normalization and foreign keys upfront |
| Scope creep during development | Medium — delays | Strict adherence to defined phases/roadmap |
| Insecure credential storage | High — data breach risk | bcrypt hashing, environment variables for secrets, no plaintext storage |

---

## 12. Future Enhancements

- Email notifications for application status changes.
- In-app messaging between students and companies.
- Advanced analytics dashboard for admins (trends, conversion rates).
- Resume parsing/auto-fill using AI.
- Company reviews and ratings from students.
- Multi-language support.
- Audit logging for admin actions.
- Integration with LinkedIn for profile import.
- Pagination and caching for large-scale data.
- Automated testing suite (unit + integration + E2E).

---

*End of Document — 00_Project_Overview.md*
