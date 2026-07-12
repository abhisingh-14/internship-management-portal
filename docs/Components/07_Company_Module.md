# API Design Addendum — Company Module (Component 07)

**Related Document:** `docs/03_API_Design.md`
**Status:** To be merged into §8.3 ("Companies") of the main API Design document.

Per `docs/05_Coding_Standards.md` §7 ("Every new endpoint added during
implementation must first be reflected in `docs/03_API_Design.md` before
being built"), this addendum documents every endpoint introduced by the
Company Module component. It extends the `GET /companies/profile` and
`PUT /companies/profile` entries already present in the main document and
adds the new endpoint for the dashboard resource.

All endpoints below require `Authentication: Yes` and `User Role: Company`
unless noted otherwise.

---

## `GET /companies/dashboard`

Returns a summary view for the authenticated company's dashboard landing page,
including a profile snapshot, profile completeness percentage, and internship
posting stats.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Dashboard retrieved",
  "data": {
    "profile": {
      "id": 3,
      "companyName": "TechCorp Inc.",
      "approvalStatus": "approved",
      "logoUrl": null
    },
    "profileCompleteness": 50,
    "internshipStats": {
      "total": 5,
      "draft": 1,
      "published": 2,
      "closed": 2,
      "flagged": 0,
      "removed": 0
    }
  }
}
```

---

## `GET /companies/profile`

Returns the authenticated company's full profile details.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": 3,
    "companyName": "TechCorp Inc.",
    "description": "We build developer tools.",
    "website": "https://techcorp.com",
    "industry": "Software",
    "logoUrl": null,
    "approvalStatus": "approved",
    "createdAt": "2026-07-12T10:00:00Z",
    "updatedAt": "2026-07-12T10:00:00Z"
  }
}
```

---

## `PUT /companies/profile`

Updates the authenticated company's editable profile fields.

`approvalStatus` and `logoUrl` are **not accepted on this endpoint** —
`approvalStatus` is admin-only, and `logoUrl` is managed via the file
upload endpoints (Component 08/Component 15).

**Request Body:**
```json
{
  "companyName": "TechCorp Inc.",
  "description": "We build developer tools.",
  "website": "https://techcorp.com",
  "industry": "Software"
}
```

**Validation Rules:**
- `companyName`: optional, string, 2–150 characters.
- `description`: optional (nullable), string, max 2000 characters.
- `website`: optional (nullable), string, must be a valid URL format.
- `industry`: optional (nullable), string, max 100 characters.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": 3,
    "companyName": "TechCorp Inc.",
    "description": "We build developer tools.",
    "website": "https://techcorp.com",
    "industry": "Software",
    "logoUrl": null,
    "approvalStatus": "approved",
    "createdAt": "2026-07-12T10:00:00Z",
    "updatedAt": "2026-07-12T10:20:00Z"
  }
}
```

**Error Responses:**
- `422 Unprocessable Entity` — validation failures (e.g. invalid URL, invalid string lengths).
- `401 Unauthorized` — missing/invalid token.
- `403 Forbidden` — non-company role.

---

## Database Design Cross-Reference

This addendum maps directly onto `docs/02_Database_Design.md` §4.3 (`company_profiles`).
The editable fields are stored in the corresponding columns:
- `companyName` -> `company_name`
- `description` -> `description`
- `website` -> `website`
- `industry` -> `industry`

No schema changes were required for this component since the columns were pre-provisioned in `server/database/schema.sql`. Note that:
- The `logo_url` column exists but remains `null` until the logo upload feature (Component 08/Component 15) is implemented.
- The `approval_status` column maps to `approvalStatus` in the API contract. Upon registration, it defaults to `'pending'`.
