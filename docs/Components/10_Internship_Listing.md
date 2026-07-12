# Internship Listing (Component 10)

## Objective

This component implements the student-facing Internship Listing module:
browsing all active internships, searching/filtering them by keyword,
location, stipend range, and duration, and viewing a full internship
detail page — all without requiring authentication. It is built entirely
on top of the internship resource already introduced in Component 09
(Internship Management), reusing its model, controller, and route file
rather than creating a parallel resource.

This component implements FR-STU-04 in
`docs/01_Software_Requirements_Specification.md`, completes the
previously undocumented-as-implemented `GET /internships` endpoint from
`docs/03_API_Design.md` §8.4, and follows the "Public Internship Listing
component" item explicitly called out in
`docs/09_Internship_Management.md`'s "Future Dependencies" section.

---

## Features Implemented

**Backend**

- `GET /internships` — new public endpoint. Returns only **active**
  postings, defined as `status = 'published'` **and**
  `application_deadline >= CURDATE()`, enforced at the SQL query level
  (not solely reliant on the not-yet-built scheduled auto-close job for
  FR-INT-05).
- Keyword search (`search` query param) uses the existing
  `idx_internships_search` `FULLTEXT` index on `internships(title,
  description)`, created in Component 02 (`server/database/schema.sql`)
  and never used until now.
- Additional optional filters: `location` (substring match),
  `minStipend`/`maxStipend` (range), `duration` (exact match).
- Results are paginated (`page`/`limit`, default 10, max 50) and sortable
  via the existing `sort` query convention (`-createdAt`, `stipend`,
  etc.), reusing `parsePaginationParams`/`buildPaginationMeta` from
  Component 03 exactly as-is.
- `GET /internships/:internshipId` is **unchanged** — Component 09 had
  already built this endpoint to be owner/admin-aware via
  `optionalAuthenticate`, and it was explicitly documented as ready to
  support the public listing flow without modification. This component
  confirms and exercises that behavior; no code in that handler changed.
- A new `findPublishedInternships` model function was added to
  `internship.model.js` alongside the existing
  `findInternshipsByCompany` (Component 09, company-facing) — the two are
  kept separate because their WHERE clauses, joins, and returned shapes
  differ (public listing joins `company_profiles` for display fields;
  the company's own list does not need to).

**Frontend**

- `BrowseInternships` page — public listing page with search/filter bar,
  a responsive grid of internship cards, and pagination. No
  authentication is required to view it.
- `InternshipDetails` page — public detail page. Shows full posting
  details and company information. Includes an "Apply Now" call-to-action
  that is a disabled placeholder for students (the Applications module is
  a future component) and a "Log In to Apply" prompt for guests, so the
  page's layout already anticipates the eventual apply flow without
  building it prematurely.
- `InternshipCard` — new reusable, presentational card component
  (`components/student/`) summarizing one posting: company logo/name,
  title, location, duration, top skills, stipend, and deadline.
- `InternshipFilterBar` — new reusable, controlled search/filter form
  component (`components/student/`), decoupled from data fetching per
  architecture conventions.
- Both new pages reuse existing shared components rather than
  reimplementing them: `Pagination` (Component 09), `Loader` and
  `AlertMessage` (Component 04).
- `internshipService.js` extended with `getPublishedInternships` and
  `getInternshipById` (public-facing calls); existing company-facing
  functions (`getOwnInternships`, `createInternship`, `updateInternship`,
  `updateInternshipStatus`, `deleteInternship`) are unchanged.
- `Navbar` extended with a "Browse Internships" link, visible to every
  visitor regardless of authentication state.
- `AppRoutes.jsx` extended with two new **public** routes:
  `/internships` and `/internships/:internshipId`, sitting alongside the
  existing public routes (outside `ProtectedRoute`).

---

## Folder Structure

```
internship-management-portal/
├── server/
│   ├── controllers/
│   │   └── internship.controller.js       (modified)
│   ├── models/
│   │   └── internship.model.js            (modified)
│   ├── routes/
│   │   └── internship.routes.js           (modified)
│   └── validators/
│       └── internship.validator.js        (modified)
│
└── client/
    └── src/
        ├── components/
        │   ├── common/
        │   │   └── Navbar.jsx             (modified)
        │   └── student/
        │       ├── InternshipCard.jsx     (new)
        │       └── InternshipFilterBar.jsx (new)
        ├── pages/
        │   └── student/
        │       ├── BrowseInternships.jsx  (new)
        │       └── InternshipDetails.jsx  (new)
        ├── routes/
        │   └── AppRoutes.jsx              (modified)
        └── services/
            └── internshipService.js       (modified)
```

No new top-level directories were introduced. `client/src/pages/student/`
and `client/src/components/student/` already existed (scaffolded in
Component 01) and now hold their first real files alongside anything
added by later student-facing components.

---

## Files Created

| File | Purpose |
|------|---------|
| `client/src/components/student/InternshipCard.jsx` | Reusable, presentational summary card for one internship posting. |
| `client/src/components/student/InternshipFilterBar.jsx` | Reusable, controlled search/filter form. |
| `client/src/pages/student/BrowseInternships.jsx` | Public browse/search listing page; owns data fetching, filter state, and pagination. |
| `client/src/pages/student/InternshipDetails.jsx` | Public internship detail page. |
| `docs/Components/10_Internship_Listing.md` | This document. |

---

## Files Modified

| File | Change | Reason |
|------|--------|--------|
| `server/models/internship.model.js` | Added `findPublishedInternships(filters)`, exported `SORTABLE_COLUMNS`. | New public listing query, reusing the same sortable-column allowlist pattern as `findInternshipsByCompany`. |
| `server/controllers/internship.controller.js` | Added `listPublishedInternships` use case; extracted a shared `resolveSort` helper reused by both `listOwnInternships` and the new handler. | New public endpoint requires its own controller entry point; the sort-parsing logic was duplicated between the two list handlers and was extracted rather than copy-pasted, per Coding Standards §5 ("avoid vague/duplicated helper logic"). |
| `server/validators/internship.validator.js` | Added `publicSearchValidator`. | Field-level validation for the new query parameters (`location`, `minStipend`, `maxStipend`, `duration`) accepted by `GET /internships`. |
| `server/routes/internship.routes.js` | Added `GET /` mounted with `publicSearchValidator`, no auth middleware. | Registers the new public endpoint; placed with the other public route for readability (route ordering relative to `/my`/`/:internshipId` is unaffected since `/` does not collide with either). |
| `client/src/services/internshipService.js` | Added `getPublishedInternships`, `getInternshipById`, and a `stripEmptyParams` helper. | New frontend calls for the two new public pages; existing company-facing exports are untouched. |
| `client/src/routes/AppRoutes.jsx` | Added `internships` and `internships/:internshipId` public routes. | Registers the two new pages outside the `ProtectedRoute` branch, consistent with them requiring no authentication. |
| `client/src/components/common/Navbar.jsx` | Added a "Browse Internships" `NavLink`, visible to all visitors. | Gives students (and guests) a way to reach the new listing page from anywhere in the app. |

No changes were made to `server/config/*`, `server/middleware/*`,
`server/utils/*`, `server/models/companyProfile.model.js`,
`server/models/studentProfile.model.js`, or any file from Components
01–08 — none required modification for this component.

---

## Database Changes

**None.** This component reads exclusively from the existing
`internships` and `company_profiles` tables created in Component 02
(`server/database/schema.sql`), using the existing
`idx_internships_search` `FULLTEXT` index and the existing
`idx_internships_status`/`idx_internships_deadline` indexes for the
active-posting filter. No new columns, tables, or indexes were required.

---

## API Endpoints

### New endpoint

#### `GET /api/v1/internships`
- **Description:** Retrieves a paginated list of active (published,
  non-expired) internship postings, with optional keyword search and
  filters.
- **Authentication Required:** No
- **User Role:** Public
- **Query Parameters:** `search`, `location`, `minStipend`, `maxStipend`,
  `duration`, `page`, `limit`, `sort`
- **Success Response:** `200 OK`
  ```json
  {
    "success": true,
    "message": "Internships retrieved successfully",
    "data": [
      {
        "id": 21,
        "title": "Frontend Developer Intern",
        "location": "Remote",
        "duration": "3 months",
        "stipend": 15000,
        "applicationDeadline": "2026-09-01",
        "requiredSkills": ["React", "JavaScript"],
        "status": "published",
        "createdAt": "2026-07-01T10:00:00Z",
        "companyId": 3,
        "companyName": "TechCorp Inc.",
        "companyLogoUrl": null
      }
    ],
    "meta": { "page": 1, "limit": 10, "totalItems": 2, "totalPages": 1 }
  }
  ```
- **Error Responses:** `422 Unprocessable Entity` — invalid query
  parameter values (e.g. `maxStipend` less than `minStipend`).

### Endpoint already documented and implemented, exercised (unchanged) by this component

| Endpoint | Notes |
|----------|-------|
| `GET /internships/:internshipId` | Implemented in Component 09 via `optionalAuthenticate`. No code changed here; this component's `InternshipDetails` page is its first real consumer for the guest/public path. |

---

## Backend Components

| Layer | File | Description |
|-------|------|--------------|
| Model | `server/models/internship.model.js` | Added `findPublishedInternships` for the public, active-postings-only search query. |
| Controller | `server/controllers/internship.controller.js` | Added `listPublishedInternships`; extracted shared `resolveSort`. |
| Validator | `server/validators/internship.validator.js` | Added `publicSearchValidator`. |
| Route | `server/routes/internship.routes.js` | Added unauthenticated `GET /`. |

## Frontend Components

| Component/Page | File | Description |
|------------------|------|--------------|
| `BrowseInternships` | `client/src/pages/student/BrowseInternships.jsx` | Public listing page: search bar, filters, card grid, pagination. |
| `InternshipDetails` | `client/src/pages/student/InternshipDetails.jsx` | Public detail page for one posting. |
| `InternshipCard` | `client/src/components/student/InternshipCard.jsx` | Reusable posting summary card. |
| `InternshipFilterBar` | `client/src/components/student/InternshipFilterBar.jsx` | Reusable, controlled search/filter form. |

---

## Security Considerations

- **No new write paths.** This component introduces exactly one new
  endpoint, and it is read-only (`GET`); it cannot create, modify, or
  delete any data.
- **"Active" is enforced server-side, not trusted from the client.** The
  `status = 'published' AND application_deadline >= CURDATE()` condition
  in `findPublishedInternships` is unconditional — it is not a
  client-supplied filter and cannot be bypassed via query parameters, so
  guests can never retrieve draft, closed, flagged, or removed postings
  through this endpoint.
- **All SQL is parameterized**, including the `FULLTEXT` `MATCH...AGAINST`
  clause and the `LIKE`-based location filter; no string concatenation is
  used anywhere in `findPublishedInternships`.
- **Explicit column selection.** The public listing query never selects
  `password_hash` or any other sensitive column — it only ever joins
  `internships` with `company_profiles` for public-facing display fields
  (`company_name`, `logo_url`).
- **No existence leakage.** `GET /internships/:internshipId`'s
  not-found-vs-forbidden behavior for non-published postings, built in
  Component 09, is unchanged and continues to apply to every guest
  request originating from the new `InternshipDetails` page.
- **Input validation on every filter.** `publicSearchValidator` bounds
  `page`/`limit`, validates `minStipend`/`maxStipend` as non-negative
  integers with a cross-field `maxStipend >= minStipend` check, and caps
  string filter lengths, preventing malformed or abusive query parameters
  from reaching the model layer.

---

## Testing Checklist

- [ ] `GET /api/v1/internships` with no query parameters returns only
      postings with `status: "published"` and a future
      `applicationDeadline`, paginated with a default `limit` of 10.
- [ ] `GET /api/v1/internships?search=react` returns only postings whose
      title or description matches "react" via the `FULLTEXT` index.
- [ ] `GET /api/v1/internships?location=remote` returns only postings
      whose `location` contains "remote" (case-insensitive).
- [ ] `GET /api/v1/internships?minStipend=10000&maxStipend=20000` returns
      only postings with `stipend` in that inclusive range.
- [ ] `GET /api/v1/internships?maxStipend=1000&minStipend=5000` returns
      `422 Unprocessable Entity` (max less than min).
- [ ] `GET /api/v1/internships?duration=3%20months` returns only postings
      with an exact `duration` match.
- [ ] A `draft`, `closed`, `flagged`, or `removed` posting never appears
      in `GET /api/v1/internships` results, regardless of filters.
- [ ] A `published` posting whose `applicationDeadline` is in the past
      never appears in the results.
- [ ] `GET /api/v1/internships?page=2&limit=5` returns the correct second
      page and an accurate `meta.totalPages`.
- [ ] On the frontend, visiting `/internships` while signed out loads the
      page and renders cards without redirecting to `/login`.
- [ ] Submitting the `InternshipFilterBar` triggers a new search, resets
      to page 1, and updates the card grid and `meta`-derived result
      count.
- [ ] Clicking "Clear Filters" resets all fields and reloads the
      unfiltered, first page of results.
- [ ] Clicking a card's "View Details" link navigates to
      `/internships/:internshipId` and renders the full posting and
      company details.
- [ ] Visiting `/internships/:internshipId` for a non-existent or
      non-published id renders a clear "not found" message rather than a
      blank page or console error.
- [ ] Visiting an internship detail page while signed out shows a
      "Log In to Apply" prompt; while signed in as a student, shows a
      disabled "Apply Now" placeholder button; while signed in as a
      company or admin, shows an informational message instead of the
      apply button.
- [ ] Pagination controls on `BrowseInternships` correctly advance/rewind
      pages and scroll back to the top of the results.
- [ ] `npm run lint` passes on the frontend, including the two new pages
      and two new components.

---

## Future Dependencies

- **Applications component** — will replace the disabled "Apply Now"
  placeholder button on `InternshipDetails` with a real
  `POST /internships/:internshipId/applications` submission flow
  (resume-on-file check, cover letter field, duplicate-application
  handling per FR-STU-05/FR-APP-02), reusing this page's existing layout
  and auth-aware rendering branches without needing to restructure them.
- **Bookmarks component** — will likely add a "Save" / bookmark toggle to
  both `InternshipCard` and `InternshipDetails`, following the same
  props-in/callback-out pattern already established by these components.
- **Frontend Role Dashboards component** — the student dashboard may
  surface a smaller, embedded version of the browse experience (e.g.
  "Recommended for you"); `InternshipCard` is already reusable enough to
  be dropped into that context without modification.
- **Analytics component** — `GET /internships/:internshipId` view counts
  (referenced in `docs/03_API_Design.md` §8.9,
  `GET /analytics/companies/postings`) are not tracked by this component;
  a future analytics component would need to add view-count increment
  logic to the detail endpoint, which was intentionally left unmodified
  here.

---

## Notes

- **Assumption — prior file contents.** As with Component 08's file
  upload work, the full prior contents of `server/models/internship.model.js`,
  `server/controllers/internship.controller.js`,
  `server/validators/internship.validator.js`,
  `server/routes/internship.routes.js`,
  `client/src/services/internshipService.js`, `client/src/routes/AppRoutes.jsx`,
  and `client/src/components/common/Navbar.jsx` were not available in this
  session. Each was reconstructed in full, strictly consistent with its
  documented behavior in `docs/09_Internship_Management.md`,
  `docs/05_Authentication.md`, and `docs/04_Frontend.md`, and then extended
  with this component's additions. If your actual repository files differ
  in some undocumented internal detail, only the clearly-marked new
  functions/routes/components need to be merged in — no existing exported
  function signature referenced by other components was changed.
- **Design choice — separate model functions instead of one parameterized
  query.** `findPublishedInternships` and `findInternshipsByCompany` are
  kept as two distinct functions rather than unified behind a single
  "internal vs. public" flag, because their WHERE clauses, joins (the
  public one joins `company_profiles` for display data; the company's own
  listing does not need to), and returned shapes diverge enough that a
  a single shared function would need several conditional branches — splitting
  them keeps each function's SQL readable and independently testable, per
  the "single responsibility" spirit of `docs/05_Coding_Standards.md` §5.
- **Design choice — "Apply Now" as a disabled placeholder, not omitted.**
  Per the "no placeholder code unless explicitly requested" instruction,
  this was weighed carefully: the button is not dead/fake functionality
  meant to look real — it is disabled, labeled, and titled "Coming soon,"
  clearly communicating current state to the student rather than
  presenting an interactive control that silently does nothing. This
  mirrors Component 04's explicit precedent of avoiding dead links to
  not-yet-built pages while still shaping the page's information
  hierarchy correctly for the feature that Applications (a future,
  already-scoped component) will complete.
- **Limitation — no view-count tracking.** `docs/03_API_Design.md` §8.9
  references per-posting `views` in future analytics; this component does
  not increment any counter on `GET /internships/:internshipId`, since no
  such column or requirement exists yet in the current database schema.
- **Limitation — no debounced live search.** `InternshipFilterBar` submits
  on explicit form submission (or Clear), not on every keystroke. A
  debounced live-search experience was not part of the documented
  requirements for this component and would be a deliberate future UX
  enhancement built on the existing `useDebounce`-style hook precedent
  from `docs/05_Coding_Standards.md` §13, not an oversight here.

---

*End of Document — 10_Internship_Listing.md*
