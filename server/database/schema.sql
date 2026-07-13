-- =============================================================================
-- Internship Management Portal — Database Schema (CONSOLIDATED / DEPLOYMENT)
-- File:        server/database/schema.sql
-- Engine:      MySQL 8.x
-- Charset:     utf8mb4
-- Storage:     InnoDB
--
-- This file replaces the original Component 02 schema.sql. It represents the
-- TRUE FINAL STATE of the database after all subsequent components, folding
-- in what previously lived in separate migration files and in the runtime
-- initializeDatabase() logic in server/config/db.js:
--
--   - server/database/schema.sql                                  (Component 02 — base)
--   - server/database/migration/20260712_001_add_student_education_and_skills.sql (Component 06)
--   - server/database/migration/20260712_002_create_saved_internships.sql         (Component 12 — no-op here, already in base)
--   - admin_audit_logs table + migrations bookkeeping table        (Component 14 / db.js)
--
-- IMPORTANT — Railway deployment note:
--   server/config/db.js's initializeDatabase() scans server/database/migration/
--   on every server boot and re-applies any .sql file not yet recorded in the
--   `migrations` table. This script pre-seeds `migrations` with both migration
--   filenames marked as already executed, so db.js's scanner skips them on
--   first boot against this consolidated schema. Do NOT delete the migration
--   files from the repo — they remain valid historical documentation and
--   db.js still expects the `migrations` table itself to exist.
--
-- Usage (fresh Railway MySQL database):
--   mysql -h <host> -P <port> -u <user> -p <database> < server/database/schema.sql
--
-- WARNING: This script uses DROP TABLE IF EXISTS for re-runnability during
-- setup. Do NOT re-run it against a database that already contains real
-- production data — it is destructive by design, intended for initial
-- provisioning only.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS admin_audit_logs;
DROP TABLE IF EXISTS migrations;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS saved_internships;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS student_skills;
DROP TABLE IF EXISTS student_education;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS company_profiles;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Table: users
-- Purpose: Core authentication/identity record for every account (Student,
--          Company, Admin).
-- -----------------------------------------------------------------------------
CREATE TABLE users (
    id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(191) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            ENUM('student', 'company', 'admin') NOT NULL,
    account_status  ENUM('active', 'deactivated') NOT NULL DEFAULT 'active',
    created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_users_email (email),
    INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Core authentication/identity for all roles';

-- -----------------------------------------------------------------------------
-- Table: student_profiles
-- Purpose: Student-specific profile data extending a users row (role='student').
-- NOTE: `education` and `skills` columns from the original Component 02 schema
-- have been REMOVED per the 20260712_001 migration — they are now normalized
-- into student_education / student_skills below.
-- -----------------------------------------------------------------------------
CREATE TABLE student_profiles (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    bio         TEXT NULL DEFAULT NULL,
    resume_url  VARCHAR(255) NULL DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_student_profiles_user (user_id),
    CONSTRAINT fk_student_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student-specific profile data (1:1 with users)';

-- -----------------------------------------------------------------------------
-- Table: company_profiles
-- Purpose: Company-specific profile data and admin verification status.
-- -----------------------------------------------------------------------------
CREATE TABLE company_profiles (
    id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id          INT UNSIGNED NOT NULL,
    company_name     VARCHAR(150) NOT NULL,
    description      TEXT NULL DEFAULT NULL,
    website          VARCHAR(255) NULL DEFAULT NULL,
    industry         VARCHAR(100) NULL DEFAULT NULL,
    logo_url         VARCHAR(255) NULL DEFAULT NULL,
    approval_status  ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
    created_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_company_profiles_user (user_id),
    CONSTRAINT fk_company_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_company_approval_status (approval_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Company-specific profile + admin verification status (1:1 with users)';

-- -----------------------------------------------------------------------------
-- Table: student_education
-- Purpose: Normalized, independently CRUD-able education entries per student.
-- Ref: Component 06 migration 20260712_001.
-- -----------------------------------------------------------------------------
CREATE TABLE student_education (
    id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id        INT UNSIGNED NOT NULL,
    institution_name  VARCHAR(200) NOT NULL,
    degree            VARCHAR(150) NOT NULL,
    field_of_study    VARCHAR(150) NULL DEFAULT NULL,
    start_date        DATE NOT NULL,
    end_date          DATE NULL DEFAULT NULL,
    is_current        BOOLEAN NOT NULL DEFAULT FALSE,
    grade             VARCHAR(50) NULL DEFAULT NULL,
    description       TEXT NULL DEFAULT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_student_education_student
        FOREIGN KEY (student_id) REFERENCES student_profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_student_education_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Per-student education history entries';

-- -----------------------------------------------------------------------------
-- Table: student_skills
-- Purpose: Normalized, independently CRUD-able skill entries per student.
-- Ref: Component 06 migration 20260712_001.
-- -----------------------------------------------------------------------------
CREATE TABLE student_skills (
    id                  INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id          INT UNSIGNED NOT NULL,
    skill_name          VARCHAR(100) NOT NULL,
    proficiency_level   ENUM('beginner', 'intermediate', 'advanced', 'expert')
                            NOT NULL DEFAULT 'intermediate',
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_student_skills_student
        FOREIGN KEY (student_id) REFERENCES student_profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    UNIQUE KEY uq_student_skills_student_skill (student_id, skill_name),
    INDEX idx_student_skills_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Per-student discrete skill entries';

-- -----------------------------------------------------------------------------
-- Table: internships
-- Purpose: Internship postings created by companies.
-- -----------------------------------------------------------------------------
CREATE TABLE internships (
    id                     INT UNSIGNED NOT NULL AUTO_INCREMENT,
    company_id             INT UNSIGNED NOT NULL,
    title                  VARCHAR(150) NOT NULL,
    description            TEXT NOT NULL,
    required_skills        JSON NOT NULL,
    location               VARCHAR(150) NOT NULL,
    duration               VARCHAR(50) NOT NULL,
    stipend                INT UNSIGNED NOT NULL DEFAULT 0,
    application_deadline   DATE NOT NULL,
    status                 ENUM('draft', 'published', 'closed', 'flagged', 'removed') NOT NULL DEFAULT 'draft',
    created_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_internships_company
        FOREIGN KEY (company_id) REFERENCES company_profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_internships_status (status),
    INDEX idx_internships_company_id (company_id),
    INDEX idx_internships_location (location),
    INDEX idx_internships_deadline (application_deadline),
    FULLTEXT INDEX idx_internships_search (title, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Internship postings created by companies';

-- -----------------------------------------------------------------------------
-- Table: applications
-- Purpose: Tracks a student's application to a specific internship posting
--          and its lifecycle status.
-- -----------------------------------------------------------------------------
CREATE TABLE applications (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    internship_id  INT UNSIGNED NOT NULL,
    student_id     INT UNSIGNED NOT NULL,
    cover_letter   TEXT NULL DEFAULT NULL,
    status         ENUM('applied', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn')
                       NOT NULL DEFAULT 'applied',
    applied_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_applications_internship_student (internship_id, student_id),
    CONSTRAINT fk_applications_internship
        FOREIGN KEY (internship_id) REFERENCES internships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_applications_student
        FOREIGN KEY (student_id) REFERENCES student_profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_applications_internship_id (internship_id),
    INDEX idx_applications_student_id (student_id),
    INDEX idx_applications_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student applications to internship postings';

-- -----------------------------------------------------------------------------
-- Table: saved_internships
-- Purpose: Junction table representing a student's bookmarked internships.
-- Ref: Component 12 (already present in Component 02 base schema; migration
-- 002 was a redundant IF NOT EXISTS safety net, folded in here as a no-op).
-- -----------------------------------------------------------------------------
CREATE TABLE saved_internships (
    id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
    student_id     INT UNSIGNED NOT NULL,
    internship_id  INT UNSIGNED NOT NULL,
    saved_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_saved_student_internship (student_id, internship_id),
    CONSTRAINT fk_saved_internships_student
        FOREIGN KEY (student_id) REFERENCES student_profiles (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT fk_saved_internships_internship
        FOREIGN KEY (internship_id) REFERENCES internships (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Student bookmarks (many-to-many: students <-> internships)';

-- -----------------------------------------------------------------------------
-- Table: notifications
-- Purpose: In-app notifications delivered to any user (Student, Company, Admin).
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='In-app notifications for all user roles';

-- -----------------------------------------------------------------------------
-- Table: admin_audit_logs
-- Purpose: Tamper-evident log of every administrative action, per FR-ADM-06.
-- Ref: Component 14 — previously created only at runtime via
-- server/config/db.js's initializeDatabase(); now baked into the schema so a
-- fresh Railway deployment has it immediately without relying on an
-- app-startup side effect.
-- -----------------------------------------------------------------------------
CREATE TABLE admin_audit_logs (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    actor_id    INT UNSIGNED NOT NULL,
    action      VARCHAR(100) NOT NULL,
    target_id   VARCHAR(100) NOT NULL,
    details     TEXT NULL DEFAULT NULL,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_admin_audit_logs_actor
        FOREIGN KEY (actor_id) REFERENCES users (id)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    INDEX idx_admin_audit_logs_actor (actor_id),
    INDEX idx_admin_audit_logs_action (action),
    INDEX idx_admin_audit_logs_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Audit log for administrative actions';

-- -----------------------------------------------------------------------------
-- Table: migrations
-- Purpose: Bookkeeping table read by server/config/db.js's
-- initializeDatabase() to decide which files under server/database/migration/
-- still need to run on server startup.
--
-- Both historical migration files are pre-seeded below as already executed,
-- since their effects are already fully baked into the table definitions
-- above. This prevents db.js from attempting to re-run
-- 20260712_001_add_student_education_and_skills.sql on first Railway boot,
-- which would otherwise fail (it tries to DROP COLUMN education/skills,
-- columns that this consolidated schema never creates in the first place).
-- -----------------------------------------------------------------------------
CREATE TABLE migrations (
    id           INT UNSIGNED NOT NULL AUTO_INCREMENT,
    name         VARCHAR(255) NOT NULL,
    executed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_migrations_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Tracks which migration files have already been applied';

INSERT INTO migrations (name) VALUES
    ('20260712_001_add_student_education_and_skills.sql'),
    ('20260712_002_create_saved_internships.sql');

-- =============================================================================
-- End of schema.sql
-- =============================================================================