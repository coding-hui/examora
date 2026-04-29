-- Examora schema - Phase 2: Exam snapshots and sessions
-- M1: Frozen snapshots for exam publishing and candidate-safe paper retrieval

BEGIN;

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
    published_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_exam_snapshots_exam_id ON exam_snapshots(exam_id);

-- =====================================================================
-- M1: question_snapshots - Frozen question content for published exams
-- =====================================================================
CREATE TABLE IF NOT EXISTS question_snapshots (
    id BIGSERIAL PRIMARY KEY,
    exam_snapshot_id BIGINT NOT NULL,
    question_id BIGINT NOT NULL,
    type VARCHAR(32) NOT NULL,
    title VARCHAR(255) NOT NULL,
    content JSONB NOT NULL DEFAULT '{}',
    score DOUBLE PRECISION NOT NULL DEFAULT 0,
    sort_order INT NOT NULL DEFAULT 0,
    -- Internal-only fields (candidate API must never expose these)
    answer JSONB,
    test_cases JSONB,
    starter_code TEXT,
    time_limit_ms INT NOT NULL DEFAULT 2000,
    memory_limit_mb INT NOT NULL DEFAULT 256,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_question_snapshots_exam_snapshot_id ON question_snapshots(exam_snapshot_id);
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

COMMIT;