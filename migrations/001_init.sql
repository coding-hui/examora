-- Examora schema - PostgreSQL only (BIGSERIAL, JSONB)
-- All IDs are BIGINT (auto-increment)
-- Local user authentication + Casbin RBAC
-- For fresh PostgreSQL database initialization only
-- For local SQLite dev, GORM AutoMigrate creates tables automatically

BEGIN;

-- =====================================================================
-- Phase 1: Create users table (local auth identity)
-- =====================================================================
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    display_name VARCHAR(128),
    auth_provider VARCHAR(32),
    external_subject VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_external_subject ON users(external_subject) WHERE external_subject IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- =====================================================================
-- Phase 2: Create casbin_rule table (policy storage)
-- =====================================================================
CREATE TABLE IF NOT EXISTS casbin_rule (
    id BIGSERIAL PRIMARY KEY,
    ptype VARCHAR(128) NOT NULL,
    v0 VARCHAR(128),
    v1 VARCHAR(128),
    v2 VARCHAR(128),
    v3 VARCHAR(128),
    v4 VARCHAR(128),
    v5 VARCHAR(128)
);
CREATE INDEX IF NOT EXISTS idx_casbin_rule_ptype ON casbin_rule(ptype);
CREATE INDEX IF NOT EXISTS idx_casbin_rule_v0 ON casbin_rule(v0);

-- =====================================================================
-- Phase 3: Business tables with BIGINT IDs
-- =====================================================================

-- questions
CREATE TABLE IF NOT EXISTS questions (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    answer JSONB,
    difficulty VARCHAR(32),
    language VARCHAR(32),
    starter_code TEXT,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);
CREATE INDEX IF NOT EXISTS idx_questions_status ON questions(status);

-- test_cases
CREATE TABLE IF NOT EXISTS test_cases (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL,
    input TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_test_cases_question_id ON test_cases(question_id);

-- papers
CREATE TABLE IF NOT EXISTS papers (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_papers_created_at ON papers(created_at);

-- paper_questions
CREATE TABLE IF NOT EXISTS paper_questions (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_paper_questions_paper_id ON paper_questions(paper_id);
CREATE INDEX IF NOT EXISTS idx_paper_questions_question_id ON paper_questions(question_id);

-- exams
CREATE TABLE IF NOT EXISTS exams (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    paper_id BIGINT,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_minutes INT NOT NULL DEFAULT 0,
    created_by BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exams_created_at ON exams(created_at);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_paper_id ON exams(paper_id);

-- submissions
CREATE TABLE IF NOT EXISTS submissions (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL DEFAULT 0,
    question_id BIGINT NOT NULL,
    answer JSONB,
    code TEXT,
    language VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    result JSONB,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    judged_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_submissions_exam_id ON submissions(exam_id);
CREATE INDEX IF NOT EXISTS idx_submissions_user_id ON submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

-- judge_tasks
CREATE TABLE IF NOT EXISTS judge_tasks (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL DEFAULT 0,
    language VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    retry_count INT NOT NULL DEFAULT 0,
    max_retry_count INT NOT NULL DEFAULT 3,
    error_message TEXT,
    result_summary JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    started_at TIMESTAMP,
    finished_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_judge_tasks_submission_id ON judge_tasks(submission_id);
CREATE INDEX IF NOT EXISTS idx_judge_tasks_user_id ON judge_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_judge_tasks_status ON judge_tasks(status);

-- client_events
CREATE TABLE IF NOT EXISTS client_events (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL DEFAULT 0,
    device_id VARCHAR(128),
    event_type VARCHAR(64) NOT NULL,
    payload JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_client_events_exam_id ON client_events(exam_id);
CREATE INDEX IF NOT EXISTS idx_client_events_user_id ON client_events(user_id);
CREATE INDEX IF NOT EXISTS idx_client_events_created_at ON client_events(created_at);

-- =====================================================================
-- Phase 4: Seed default admin user
-- Password: "examora-admin-2024" (bcrypt cost 10)
-- =====================================================================
INSERT INTO users (username, password_hash, status, display_name, auth_provider)
VALUES (
    'admin',
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZRGdjGj/n0RVQvq6RjlHv3mC0eXyK',
    'ACTIVE',
    'Administrator',
    'local'
);

-- =====================================================================
-- Phase 5: Seed default Casbin policies
-- =====================================================================
-- admin role: full access to admin resources
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
    ('p', 'admin', 'admin_dashboard', 'read'),
    ('p', 'admin', 'admin_dashboard', 'write'),
    ('p', 'admin', 'questions', 'read'),
    ('p', 'admin', 'questions', 'write'),
    ('p', 'admin', 'questions', 'delete'),
    ('p', 'admin', 'papers', 'read'),
    ('p', 'admin', 'papers', 'write'),
    ('p', 'admin', 'papers', 'delete'),
    ('p', 'admin', 'exams', 'read'),
    ('p', 'admin', 'exams', 'write'),
    ('p', 'admin', 'exams', 'delete'),
    ('p', 'admin', 'submissions', 'read'),
    ('p', 'admin', 'judge_tasks', 'read'),
    ('p', 'admin', 'judge_tasks', 'write');

-- client role: access to candidate-facing endpoints
INSERT INTO casbin_rule (ptype, v0, v1, v2) VALUES
    ('p', 'client', 'client', 'access'),
    ('p', 'client', 'submissions', 'read'),
    ('p', 'client', 'submissions', 'write'),
    ('p', 'client', 'client_events', 'read'),
    ('p', 'client', 'client_events', 'write');

-- role assignment: user id=1 (admin) gets admin role
INSERT INTO casbin_rule (ptype, v0, v1) VALUES
    ('g', '1', 'admin');

COMMIT;
