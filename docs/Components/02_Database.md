# Database

## Objective

This component implements the production-ready MySQL relational schema for
the Internship Management Portal, exactly as specified in
`docs/02_Database_Design.md`: seven core tables, all foreign keys with
explicit cascade rules, all constraints (primary keys, unique keys), and
all indexes documented in the Database Design document's §4–§7. It also
provides supporting read-optimized views and realistic sample seed data for
local development and manual testing.

This component is purely infrastructural at the data layer — it contains
**no backend code**. No models, controllers, routes, or query-building
logic are introduced here; those belong to later components (Authentication,
Core Backend Modules) that will consume the connection pool already
established in `server/config/db.js` (from the Project Setup component) to
execute these scripts and, later, to run parameterized queries against
these tables.

This component directly implements the schema-creation portion of Phase 1
("Planning & Architecture") and lays the foundation for Phase 3 ("Core
Backend Modules") from the roadmap defined in `docs/00_Project_Overview.md`.

---

## Features Implemented

- Complete DDL for all seven tables defined in `docs/02_Database_Design.md`
  §4: `users`, `student_profiles`, `company_profiles`, `internships`,
  `applications`, `saved_internships`, `notifications`.
- All foreign key relationships with explicit `ON DELETE CASCADE` /
  `ON UPDATE CASCADE` rules, per §6 of the Database Design document.
- All primary keys (`id`, `AUTO_INCREMENT`, `INT UNSIGNED`).
- All unique constraints: `uq_student_profiles_user`,
  `uq_company_profiles_user`, `uq_applications_internship_student`,
  `uq_saved_student_internship`, plus the implicit unique index on
  `users.email`.
- All indexes documented in §7, including the composite
  `idx_notifications_user_id_is_read` index and the `FULLTEXT` index
  `idx_internships_search` on `internships(title, description)` for
  keyword search (FR-SRCH-01).
- `InnoDB` storage engine and `utf8mb4` character set on every table, per
  the Database Best Practices in §9.
- Five supporting SQL views (`server/database/views.sql`) encapsulating
  common multi-table read patterns already implied by
  `docs/03_API_Design.md`, so the future Model layer can query them
  directly instead of re-composing the same joins repeatedly:
  - `view_published_internships`
  - `view_pending_company_approvals`
  - `view_applicant_details`
  - `view_student_application_history`
  - `view_platform_analytics`
- Realistic sample seed data (`server/database/seed.sql`) covering:
  - One admin, four students (one deactivated), three companies (one
    approved, one pending, one rejected).
  - Internship postings only under the approved company, in `published`,
    `closed`, and `draft` states — mirroring the real FR-COM-02
    application-layer rule that unapproved companies cannot publish.
  - Applications in `applied`, `shortlisted`, and `rejected` states,
    including a past application against a `closed` posting to exercise
    application-history queries.
  - Bookmarks (`saved_internships`) and notifications covering both
    company-facing ("new applicant") and student-facing ("status changed")
    notification types.

---

## Folder Structure

```
internship-management-portal/
└── server/
    └── database/
        ├── schema.sql      # Tables, foreign keys, constraints, indexes
        ├── views.sql       # Read-optimized views
        └── seed.sql        # Sample development/test data
```

`server/database/` is a new directory, sitting alongside the existing
`server/config/`, `server/controllers/`, `server/models/`, etc.
folders scaffolded in the Project Setup component. It holds raw,
version-controlled SQL artifacts rather than application code, consistent
with the "no direct SQL in controllers — all SQL lives in `models/`, all
schema changes happen through version-controlled migration/schema files"
rules in `docs/05_Coding_Standards.md` §1 and §15.

---

## Files Created

| File | Purpose |
|------|---------|
| `server/database/schema.sql` | Defines all seven tables with columns, data types, defaults, primary keys, foreign keys (with cascade rules), unique constraints, and indexes — a direct, line-for-line implementation of `docs/02_Database_Design.md` §4–§7. Drops tables in reverse-dependency order first so the script is safely re-runnable against a development database. |
| `server/database/views.sql` | Defines five `CREATE VIEW` statements supporting read-heavy endpoints documented in `docs/03_API_Design.md` (public internship listing, admin company-approval queue, applicant review, student application history, platform analytics). Views never select `password_hash`. |
| `server/database/seed.sql` | Truncates all tables (in dependency-safe order) and inserts realistic sample rows for every table, covering multiple statuses/roles so every documented endpoint and view has meaningful data to exercise during manual testing. |

---

## Files Modified

None. This component adds new files only; no previously generated files
(`server/config/db.js`, `server/app.js`, `server/server.js`, etc.) required
any changes. `server/config/db.js`'s connection pool, established in the
Project Setup component, is what a developer or a future migration runner
will use to execute these scripts — its implementation did not need to
change.

---

## Database Changes

This component **is** the database change. Summary of what is created when
`schema.sql` is run against an empty database matching `DB_NAME`:

| Table | Row Purpose | Key Constraints |
|-------|-------------|------------------|
| `users` | Root identity for all roles | `UNIQUE(email)`, `INDEX(role)` |
| `student_profiles` | 1:1 extension of `users` for students | `UNIQUE(user_id)`, FK → `users.id` (CASCADE) |
| `company_profiles` | 1:1 extension of `users` for companies | `UNIQUE(user_id)`, FK → `users.id` (CASCADE), `INDEX(approval_status)` |
| `internships` | Postings owned by a company | FK → `company_profiles.id` (CASCADE), `INDEX(status)`, `INDEX(company_id)`, `INDEX(location)`, `INDEX(application_deadline)`, `FULLTEXT(title, description)` |
| `applications` | A student's application to a posting | `UNIQUE(internship_id, student_id)`, FK → `internships.id` (CASCADE), FK → `student_profiles.id` (CASCADE), `INDEX(internship_id)`, `INDEX(student_id)`, `INDEX(status)` |
| `saved_internships` | Student bookmarks | `UNIQUE(student_id, internship_id)`, FK → `student_profiles.id` (CASCADE), FK → `internships.id` (CASCADE) |
| `notifications` | In-app alerts for any user | FK → `users.id` (CASCADE), composite `INDEX(user_id, is_read)` |

`admin_audit_logs` was intentionally **not** created — `docs/02_Database_Design.md`
§10/§12 documents it as a *future enhancement*, not part of the current
7-table schema defined in §4. It will be introduced in a dedicated future
component if/when audit logging is implemented, per the instruction to
follow the Database Design document exactly.

---

## API Endpoints

None. This component does not implement any Express routes, controllers,
or models. The views and tables created here are inert until a later
component (Authentication, Core Backend Modules) builds the Model layer
that queries them.

---

## Views Reference

| View | Backing Query Pattern (from `docs/03_API_Design.md`) |
|------|--------------------------------------------------------|
| `view_published_internships` | `GET /internships`, `GET /internships/:internshipId` — public listing, only `status='published'` and non-expired deadlines. |
| `view_pending_company_approvals` | `GET /admin/companies/pending` — companies awaiting admin decision. |
| `view_applicant_details` | `GET /internships/:internshipId/applications`, `GET /companies/applicants` — applicant review with student/resume context. |
| `view_student_application_history` | `GET /students/applications` — a student's own applications with internship/company context. |
| `view_platform_analytics` | `GET /analytics/platform` — single-row aggregate platform statistics. |

---

## Security Considerations

- **No plaintext passwords anywhere.** `users.password_hash` stores only
  bcrypt hashes; the seed data's shared demo hash is a widely-known public
  bcrypt example used solely for local fixtures, never a real credential.
- **Foreign keys as a second line of defense.** Every parent-child
  relationship documented in the Database Design document is enforced at
  the database level (not just assumed at the application layer), guarding
  against race conditions and future application-layer bugs, per
  `docs/02_Database_Design.md` §10.
- **`uq_applications_internship_student`** enforces "one application per
  student per posting" (FR-STU-05 / FR-APP-02) as a hard database
  constraint, not merely an application-layer check.
- **Views exclude sensitive columns.** None of the five views select
  `password_hash`, keeping the "never expose password hashes" rule
  (`docs/05_Coding_Standards.md` §15) true even for ad hoc / reporting
  queries built on top of these views.
- **Least-privilege reminder carried forward.** As noted in
  `docs/02_Database_Design.md` §10, the application's database user in
  staging/production should be granted only `SELECT`/`INSERT`/`UPDATE`/
  `DELETE` on these tables — not `DROP`/`ALTER`/administrative grants. This
  schema file itself requires elevated privileges to run and should only
  ever be executed by a migration/deploy process, not the application's
  runtime database user.
- **Seed data is for local/development use only** and must never be run
  against a staging or production database — `seed.sql` performs
  `TRUNCATE TABLE` on every table before inserting, which is destructive.

---

## Testing Checklist

- [ ] `mysql -u <user> -p <db_name> < server/database/schema.sql` runs
      without error against an empty database matching `DB_NAME`.
- [ ] Running `schema.sql` a second time against the same database succeeds
      (tables are dropped and recreated cleanly) without leaving orphaned
      foreign key references.
- [ ] `SHOW TABLES;` lists exactly seven tables: `users`,
      `student_profiles`, `company_profiles`, `internships`, `applications`,
      `saved_internships`, `notifications`.
- [ ] `SHOW CREATE TABLE applications;` confirms
      `UNIQUE KEY uq_applications_internship_student` exists and that
      inserting a duplicate `(internship_id, student_id)` pair fails with
      `ER_DUP_ENTRY`.
- [ ] Deleting a row from `users` cascades and removes its dependent
      `student_profiles`/`company_profiles`, `notifications`, and (via
      `company_profiles` → `internships` → `applications`) any chain of
      dependent rows, confirming the `ON DELETE CASCADE` rules from §6.
- [ ] `mysql -u <user> -p <db_name> < server/database/views.sql` runs
      without error after `schema.sql`, and `SHOW FULL TABLES WHERE
      Table_type = 'VIEW';` lists all five views.
- [ ] `SELECT * FROM view_platform_analytics;` returns exactly one row with
      non-null aggregate counts.
- [ ] `mysql -u <user> -p <db_name> < server/database/seed.sql` runs
      without error after `schema.sql`, and `SELECT COUNT(*) FROM users;`
      returns `8`.
- [ ] `SELECT * FROM view_published_internships;` returns exactly the two
      seeded `published` TechCorp postings (Frontend Developer Intern,
      Backend Developer Intern) — the `closed` and `draft` postings are
      correctly excluded.
- [ ] `SELECT * FROM view_pending_company_approvals;` returns exactly one
      row (GreenEnergy Solutions).
- [ ] A full-text search — `SELECT title FROM internships WHERE
      MATCH(title, description) AGAINST ('react dashboard' IN NATURAL
      LANGUAGE MODE);` — returns the Frontend Developer Intern posting,
      confirming `idx_internships_search` is functional.

---

## Future Dependencies

- **Authentication component** — will write to and read from `users` and
  `student_profiles`/`company_profiles` via the Model layer, using
  `server/config/db.js`'s connection pool established in Project Setup and
  the schema created here.
- **Core Backend Modules component** (Students, Companies, Internships,
  Applications) — every model file (`user.model.js`, `internship.model.js`,
  `application.model.js`, etc.) will issue parameterized queries directly
  against the tables defined in `schema.sql`, and read-heavy endpoints may
  query the views in `views.sql` instead of re-deriving the same joins.
- **Admin Module component** — will query `view_pending_company_approvals`
  for `GET /admin/companies/pending` and will introduce the
  `admin_audit_logs` table as its own dedicated schema addition when audit
  logging (`docs/02_Database_Design.md` §12 future enhancement) is
  implemented, rather than retrofitting it into this component.
- **Analytics endpoints** (`GET /analytics/platform`,
  `GET /analytics/companies/postings`, `GET /analytics/students/activity`)
  — the platform-wide endpoint can query `view_platform_analytics`
  directly; the other two remain parameterized queries in their respective
  models, since they require request-specific filters not suited to a
  static view.
- **Migration tooling** — per `docs/02_Database_Design.md` §9 and
  `docs/05_Coding_Standards.md` §8, future schema changes should be applied
  as new, timestamp-prefixed migration files rather than editing
  `schema.sql` in place once it has run against a shared environment;
  `schema.sql` remains the authoritative "current state" reference.

---

## Notes

- **Assumption:** A MySQL 8.x database matching `DB_NAME` in `server/.env`
  already exists (per the Project Setup component's Testing Checklist);
  `schema.sql` does not create or select a database, consistent with the
  "no hardcoded configuration" rule.
- **Assumption:** The developer has sufficient database privileges (`CREATE
  TABLE`, `DROP TABLE`, `CREATE VIEW`) to run these scripts locally; the
  application's runtime credentials (used later by `server/config/db.js`)
  do not need these privileges and should be scoped down before
  deployment, per the Security Considerations above.
- **Limitation:** `schema.sql` uses `DROP TABLE IF EXISTS` for
  re-runnability during active development. This script must never be run
  against a database containing real user data outside of local/dev
  environments, since it is destructive by design.
- **Limitation:** `seed.sql` uses a single shared bcrypt hash across every
  sample account purely for fixture simplicity; real registration flows
  (implemented in the Authentication component) will always compute a
  unique hash per user via `bcrypt.hash()`.
- **Future improvement:** Once the Authentication and Core Backend Modules
  components introduce a formal migration tool (e.g., Knex or Sequelize
  CLI, per `docs/02_Database_Design.md` §9), `schema.sql` may be split into
  individual timestamped migration files (`20260101_001_create_users_table.sql`,
  etc.) without changing the resulting schema — this component's
  single-file form is intentional for this initial database-creation step.
