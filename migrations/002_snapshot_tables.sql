-- Examora schema - Phase 2: Exam snapshots and sessions
-- M1: Frozen snapshots for exam publishing and candidate-safe paper retrieval

BEGIN;

-- =====================================================================
-- M3: paper_sections - Structured paper outline for existing deployments
-- =====================================================================
CREATE TABLE IF NOT EXISTS paper_sections (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_paper_sections_paper_id ON paper_sections(paper_id);

ALTER TABLE paper_questions ADD COLUMN IF NOT EXISTS section_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_paper_questions_section_id ON paper_questions(section_id);

INSERT INTO paper_sections (paper_id, title, description, sort_order)
SELECT p.id, '第一大题', '', 1
FROM papers p
WHERE NOT EXISTS (
    SELECT 1 FROM paper_sections ps WHERE ps.paper_id = p.id
);

UPDATE paper_questions pq
SET section_id = ps.id
FROM paper_sections ps
WHERE pq.paper_id = ps.paper_id
  AND pq.section_id IS NULL
  AND ps.sort_order = (
      SELECT MIN(ps2.sort_order) FROM paper_sections ps2 WHERE ps2.paper_id = pq.paper_id
  );

-- =====================================================================
-- M1: exam_snapshots - Published exam frozen state
-- =====================================================================
CREATE TABLE IF NOT EXISTS exam_snapshots (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL UNIQUE,
    paper_snapshot_id BIGINT NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    published_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exam_snapshots_exam_id ON exam_snapshots(exam_id);

-- =====================================================================
-- M3: paper_section_snapshots - Frozen paper sections for published exams
-- =====================================================================
CREATE TABLE IF NOT EXISTS paper_section_snapshots (
    id BIGSERIAL PRIMARY KEY,
    exam_snapshot_id BIGINT NOT NULL,
    source_section_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    question_count INT NOT NULL DEFAULT 0,
    total_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_paper_section_snapshots_exam_snapshot_id ON paper_section_snapshots(exam_snapshot_id);

-- =====================================================================
-- M1: question_snapshots - Frozen question content for published exams
-- =====================================================================
CREATE TABLE IF NOT EXISTS question_snapshots (
    id BIGSERIAL PRIMARY KEY,
    exam_snapshot_id BIGINT NOT NULL,
    section_snapshot_id BIGINT,
    question_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    question_sort_order INT NOT NULL DEFAULT 0,
    -- Internal-only fields (candidate API must never expose these)
    answer JSONB,
    test_cases JSONB,
    starter_code TEXT,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_snapshots_exam_snapshot_id ON question_snapshots(exam_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_question_snapshots_section_snapshot_id ON question_snapshots(section_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_question_snapshots_question_id ON question_snapshots(question_id);

-- =====================================================================
-- M1: exam_sessions - Candidate exam session state
-- =====================================================================
CREATE TABLE IF NOT EXISTS exam_sessions (
    id BIGSERIAL PRIMARY KEY,
    exam_snapshot_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'NOT_STARTED',
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    remaining_seconds INT,
    ip_address VARCHAR(64),
    device_id VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_sessions_exam_user ON exam_sessions(exam_snapshot_id, user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_user_id ON exam_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_exam_sessions_status ON exam_sessions(status);

-- =====================================================================
-- M2: answer_drafts - Candidate saved answers keyed by snapshot question
-- =====================================================================
CREATE TABLE IF NOT EXISTS answer_drafts (
    id BIGSERIAL PRIMARY KEY,
    exam_session_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    answer JSONB,
    saved_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_answer_draft_session_question ON answer_drafts(exam_session_id, question_id);

-- =====================================================================
-- M2: exam_results - Whole-paper grading summary
-- =====================================================================
CREATE TABLE IF NOT EXISTS exam_results (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    exam_snapshot_id BIGINT NOT NULL,
    exam_session_id BIGINT NOT NULL UNIQUE,
    user_id BIGINT NOT NULL,
    status VARCHAR(32) NOT NULL,
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP NOT NULL,
    graded_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_exam_snapshot_id ON exam_results(exam_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_exam_results_user_id ON exam_results(user_id);

-- =====================================================================
-- M2: question_results - Per-question grading result
-- =====================================================================
CREATE TABLE IF NOT EXISTS question_results (
    id BIGSERIAL PRIMARY KEY,
    exam_result_id BIGINT NOT NULL,
    exam_session_id BIGINT NOT NULL,
    question_snapshot_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    answer JSONB,
    status VARCHAR(32) NOT NULL,
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    max_score DOUBLE PRECISION NOT NULL DEFAULT 0,
    result JSONB,
    submission_id BIGINT,
    judged_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_results_exam_result_id ON question_results(exam_result_id);
CREATE INDEX IF NOT EXISTS idx_question_results_exam_session_id ON question_results(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_question_results_question_snapshot_id ON question_results(question_snapshot_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_question_result_exam_question ON question_results(exam_result_id, question_snapshot_id);
CREATE INDEX IF NOT EXISTS idx_question_results_submission_id ON question_results(submission_id);

COMMIT;
