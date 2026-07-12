-- Migration: 20260712_002_create_saved_internships.sql
-- Component: 12_Saved_Internships
-- ---------------------------------------------------------------------------
-- Purpose:
--   Creates the `saved_internships` table if it does not already exist.
--   Provides a junction table representing student bookmarks/saved postings.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS saved_internships (
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
