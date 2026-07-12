-- =============================================================================
-- Internship Management Portal — Sample Seed Data
-- File:    server/database/seed.sql
-- Purpose: Realistic sample data for local development and manual API
--          testing. NOT intended for production use.
--
-- Usage:
--   Run after schema.sql (and optionally views.sql) have been applied:
--     mysql -u <user> -p <database_name> < server/database/seed.sql
--
-- Password note:
--   Every seeded student/company account shares the bcrypt hash below for
--   the plaintext password "Password123!" (bcrypt, cost factor 10). This is
--   a well-known publicly-documented demo hash used purely for local
--   seeding — it is never used for anything beyond development fixtures,
--   and no real credential is derivable from or tied to it.
--   Hash: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
--
--   The seeded admin account uses the same demo hash/password for
--   consistency in local testing only; production admin credentials must
--   always be provisioned separately per FR-AUTH-01.
-- =============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE student_skills;
TRUNCATE TABLE student_education;
TRUNCATE TABLE notifications;
TRUNCATE TABLE saved_internships;
TRUNCATE TABLE applications;
TRUNCATE TABLE internships;
TRUNCATE TABLE company_profiles;
TRUNCATE TABLE student_profiles;
TRUNCATE TABLE users;

SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------------------------------
-- users
-- -----------------------------------------------------------------------------
INSERT INTO users (id, name, email, password_hash, role, account_status) VALUES
    (1, 'Platform Admin',   'admin@internshipportal.com',  '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin',   'active'),
    (2, 'Jane Doe',         'jane.doe@example.com',        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', 'active'),
    (3, 'John Smith',       'john.smith@example.com',      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', 'active'),
    (4, 'Priya Sharma',     'priya.sharma@example.com',    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', 'active'),
    (5, 'Amit Verma',       'amit.verma@example.com',      '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'student', 'deactivated'),
    (6, 'TechCorp HR',      'contact@techcorp.com',        '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'company', 'active'),
    (7, 'GreenEnergy HR',   'hr@greenenergy.com',          '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'company', 'active'),
    (8, 'FashionHub HR',    'jobs@fashionhub.com',         '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'company', 'active');

-- -----------------------------------------------------------------------------
-- student_profiles (one per student user)
-- -----------------------------------------------------------------------------
INSERT INTO student_profiles (id, user_id, bio, resume_url) VALUES
    (1, 2, 'Aspiring full-stack developer passionate about building scalable web applications.', '/uploads/resumes/jane-doe-resume.pdf'),
    (2, 3, 'Backend-focused engineer with a growing interest in distributed systems.', '/uploads/resumes/john-smith-resume.pdf'),
    (3, 4, 'Data enthusiast exploring analytics and machine learning fundamentals.', '/uploads/resumes/priya-sharma-resume.pdf'),
    (4, 5, 'Deactivated account retained for historical application records.', NULL);

-- -----------------------------------------------------------------------------
-- student_education
-- -----------------------------------------------------------------------------
INSERT INTO student_education (id, student_id, institution_name, degree, field_of_study, start_date, end_date, is_current, grade, description) VALUES
    (1, 1, 'NIT Trichy', 'B.Tech', 'Computer Science', '2022-07-01', '2026-05-31', FALSE, '8.5 CGPA', 'Relevant coursework: Data Structures, Algorithms, Web Development'),
    (2, 2, 'Delhi University', 'B.Sc', 'Information Technology', '2022-07-01', '2025-05-31', FALSE, '7.8 CGPA', 'Focused on software engineering and database systems'),
    (3, 3, 'IIIT Hyderabad', 'B.Tech', 'Electronics & Communication', '2022-07-01', '2026-05-31', FALSE, '9.0 CGPA', 'Focus on signal processing and data analytics'),
    (4, 4, 'University of Mumbai', 'B.Com', 'Commerce', '2021-07-01', '2024-05-31', FALSE, 'A Grade', 'General commerce education');

-- -----------------------------------------------------------------------------
-- student_skills
-- -----------------------------------------------------------------------------
INSERT INTO student_skills (id, student_id, skill_name, proficiency_level) VALUES
    (1, 1, 'React', 'advanced'),
    (2, 1, 'Node.js', 'intermediate'),
    (3, 1, 'MySQL', 'intermediate'),
    (4, 1, 'JavaScript', 'advanced'),
    (5, 2, 'Node.js', 'intermediate'),
    (6, 2, 'Express', 'intermediate'),
    (7, 2, 'MongoDB', 'intermediate'),
    (8, 2, 'Docker', 'beginner'),
    (9, 3, 'Python', 'advanced'),
    (10, 3, 'Data Analysis', 'intermediate'),
    (11, 3, 'SQL', 'intermediate'),
    (12, 3, 'Pandas', 'intermediate'),
    (13, 4, 'Excel', 'intermediate'),
    (14, 4, 'Communication', 'intermediate');

-- -----------------------------------------------------------------------------
-- company_profiles (one per company user; mixed approval states)
-- -----------------------------------------------------------------------------
INSERT INTO company_profiles (id, user_id, company_name, description, website, industry, logo_url, approval_status) VALUES
    (1, 6, 'TechCorp Inc.',
        'We build developer tools used by thousands of engineering teams worldwide.',
        'https://techcorp.example.com', 'Software', '/uploads/logos/techcorp-logo.png', 'approved'),
    (2, 7, 'GreenEnergy Solutions',
        'Renewable energy startup focused on solar infrastructure for small businesses.',
        'https://greenenergy.example.com', 'Clean Energy', '/uploads/logos/greenenergy-logo.png', 'pending'),
    (3, 8, 'FashionHub',
        'Direct-to-consumer fashion e-commerce brand.',
        'https://fashionhub.example.com', 'Retail', '/uploads/logos/fashionhub-logo.png', 'rejected');

-- -----------------------------------------------------------------------------
-- internships (only the approved company, TechCorp, has postings — a company
-- must be approved before publishing per FR-COM-02, enforced at the
-- application layer; seed data mirrors that real-world constraint)
-- -----------------------------------------------------------------------------
INSERT INTO internships
    (id, company_id, title, description, required_skills, location, duration, stipend, application_deadline, status) VALUES
    (1, 1, 'Frontend Developer Intern',
        'Work on our React-based dashboard used by thousands of enterprise customers. You will build reusable components, collaborate with designers, and ship features end-to-end.',
        JSON_ARRAY('React', 'JavaScript', 'CSS'),
        'Remote', '3 months', 15000, '2026-09-01', 'published'),
    (2, 1, 'Backend Developer Intern',
        'Join our platform team to design and build REST APIs powering our core product, with a focus on performance and reliability.',
        JSON_ARRAY('Node.js', 'Express', 'MySQL'),
        'Bengaluru, India', '6 months', 20000, '2026-08-15', 'published'),
    (3, 1, 'Data Analyst Intern',
        'Analyze product usage data to surface actionable insights for the growth team.',
        JSON_ARRAY('SQL', 'Python', 'Data Visualization'),
        'Remote', '3 months', 12000, '2026-05-01', 'closed'),
    (4, 1, 'DevOps Intern',
        'Support our CI/CD pipeline and cloud infrastructure automation efforts.',
        JSON_ARRAY('Docker', 'AWS', 'Linux'),
        'Pune, India', '4 months', 18000, '2026-10-01', 'draft');

-- -----------------------------------------------------------------------------
-- applications
-- -----------------------------------------------------------------------------
INSERT INTO applications (id, internship_id, student_id, cover_letter, status, applied_at) VALUES
    (1, 1, 1, 'I am excited to apply for the Frontend Developer Intern role. My React coursework and personal projects align closely with your dashboard product.',
        'shortlisted', '2026-06-20 10:15:00'),
    (2, 2, 2, 'I would love to contribute to your backend platform team using my Node.js and Express experience.',
        'applied', '2026-06-25 14:30:00'),
    (3, 1, 3, 'I am a fast learner with strong fundamentals in JavaScript and would appreciate the opportunity to grow on your team.',
        'rejected', '2026-06-18 09:00:00'),
    (4, 3, 1, 'Applied before this posting closed, retained here for historical application history.',
        'rejected', '2026-04-10 11:00:00');

-- -----------------------------------------------------------------------------
-- saved_internships (bookmarks)
-- -----------------------------------------------------------------------------
INSERT INTO saved_internships (id, student_id, internship_id, saved_at) VALUES
    (1, 1, 3, '2026-06-15 08:45:00'),
    (2, 2, 1, '2026-06-21 16:20:00'),
    (3, 3, 2, '2026-06-22 12:10:00');

-- -----------------------------------------------------------------------------
-- notifications
-- -----------------------------------------------------------------------------
INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at) VALUES
    (1, 6, 'application_received', 'New Applicant',
        'Jane Doe has applied to your Frontend Developer Intern posting.', TRUE, '2026-06-20 10:15:05'),
    (2, 6, 'application_received', 'New Applicant',
        'John Smith has applied to your Backend Developer Intern posting.', FALSE, '2026-06-25 14:30:05'),
    (3, 2, 'application_status_changed', 'Application Shortlisted',
        'Your application for Frontend Developer Intern at TechCorp Inc. has been shortlisted.', FALSE, '2026-06-27 09:00:00'),
    (4, 4, 'application_status_changed', 'Application Update',
        'Your application for Frontend Developer Intern at TechCorp Inc. was not selected this time.', TRUE, '2026-06-26 17:45:00'),
    (5, 6, 'company_approved', 'Account Approved',
        'Your company account has been approved. You can now publish internship postings.', TRUE, '2026-05-01 09:00:00'),
    (6, 8, 'company_rejected', 'Account Rejected',
        'Your company registration was not approved. Please contact support for more details.', FALSE, '2026-05-02 09:00:00');

-- =============================================================================
-- End of seed.sql
-- =============================================================================
