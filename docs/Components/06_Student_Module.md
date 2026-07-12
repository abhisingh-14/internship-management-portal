# API Design Addendum — Student Module (Component 06)

**Related Document:** `docs/03_API_Design.md`
**Status:** To be merged into §8.2 ("Students") of the main API Design document.

Per `docs/05_Coding_Standards.md` §7 ("Every new endpoint added during
implementation must first be reflected in `docs/03_API_Design.md` before
being built"), this addendum documents every endpoint introduced by the
Student Module component. It supersedes/extends the `GET /students/profile`
and `PUT /students/profile` entries already present in the main document
(response shapes below reflect the education/skills normalization
performed in this component) and adds new endpoints for the dashboard,
education, and skills resources.

All endpoints below require `Authentication: Yes` and `User Role: Student`
unless noted otherwise.

---

## `GET /students/dashboard`

Returns a summary view for the student's dashboard landing page.

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Dashboard retrieved",
  "data": {
    "profile": {
      "id": 7,
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "bio": "Aspiring full-stack developer.",
      "resumeUrl": null
    },
    "educationCount": 2,
    "skillsCount": 5,
    "profileCompleteness": 75
  }
}
```

---

## `GET /students/profile` (updated response shape)

**Success Response:** `200 OK`
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "id": 7,
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "bio": "Aspiring full-stack developer.",
    "resumeUrl": null,
    "education": [
      {
        "id": 1,
        "studentId": 7,
        "institutionName": "State University",
        "degree": "B.Tech Computer Science",
        "fieldOfStudy": "Computer Science",
        "startDate": "2022-08-01",
        "endDate": null,
        "isCurrent": true,
        "grade": null,
        "description": null,
        "createdAt": "2026-07-12T10:00:00Z",
        "updatedAt": "2026-07-12T10:00:00Z"
      }
    ],
    "skills": [
      {
        "id": 3,
        "studentId": 7,
        "skillName": "React",
        "proficiencyLevel": "intermediate",
        "createdAt": "2026-07-12T10:00:00Z",
        "updatedAt": "2026-07-12T10:00:00Z"
      }
    ]
  }
}
```

## `PUT /students/profile` (updated request shape)

`education` and `skills` are **no longer accepted on this endpoint** — they
are managed exclusively through their own resource endpoints below.

**Request Body:**
```json
{ "name": "Jane Doe", "bio": "Aspiring full-stack developer." }
```

**Validation Rules:**
- `name`: optional, string, 2–100 characters.
- `bio`: optional (nullable), string, max 1000 characters.

---

## Education

#### `GET /students/education`
Returns all education entries for the authenticated student, ordered by
`startDate` descending.

#### `POST /students/education`
**Request Body:**
```json
{
  "institutionName": "State University",
  "degree": "B.Tech Computer Science",
  "fieldOfStudy": "Computer Science",
  "startDate": "2022-08-01",
  "endDate": null,
  "isCurrent": true,
  "grade": "8.7 CGPA",
  "description": "Relevant coursework: data structures, algorithms."
}
```
**Validation Rules:**
- `institutionName`: required, string, max 200 characters.
- `degree`: required, string, max 150 characters.
- `fieldOfStudy`: optional, string, max 150 characters.
- `startDate`: required, valid ISO date.
- `endDate`: optional, valid ISO date, must not be before `startDate`.
- `isCurrent`: optional, boolean.
- `grade`: optional, string, max 50 characters.
- `description`: optional, string, max 2000 characters.
**Success Response:** `201 Created` — returns the created education object.
**Error Responses:** `422 Unprocessable Entity`, `401`, `403`.

#### `PUT /students/education/:educationId`
Same field rules as `POST`, all optional; only supplied fields are
updated. Ownership is enforced — a student may only update their own
entries.
**Success Response:** `200 OK` — returns the updated education object.
**Error Responses:** `422`, `401`, `403`, `404 Not Found`.

#### `DELETE /students/education/:educationId`
**Success Response:** `204 No Content`
**Error Responses:** `401`, `403`, `404 Not Found`.

---

## Skills

#### `GET /students/skills`
Returns all skills for the authenticated student, alphabetically.

#### `POST /students/skills`
**Request Body:**
```json
{ "skillName": "React", "proficiencyLevel": "intermediate" }
```
**Validation Rules:**
- `skillName`: required, string, max 100 characters.
- `proficiencyLevel`: optional, one of `beginner`, `intermediate`,
  `advanced`, `expert` (defaults to `intermediate`).
**Success Response:** `201 Created`
**Error Responses:** `422`, `401`, `403`, `409 Conflict` (duplicate skill
name for this student).

#### `PUT /students/skills/:skillId`
Updates only `proficiencyLevel` (skill names are immutable via this
endpoint by design — renaming is delete + create, so two distinct skills
are never silently merged).
**Request Body:**
```json
{ "proficiencyLevel": "advanced" }
```
**Success Response:** `200 OK`
**Error Responses:** `422`, `401`, `403`, `404 Not Found`.

#### `DELETE /students/skills/:skillId`
**Success Response:** `204 No Content`
**Error Responses:** `401`, `403`, `404 Not Found`.

---

## Database Design Cross-Reference

This addendum should also be cross-referenced against an update to
`docs/02_Database_Design.md` §4.2 (`student_profiles`) and §2 (ERD): the
`education` and `skills` columns on `student_profiles` are removed, and two
new tables/entities — `student_education` and `student_skills` — are added,
each 1:N from `student_profiles`. See
`server/database/migrations/20260712_001_add_student_education_and_skills.sql`
for the DDL.
