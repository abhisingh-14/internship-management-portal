-- Migration: 20260712_001_add_student_education_and_skills.sql
-- Component: 06_Student_Module
-- ---------------------------------------------------------------------------
-- Purpose:
--   Normalizes student education and skills out of the single
--   `student_profiles.education` (VARCHAR) and `student_profiles.skills`
--   (JSON) columns into dedicated, independently CRUD-able tables.
--
--   This follows the future-enhancement guidance already documented in
--   docs/02_Database_Design.md §9: "Revisit `skills` normalization at
--   scale... introduce a normalized `skills` and `internship_skills`/
--   `student_skills` junction table structure." A single VARCHAR/JSON
--   column cannot support the per-entry Create/Read/Update/Delete
--   operations required by the Student Module's "Manage Education" /
--   "Manage Skills" features (FR-STU-02), since a student may have
--   multiple education entries and multiple discrete skills that must be
--   added, edited, and removed independently rather than replaced
--   wholesale as one field.
--
-- Pre-requisite:
--   server/database/schema.sql must already have been applied (Component 02).
--
-- Notes:
--   - Per docs/05_Coding_Standards.md §8/§15, schema changes are applied as
--     new, timestamp-prefixed migration files rather than editing
--     schema.sql in place once it has run against a shared environment.
--   - This migration is NOT idempotent for the DROP COLUMN statements
--     (running it twice against the same database will fail on the second
--     run because the columns will already be gone) — this is intentional;
--     migrations are run once per environment and are never re-run or
--     edited after being merged, per Coding Standards §8.
-- ---------------------------------------------------------------------------

-- 1. New table: student_education
CREATE TABLE student_education (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    institution_name VARCHAR(200) NOT NULL,
    degree VARCHAR(150) NOT NULL,
    field_of_study VARCHAR(150) NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    grade VARCHAR(50) NULL,
    description TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_education_student FOREIGN KEY (student_id)
        REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    INDEX idx_student_education_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. New table: student_skills
CREATE TABLE student_skills (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    student_id INT UNSIGNED NOT NULL,
    skill_name VARCHAR(100) NOT NULL,
    proficiency_level ENUM('beginner', 'intermediate', 'advanced', 'expert')
        NOT NULL DEFAULT 'intermediate',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_student_skills_student FOREIGN KEY (student_id)
        REFERENCES student_profiles(id) ON DELETE CASCADE ON UPDATE CASCADE,
    UNIQUE KEY uq_student_skills_student_skill (student_id, skill_name),
    INDEX idx_student_skills_student_id (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Drop the now-superseded columns on student_profiles.
ALTER TABLE student_profiles
    DROP COLUMN education,
    DROP COLUMN skills;
