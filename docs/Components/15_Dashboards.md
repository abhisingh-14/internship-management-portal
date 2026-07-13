# Component 15 — Dashboards

## Overview

Component 15 introduces dedicated dashboard pages for all three user roles: **Student**, **Company**, and **Admin**. Each dashboard provides role-specific summary statistics using Bootstrap cards, a profile summary section, and a panel showing the most recent notifications.

---

## Scope

| Dashboard      | Route                  | Access Role |
|----------------|------------------------|-------------|
| Student        | `/student/dashboard`   | `student`   |
| Company        | `/company/dashboard`   | `company`   |
| Admin          | `/admin/dashboard`     | `admin`     |

---

## Files Changed / Created

### New Files

| File | Purpose |
|------|---------|
| `client/src/pages/student/Dashboard.jsx` | Student Dashboard page (new) |
| `client/src/services/studentService.js`  | Service functions for student dashboard and activity analytics |

### Modified Files

| File | Change |
|------|--------|
| `client/src/pages/company/Dashboard.jsx` | Enhanced with Applications Received card and Recent Notifications |
| `client/src/pages/admin/Dashboard.jsx`   | Added Recent Notifications section |
| `client/src/routes/AppRoutes.jsx`        | `/student/dashboard` now renders `StudentDashboard` instead of redirecting |
| `client/src/components/common/MainLayout.jsx` | Added "Dashboard" to student sidebar navigation |

---

## Backend API Endpoints Used

> No new backend routes were added. All dashboards consume existing endpoints.

| Endpoint | Role | Returns |
|----------|------|---------|
| `GET /students/dashboard` | student | Profile snapshot, education/skill counts, profile completeness % |
| `GET /analytics/students/activity` | student | `applicationsSubmitted`, `shortlisted`, `accepted`, `bookmarksCount` |
| `GET /companies/dashboard` | company | Profile snapshot, profile completeness %, internship stats by status |
| `GET /analytics/companies/postings` | company | Per-posting applicant counts (used to derive total applications received) |
| `GET /analytics/platform` | admin | Platform-wide stats: students, companies, pending approvals, internships, applications |
| `GET /notifications` | all roles | Paginated list of notifications (dashboards fetch `limit=5` for recent items) |

---

## Student Dashboard (`/student/dashboard`)

### Features

- **Profile Summary** card — avatar, name, email, bio, resume status badge
- **Profile Completeness** progress bar (color coded: green ≥75%, yellow ≥40%, red <40%)
- **4 Bootstrap stat cards:**
  - Total Applications Submitted
  - Saved Internships (bookmarks)
  - Shortlisted Applications
  - Accepted Applications
- **Recent Notifications** panel — up to 5 latest notifications, unread highlighted with a left blue border

### Data Sources

All data is fetched in parallel with `Promise.all` on mount:

```js
const [profileData, activityData, notifData] = await Promise.all([
  fetchStudentDashboard(),      // /students/dashboard
  fetchStudentActivity(),        // /analytics/students/activity
  getNotifications({ page: 1, limit: 5 }),
]);
```

### Component File

[Dashboard.jsx](file:///H:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/client/src/pages/student/Dashboard.jsx)

---

## Company Dashboard (`/company/dashboard`)

### Features

- Company name header + `ApprovalStatusBadge`
- Approval/rejection alert banner (for pending/rejected companies)
- **Profile Completeness** bar (`ProfileCompletenessBar` component)
- **4 Bootstrap stat cards:**
  - Total Postings
  - Total Applications Received (aggregated from `analytics/companies/postings`)
  - Published Listings
  - Draft + Closed Listings (combined, with breakdown in sub-text)
- **Recent Notifications** panel — up to 5 latest notifications

### Data Sources

```js
const [data, postingsAnalytics, notifData] = await Promise.all([
  fetchCompanyDashboard(),             // /companies/dashboard
  fetchCompanyPostingsAnalytics(),     // /analytics/companies/postings
  getNotifications({ page: 1, limit: 5 }),
]);
```

The `totalApplicationsReceived` is computed client-side by summing `applicantCount` across all posting analytics rows.

### Component File

[Dashboard.jsx](file:///H:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/client/src/pages/company/Dashboard.jsx)

---

## Admin Dashboard (`/admin/dashboard`)

### Features (pre-existing + additions)

- **6 Bootstrap stat cards** (pre-existing from Component 14):
  - Total Students
  - Total Companies
  - Pending Verifications
  - Active Internships
  - Total Internships
  - Total Applications
- **Company Verification Queue** table — top 5 pending companies with Approve/Reject actions (pre-existing)
- **Recent Notifications panel** *(new in Component 15)* — up to 5 latest admin notifications

### Data Sources

```js
const [statsData, pendingData, notifData] = await Promise.all([
  adminService.fetchPlatformAnalytics(),       // /analytics/platform
  adminService.fetchPendingCompanies({ limit: 5 }),
  getNotifications({ page: 1, limit: 5 }),
]);
```

### Component File

[Dashboard.jsx](file:///H:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/client/src/pages/admin/Dashboard.jsx)

---

## Service Layer

### `studentService.js` (new)

| Export | Endpoint | Description |
|--------|----------|-------------|
| `fetchStudentDashboard()` | `GET /students/dashboard` | Profile snapshot + completeness |
| `fetchStudentActivity()` | `GET /analytics/students/activity` | Application counts + bookmarks |

[studentService.js](file:///H:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/client/src/services/studentService.js)

---

## Routing & Navigation

### AppRoutes.jsx

The `/student/dashboard` route previously used a `<Navigate>` redirect to `/student/applications`. It now renders the new `StudentDashboard` component directly.

```jsx
// Before (Component 06–14)
<Route path="student/dashboard" element={<Navigate to="/student/applications" replace />} />

// After (Component 15)
<Route path="student/dashboard" element={<StudentDashboard />} />
```

### Sidebar (MainLayout.jsx)

The student sidebar now includes a **Dashboard** link as the first item:

```js
const STUDENT_SIDEBAR_ITEMS = [
  { label: 'Dashboard', path: '/student/dashboard' },
  { label: 'Browse Internships', path: '/internships' },
  { label: 'My Applications', path: '/student/applications' },
  { label: 'Saved Internships', path: '/student/saved' },
  { label: 'Notifications', path: '/notifications' },
];
```

---

## Design Notes

- All dashboards use **Bootstrap card components** with semantic colour variants (`bg-primary-subtle`, `bg-success-subtle`, etc.) for the stat cards.
- Each stat card includes a **contextual icon** (Bootstrap Icons) and a **navigation link** where applicable.
- Unread notifications are visually distinguished with a `border-start border-4 border-primary` highlight and `fw-semibold` text weight.
- All data fetching uses `Promise.all` for parallel requests to minimise load time.
- Each dashboard handles loading (`<Loader />`) and error (`<AlertMessage type="danger">`) states gracefully.

---

## Database Changes

None. Component 15 does not introduce any database schema or seed changes.
