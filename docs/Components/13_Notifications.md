# Component 13 — Notifications

## Overview

The Notifications module delivers in-app messages to authenticated users whenever a key event occurs on the platform — such as when a student's application status is updated by a company recruiter. The module supports viewing, filtering, bulk/individual marking as read, and deletion of notification entries. An unread-count badge is shown on the navbar bell icon and automatically polled every 30 seconds.

---

## Features

| Feature | Description |
|---|---|
| **View Notifications** | Paginated list of in-app notifications filtered by All or Unread |
| **Unread Count Badge** | Bell icon in the navbar shows unread count; polls every 30 s |
| **Mark as Read** | Single notification or all at once |
| **Delete Notification** | Permanently remove a notification (with confirmation modal) |

---

## Database

The `notifications` table was already defined in [schema.sql](file:///h:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/server/database/schema.sql):

```sql
CREATE TABLE notifications (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,      -- FK → users(id)
    type        VARCHAR(50) NOT NULL,
    title       VARCHAR(150) NOT NULL,
    message     TEXT NOT NULL,
    is_read     BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_notifications_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_notifications_user_id_is_read (user_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

No migration was required — the table was present from the initial schema.

---

## Backend

### File Structure

```
server/
├── models/
│   └── notification.model.js          ← Extended (was create-only)
├── validators/
│   └── notification.validator.js      ← New
├── controllers/
│   └── notification.controller.js     ← New
└── routes/
    ├── notification.routes.js         ← New
    └── index.js                       ← Modified (uncommented mount)
```

### Model — `notification.model.js`

Extended from a single `createNotification` function to a full data access layer:

| Function | Purpose |
|---|---|
| `createNotification({ userId, type, title, message })` | Insert a new notification row |
| `findById(notificationId)` | Retrieve a single notification by PK |
| `findUserNotifications(userId, { unreadOnly, limit, offset })` | Paginated list for a user |
| `markAsRead(notificationId, userId)` | Set `is_read = TRUE` for one notification |
| `markAllAsRead(userId)` | Set `is_read = TRUE` for all unread of a user |
| `getUnreadCount(userId)` | Count of unread notifications for a user |
| `deleteNotification(notificationId, userId)` | Hard-delete a single notification |

### Validator — `notification.validator.js`

| Validator | Fields validated |
|---|---|
| `queryValidator` | `unreadOnly` (boolean), `page` (int ≥ 1), `limit` (1–50) |
| `notificationIdParamValidator` | `:notificationId` (positive integer) |

### Controller — `notification.controller.js`

| Handler | Route | Description |
|---|---|---|
| `getNotifications` | `GET /notifications` | Paginated notification list |
| `getUnreadCount` | `GET /notifications/unread-count` | Returns `{ count: N }` |
| `markRead` | `PATCH /notifications/:id/read` | Marks one notification read; verifies ownership |
| `markAllRead` | `PATCH /notifications/read-all` | Marks all unread as read |
| `deleteNotification` | `DELETE /notifications/:id` | Deletes one; verifies ownership |

### Routes — `notification.routes.js`

All routes require the `authenticate` middleware (JWT Bearer). No role restriction — all authenticated user roles may use these endpoints.

```
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PATCH  /api/v1/notifications/read-all
PATCH  /api/v1/notifications/:notificationId/read
DELETE /api/v1/notifications/:notificationId
```

### Notification Triggers

Notifications are created automatically when the `updateApplicationStatus` handler in [application.controller.js](file:///h:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/server/controllers/application.controller.js) changes an application status:

| Status | Notification Message |
|---|---|
| `under_review` | "Your application for "…" is now under review." |
| `shortlisted` | "Congratulations! You have been shortlisted for "…"." |
| `accepted` | "Wonderful news! Your application for "…" has been accepted." |
| `rejected` | "Thank you for applying. Unfortunately, your application for "…" was not selected." |

---

## Frontend

### File Structure

```
client/src/
├── services/
│   └── notificationService.js         ← New
├── components/common/
│   └── Navbar.jsx                     ← Modified (bell icon + polling)
│   └── MainLayout.jsx                 ← Modified (sidebar links)
├── routes/
│   └── AppRoutes.jsx                  ← Modified (/notifications route)
└── pages/shared/
    └── Notifications.jsx              ← New
```

### Service — `notificationService.js`

Axios wrappers for all 5 backend endpoints:

```js
getNotifications(filters)          // GET /notifications
getUnreadCount()                   // GET /notifications/unread-count
markNotificationAsRead(id)         // PATCH /notifications/:id/read
markAllNotificationsAsRead()       // PATCH /notifications/read-all
deleteNotification(id)             // DELETE /notifications/:id
```

### Navbar Bell Icon — `Navbar.jsx`

When the user is authenticated:
- A bell icon (`bi-bell`) with a red badge shows the unread notification count.
- The count is fetched on mount and **re-polled every 30 seconds** via `setInterval`.
- A custom `notifications:updated` browser event is listened to, allowing the Notifications page to push badge refreshes without waiting for the polling interval.
- Clicking the bell navigates to `/notifications`.
- On mobile, "Notifications" appears as text alongside the icon.

### Sidebar Links — `MainLayout.jsx`

"Notifications" added to both `STUDENT_SIDEBAR_ITEMS` and `COMPANY_SIDEBAR_ITEMS` pointing to `/notifications`.

### Route — `AppRoutes.jsx`

```jsx
<Route element={<ProtectedRoute />}>
  <Route path="notifications" element={<Notifications />} />
  ...
</Route>
```

Accessible to any authenticated role (student, company, admin).

### Page — `Notifications.jsx`

Located at `client/src/pages/shared/Notifications.jsx`.

**UI Features:**
- **Tab filter buttons:** "All Notifications" / "Unread Only"
- **Card list:** Each notification shows title, message body, timestamp, and a "New" badge if unread
- **Unread cards** have a left blue border and bold title
- **Read cards** are muted grey
- **Actions per card:**
  - ✅ Green checkmark — mark as read (only shown on unread cards)
  - 🗑 Red trash — delete notification (opens confirmation, then deletes)
- **"Mark All as Read" button** shown at the top if any unread notifications exist
- **Empty state:** Shows a "You are all caught up!" message with a bell-slash icon
- **Pagination** — 10 items per page
- **`notifications:updated` event** dispatched after every mutation, so the navbar badge updates in real time

---

## Also Fixed in This Session

### Bug: "You must upload a resume" shown incorrectly

**Cause:** `studentProfile.model.js → findByUserId()` returned raw SQL row (with `resume_url`) instead of passing it through `mapProfileRow()`, so the camelCase `resumeUrl` field accessed by the controller was always `undefined`.

**Fix:** Changed the return on line 81 of [studentProfile.model.js](file:///h:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/server/models/studentProfile.model.js):
```diff
-  return rows[0] || null;
+  return mapProfileRow(rows[0] || null);
```
Also fixed 3 stale `profile.resume_url` references in [student.controller.js](file:///h:/C-files_abhinav/abhinav_vscode/3rd year Internship/Projects/internship-management-portal/server/controllers/student.controller.js) to use `profile.resumeUrl`.

### Bug: Withdraw button did nothing

**Cause:** `window.confirm()` was silently suppressed by the browser.

**Fix:** Replaced with an inline Bootstrap modal confirmation dialog in [StudentApplications.jsx](file:///h:/C-files_abhinav/abhinav_vscode/3rd%20year%20Internship/Projects/internship-management-portal/client/src/pages/student/StudentApplications.jsx).

---

## API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Any authenticated | List notifications (paginated, filterable) |
| `GET` | `/api/v1/notifications/unread-count` | Any authenticated | Get unread count |
| `PATCH` | `/api/v1/notifications/read-all` | Any authenticated | Mark all as read |
| `PATCH` | `/api/v1/notifications/:notificationId/read` | Owner only | Mark one as read |
| `DELETE` | `/api/v1/notifications/:notificationId` | Owner only | Delete one notification |

---

## Verification Checklist

- [x] `notifications` table confirmed in schema.sql
- [x] Notification model methods verified via code review
- [x] `createNotification` called on `PATCH /applications/:id/status`
- [x] Navbar bell icon renders with polling logic
- [x] Notifications page accessible at `/notifications` for student + company roles
- [x] Mark-as-read updates `is_read = TRUE` and dispatches `notifications:updated` event
- [x] Delete removes the row and dispatches `notifications:updated` event
- [x] All routes protected by `authenticate` middleware
