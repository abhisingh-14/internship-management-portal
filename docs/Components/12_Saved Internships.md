# Saved Internships (Component 12)

## Objective

The Saved Internships (Bookmarks) module enables students to bookmark internships for future reference. This includes:
- Bookmarking a published internship posting.
- Removing a bookmarked internship.
- Viewing a paginated list of all saved internships.

---

## Features Implemented

### Backend

- **Database Junction Table (`saved_internships`):** Reuses the `saved_internships` table structure designed in Component 02, including foreign key cascades (`student_profiles.id`, `internships.id`) and unique constraint checks to prevent duplicate saves.
- **Saved Internship Model (`savedInternship.model.js`):**
  - Parameterized database operations: `findBookmark` (existence check), `createBookmark` (insert), `deleteBookmark` (delete), and `findStudentBookmarks` (paginated retrieval joined with corresponding company profiles).
- **Saved Internship Validator (`savedInternship.validator.js`):**
  - Custom param validators verifying that the `:internshipId` is a positive integer.
  - Page and limit queries schema validation.
- **Saved Internship Controller (`savedInternship.controller.js`):**
  - Business logic verifying student role, validating existence and `published` status of internship posting before bookmarking, preventing duplicate saves (`409 Conflict`), and deleting bookmark entries (`404 Not Found` if the bookmark does not exist).
- **Route Definitions (`savedInternship.routes.js`):**
  - Mounted endpoints on `/bookmarks`:
    - `POST /bookmarks/:internshipId` (Save)
    - `DELETE /bookmarks/:internshipId` (Remove)
    - `GET /bookmarks` (List Saved)

### Frontend

- **Saved Internship Service (`savedInternshipService.js`):**
  - Axios wrappers: `saveInternship`, `removeSavedInternship`, and `getSavedInternships`.
- **Sidebar Integration (`MainLayout.jsx`):**
  - Appends a "Saved Internships" navigation item in the student sidebar linking to `/student/saved`.
- **Saved Internships Page (`SavedInternships.jsx`):**
  - A clean, responsive list view presenting all student bookmarks with Details navigation and bookmark removal action.
- **Internship Details Page integration (`InternshipDetails.jsx`):**
  - Renders a toggle button (heart icon) next to the internship title for student roles.
  - Dynamically updates saved/unsaved status and queries bookmarks state on mount.

---

## Folder Structure

```
internship-management-portal/
├── server/
│   ├── controllers/
│   │   └── savedInternship.controller.js  (new)
│   ├── models/
│   │   └── savedInternship.model.js       (new)
│   ├── routes/
│   │   ├── index.js                       (modified)
│   │   └── savedInternship.routes.js      (new)
│   └── validators/
│       └── savedInternship.validator.js   (new)
│
└── client/
    └── src/
        ├── components/
        │   └── student/
        │       └── InternshipDetails.jsx  (modified)
        ├── pages/
        │   └── student/
        │       └── SavedInternships.jsx   (new)
        ├── routes/
        │   └── AppRoutes.jsx              (modified)
        └── services/
            └── savedInternshipService.js  (new)
```

---

## Architectural Decisions

1. **Existence/Status Check on Save:** To keep data consistent and ensure users only bookmark active postings, saving is rejected if the internship is missing or is not in `published` status.
2. **Duplicate Prevention:** Using a database-level `UNIQUE (student_id, internship_id)` constraint together with application-level checks ensures bookmarks remain unique and race-free.

---

## Verification

### API Verification
Verify routes using cURL or raw HTTP REST requests:
- `POST /api/v1/bookmarks/:internshipId` (response: `201 Created`)
- `DELETE /api/v1/bookmarks/:internshipId` (response: `204 No Content`)
- `GET /api/v1/bookmarks` (response: `200 OK`)

### Manual Verification Flow
1. Log in as a student user.
2. Browse postings under "Browse Internships".
3. Navigate to a listing's detail page, click "Save" next to the title (button turns into red heart "Saved").
4. Visit "Saved Internships" from the student sidebar, confirm the listing is shown in the table.
5. Click the trash icon in the actions column to remove the bookmark.
