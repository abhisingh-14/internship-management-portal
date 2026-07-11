-- =============================================================================
-- Internship Management Portal — Database Schema
-- File:        server/database/schema.sql
-- Engine:      MySQL 8.x
-- Charset:     utf8mb4 (full Unicode support, per docs/02_Database_Design.md §9)
-- Storage:     InnoDB (foreign key enforcement, transactions, row-level locking)
--
-- Source of truth: docs/02_Database_Design.md
-- Related:         docs/01_Software_Requirements_Specification.md
--                  docs/03_API_Design.md
--                  docs/05_Coding_Standards.md (naming conventions)
--
-- Usage:
--   This script assumes the target database already exists (created during
--   environment setup, matching DB_NAME in server/.env) and is selected via
--   `USE <database_name>;` or the client's default schema, per the "no
--   hardcoded configuration" rule in docs/05_Coding_Standards.md.
--
--   Run against a fresh/empty database:
--     mysql -u <user> -p <database_name> < server/database/schema.sql
--
-- Notes:
--   - Tables are created in dependency order (referenced tables before
--     referencing tables) so foreign keys resolve on first run.
--   - All identifiers follow docs/05_Coding_Standards.md §8 (SQL Naming):
--     snake_case tables/columns, idx_<table>_<column> indexes,
--     uq_<table>_<column> unique constraints, fk_<table>_<referenced> FKs.
--   - admin_audit_logs is intentionally NOT created here — it is documented
--     in docs/02_Database_Design.md §12 as a future enhancement, not part of
--     the current schema (Section 4 defines exactly 7 tables).
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Drop in reverse dependency order to allow safe re-runs during development.
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS saved_internships;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS internships;
DROP TABLE IF EXISTS company_profiles;
DROP TABLE IF EXISTS student_profiles;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- Table: users
-- Purpose: Core authentication/identity record for every account (Student,
--          Company, Admin). Single source of truth for login credentials.
-- Ref:     docs/02_Database_Design.md §4.1
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
-- Ref:     docs/02_Database_Design.md §4.2
-- -----------------------------------------------------------------------------
CREATE TABLE student_profiles (
    id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id     INT UNSIGNED NOT NULL,
    education   VARCHAR(200) NULL DEFAULT NULL,
    skills      JSON NULL DEFAULT NULL,
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
-- Purpose: Company-specific profile data and admin verification status,
--          extending a users row (role='company').
-- Ref:     docs/02_Database_Design.md §4.3
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
-- Table: internships
-- Purpose: Internship postings created by companies.
-- Ref:     docs/02_Database_Design.md §4.4
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
-- Ref:     docs/02_Database_Design.md §4.5
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
-- Ref:     docs/02_Database_Design.md §4.6
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
-- Ref:     docs/02_Database_Design.md §4.7
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

-- =============================================================================
-- End of schema.sql
-- =============================================================================
