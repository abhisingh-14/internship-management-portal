# Component 14 — Admin Module

## Overview

The Admin Module provides a secure, role-restricted control panel for platform administrators to manage users, companies, internship postings, applications, and review a tamper-evident audit trail.

All admin pages are accessible only to authenticated users with the `admin` role, enforced at both the route (`RoleRoute`) and API (`authorize('admin')`) levels.

---

## Features

| Feature | Description |
|---|---|
| Admin Dashboard | Platform-wide KPI cards, recent audit activity, and pending company approval queue |
| Manage Users | List, filter, activate/deactivate, and permanently delete student and company accounts |
| Verify Companies | Review and approve or reject pending company profile verification requests |
| Manage Internships | Browse all internship postings; flag, remove, or restore listings |
| View Applications | Platform-wide read-only view of all student applications with expandable detail rows |
| Audit Logs | Filterable, paginated log of every admin action for accountability |

---

## File Structure

```
server/
├── controllers/
│   └── admin.controller.js          # All admin action handlers
├── routes/
│   └── admin.routes.js              # Admin API route definitions (auth-guarded)
├── validators/
│   └── admin.validator.js           # express-validator schemas for all admin routes
├── models/
│   └── companyProfile.model.js      # Extended: findById, updateApprovalStatus
├── config/
│   └── db.js                        # Extended: initializeDatabase (creates admin_audit_logs)

client/src/
├── services/
│   └── adminService.js              # All admin-facing HTTP service functions
├── pages/admin/
│   ├── Dashboard.jsx                # Platform KPIs and approval queue
│   ├── Users.jsx                    # User list with moderation controls
│   ├── Companies.jsx                # Pending company approval queue
│   ├── Internships.jsx              # Platform-wide internship moderation
│   ├── Applications.jsx             # Read-only platform-wide application browser
│   └── AuditLogs.jsx                # Filterable admin audit log viewer
├── routes/
│   └── AppRoutes.jsx                # Extended: admin/* route branch
└── components/common/
    └── MainLayout.jsx               # Extended: ADMIN_SIDEBAR_ITEMS
```

---

## Database Changes

### New Table: `admin_audit_logs`

Created via `initializeDatabase()` on server startup. This table stores every action taken by an administrator.

```sql
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  actor_id    INT UNSIGNED NOT NULL,
  action      VARCHAR(100) NOT NULL,
  target_id   VARCHAR(50) DEFAULT NULL,
  details     TEXT DEFAULT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
);
```

Logged action types:

| Action | Trigger |
|---|---|
| `user_status_change` | Admin activates or deactivates a user account |
| `user_delete` | Admin permanently deletes a user account |
| `company_approval` | Admin approves or rejects a company profile |
| `internship_moderation` | Admin flags, removes, or restores an internship posting |

---

## API Endpoints

All routes are prefixed with `/api/admin` and require authentication + `admin` role.

### Users

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/users` | List all non-admin users. Supports `role`, `status`, `search`, `page`, `limit` query params. |
| `PATCH` | `/admin/users/:userId/status` | Activate (`active`) or deactivate (`deactivated`) a user account. |
| `DELETE` | `/admin/users/:userId` | Permanently delete a user account (cascades all related data). |

### Companies

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/companies/pending` | List company profiles with `approval_status = 'pending'`. Sourced from `view_pending_company_approvals`. |
| `PATCH` | `/admin/companies/:companyId/approval` | Approve or reject a pending company profile. Body: `{ decision, reason }`. |

### Internships

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/internships` | List all internship postings. Supports `status`, `companyId`, `page`, `limit`. |
| `PATCH` | `/admin/internships/:internshipId/moderate` | Apply moderation action. Body: `{ action: 'flagged' | 'removed' | 'restored', reason }`. |

### Applications

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/applications` | List all applications platform-wide. Supports `status`, `page`, `limit`. |

### Audit Logs

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/audit-logs` | Retrieve paginated admin audit log. Supports `actorId`, `action`, `startDate`, `endDate`, `page`, `limit`. |

---

## Frontend Pages

### Admin Dashboard (`/admin/dashboard`)

- Displays four KPI stat cards: Total Students, Total Companies, Active Internships, Total Applications.
- Shows recent audit log entries (last 5 actions).
- Renders the pending company approval queue with inline Approve/Reject actions.
- Data sourced from `GET /analytics/platform` and `GET /admin/companies/pending`.

### Manage Users (`/admin/users`)

- Tabular list of all students and companies.
- Filterable by `role` (student/company) and `account_status` (active/deactivated).
- Search by name or email.
- Actions:
  - **Activate / Deactivate** — toggles `account_status` via `PATCH /admin/users/:userId/status`.
  - **Delete** — permanently removes the account via `DELETE /admin/users/:userId`. Requires confirmation modal.
- Sends a notification to the user on status change.
- Paginates results (10 per page).

### Verify Companies (`/admin/companies`)

- Shows only companies with `approval_status = 'pending'`.
- Each row shows company name, logo, industry, contact, website, and registration date.
- **Approve** button — immediately approves without requiring a reason.
- **Reject** button — opens modal requiring a rejection reason (sent to company via notification).
- Queue auto-refreshes after every decision.

### Manage Internships (`/admin/internships`)

- Platform-wide internship listing with status badges: `published`, `draft`, `closed`, `flagged`, `removed`.
- Filterable by status.
- Action buttons are context-sensitive:
  - Published/Draft → **Flag** and **Remove**
  - Flagged → **Remove** and **Restore**
  - Removed → **Restore** only
- All moderation actions require a reason (except Restore), which is included in the audit log and notification sent to the company.

### View Applications (`/admin/applications`)

- Read-only table of all internship applications across the platform.
- Filterable by application status (`pending`, `accepted`, `rejected`, `withdrawn`).
- Row expansion reveals the student's cover letter, resume link, and rejection reason (if any).
- Pagination at 15 records per page.

### Audit Logs (`/admin/audit-logs`)

- Chronological log of all admin-performed actions.
- Filters: action type dropdown, date range (From Date / To Date).
- Each row shows:
  - Action icon + readable label
  - Admin actor name and email
  - Target entity ID
  - Action details string
  - Relative timestamp (e.g., "5m ago")
- "Clear Filters" button appears when any filter is active.
- Pagination at 20 records per page.

---

## Security Architecture

```
Request
  └── authenticate (JWT verification)
        └── authorize('admin') (role check)
              └── validateRequest (express-validator)
                    └── Controller handler
                          └── recordAuditLog (post-action)
```

- Admin accounts are never exposed in the `GET /admin/users` listing (`role != 'admin'` filter).
- Admins cannot change their own account status or delete themselves (self-protection check).
- All destructive actions are audit-logged before the response is sent.

---

## Notifications Integration

The admin module sends system notifications via `notificationModel.createNotification()` on the following events:

| Event | Recipient | Message |
|---|---|---|
| User status changed | Affected user | "Your account has been activated/deactivated..." |
| Company approved | Company owner | "Your company profile has been approved..." |
| Company rejected | Company owner | "Your company profile was rejected. Reason: ..." |
| Internship flagged/removed/restored | Company owner | "Your posting '{title}' has been {action}..." |

---

## Analytics Dependency

The Admin Dashboard stats card uses `GET /analytics/platform` which reads from the `view_platform_analytics` MySQL view, created in Component 09 (Analytics).

---

## Prerequisites

- Components 01–13 must be complete.
- MySQL views `view_platform_analytics` and `view_pending_company_approvals` must exist.
- `admin_audit_logs` table is auto-created via `initializeDatabase()` on server startup.

---

## Known Limitations

- The Applications view is read-only; admins cannot override application statuses (by design).
- Company approval only processes `pending` companies; re-evaluation of already-decided profiles is not supported.
- Audit log entries are immutable; there is no delete/purge mechanism (by design for accountability).
