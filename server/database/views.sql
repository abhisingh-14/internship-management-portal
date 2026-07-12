-- =============================================================================
-- Internship Management Portal — Database Views
-- File:    server/database/views.sql
-- Purpose: Read-optimized views encapsulating common multi-table query
--          patterns already documented in docs/02_Database_Design.md §8 and
--          the endpoints in docs/03_API_Design.md. Models (in a later
--          component) may query these views directly for read-heavy
--          endpoints instead of re-composing the same joins repeatedly.
--
-- Notes:
--   - Views never expose users.password_hash, per the "never SELECT
--     password_hash" rule in docs/05_Coding_Standards.md §15.
--   - Views are pure SELECT projections; no business logic (pagination,
--     filtering, authorization) lives here — that remains the responsibility
--     of the Model layer, per docs/04_Project_Architecture.md §3.
--   - Run this script after schema.sql has created all base tables.
-- =============================================================================

SET NAMES utf8mb4;

DROP VIEW IF EXISTS view_platform_analytics;
DROP VIEW IF EXISTS view_student_application_history;
DROP VIEW IF EXISTS view_applicant_details;
DROP VIEW IF EXISTS view_pending_company_approvals;
DROP VIEW IF EXISTS view_published_internships;

-- -----------------------------------------------------------------------------
-- View: view_published_internships
-- Purpose: Public internship listing (GET /internships, GET /internships/:id)
--          — only postings visible to unauthenticated/student users, joined
--          with owning company details, per FR-INT-03.
-- -----------------------------------------------------------------------------
CREATE VIEW view_published_internships AS
SELECT
    i.id                     AS internship_id,
    i.title                  AS title,
    i.description            AS description,
    i.required_skills        AS required_skills,
    i.location               AS location,
    i.duration               AS duration,
    i.stipend                AS stipend,
    i.application_deadline   AS application_deadline,
    i.status                 AS status,
    i.created_at             AS created_at,
    cp.id                    AS company_id,
    cp.company_name          AS company_name,
    cp.industry              AS company_industry,
    cp.logo_url              AS company_logo_url
FROM internships i
INNER JOIN company_profiles cp ON i.company_id = cp.id
WHERE i.status = 'published'
  AND i.application_deadline >= CURDATE();

-- -----------------------------------------------------------------------------
-- View: view_pending_company_approvals
-- Purpose: Admin moderation queue (GET /admin/companies/pending), per FR-ADM-02.
-- -----------------------------------------------------------------------------
CREATE VIEW view_pending_company_approvals AS
SELECT
    cp.id                AS company_id,
    cp.company_name      AS company_name,
    cp.description       AS description,
    cp.website            AS website,
    cp.industry          AS industry,
    cp.logo_url          AS logo_url,
    cp.approval_status   AS approval_status,
    cp.created_at        AS registered_at,
    u.id                 AS user_id,
    u.name               AS contact_name,
    u.email              AS contact_email,
    u.account_status     AS account_status
FROM company_profiles cp
INNER JOIN users u ON cp.user_id = u.id
WHERE cp.approval_status = 'pending';

-- -----------------------------------------------------------------------------
-- View: view_applicant_details
-- Purpose: Applicant review for companies/admins (GET /internships/:id/
--          applications, GET /companies/applicants), per FR-COM-04/05.
-- -----------------------------------------------------------------------------
CREATE VIEW view_applicant_details AS
SELECT
    a.id                 AS application_id,
    a.status             AS application_status,
    a.cover_letter       AS cover_letter,
    a.applied_at         AS applied_at,
    a.updated_at         AS status_updated_at,
    i.id                 AS internship_id,
    i.title              AS internship_title,
    i.company_id         AS company_id,
    sp.id                AS student_profile_id,
    NULL                 AS student_education,
    NULL                 AS student_skills,
    sp.resume_url        AS student_resume_url,
    su.id                AS student_user_id,
    su.name              AS student_name,
    su.email             AS student_email
FROM applications a
INNER JOIN internships i        ON a.internship_id = i.id
INNER JOIN student_profiles sp  ON a.student_id = sp.id
INNER JOIN users su             ON sp.user_id = su.id;

-- -----------------------------------------------------------------------------
-- View: view_student_application_history
-- Purpose: A student's own application history (GET /students/applications),
--          including internship and company context, per FR-STU-06/08.
-- -----------------------------------------------------------------------------
CREATE VIEW view_student_application_history AS
SELECT
    a.id                    AS application_id,
    a.status                AS application_status,
    a.applied_at            AS applied_at,
    a.updated_at            AS status_updated_at,
    sp.user_id              AS student_user_id,
    i.id                    AS internship_id,
    i.title                 AS internship_title,
    i.location              AS internship_location,
    i.stipend               AS internship_stipend,
    i.application_deadline  AS application_deadline,
    i.status                AS internship_status,
    cp.id                   AS company_id,
    cp.company_name         AS company_name
FROM applications a
INNER JOIN student_profiles sp ON a.student_id = sp.id
INNER JOIN internships i       ON a.internship_id = i.id
INNER JOIN company_profiles cp ON i.company_id = cp.id;

-- -----------------------------------------------------------------------------
-- View: view_platform_analytics
-- Purpose: Platform-wide summary statistics (GET /analytics/platform), per
--          FR-ADM-05. Returns exactly one row.
-- -----------------------------------------------------------------------------
CREATE VIEW view_platform_analytics AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'student')                         AS total_students,
    (SELECT COUNT(*) FROM users WHERE role = 'company')                         AS total_companies,
    (SELECT COUNT(*) FROM company_profiles WHERE approval_status = 'pending')   AS pending_company_approvals,
    (SELECT COUNT(*) FROM internships)                                         AS total_internships,
    (SELECT COUNT(*) FROM internships WHERE status = 'published')              AS active_internships,
    (SELECT COUNT(*) FROM applications)                                        AS total_applications;

-- =============================================================================
-- End of views.sql
-- =============================================================================
