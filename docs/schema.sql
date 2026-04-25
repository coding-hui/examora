CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    name VARCHAR(64) NOT NULL,
    email VARCHAR(255),
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(64) NOT NULL UNIQUE,
    name VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(128) NOT NULL UNIQUE,
    name VARCHAR(128) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id),
    role_id BIGINT NOT NULL REFERENCES roles(id),
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE role_permissions (
    role_id BIGINT NOT NULL REFERENCES roles(id),
    permission_id BIGINT NOT NULL REFERENCES permissions(id),
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    code VARCHAR(64) NOT NULL UNIQUE,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL REFERENCES subjects(id),
    type VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    score INT NOT NULL,
    difficulty VARCHAR(32),
    tags JSONB,
    config_json JSONB NOT NULL,
    answer_json JSONB,
    explanation TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE test_cases (
    id BIGSERIAL PRIMARY KEY,
    question_id BIGINT NOT NULL REFERENCES questions(id),
    input_text TEXT,
    output_text TEXT,
    input_path TEXT,
    output_path TEXT,
    score INT NOT NULL,
    is_sample BOOLEAN NOT NULL DEFAULT FALSE,
    is_hidden BOOLEAN NOT NULL DEFAULT TRUE,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE papers (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject_id BIGINT REFERENCES subjects(id),
    description TEXT,
    total_score INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paper_questions (
    id BIGSERIAL PRIMARY KEY,
    paper_id BIGINT NOT NULL REFERENCES papers(id),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    score INT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE (paper_id, question_id)
);

CREATE TABLE exams (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    paper_id BIGINT NOT NULL REFERENCES papers(id),
    subject_id BIGINT REFERENCES subjects(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL,
    rules_json JSONB NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'DRAFT',
    snapshot_version INT,
    created_by BIGINT REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE paper_snapshots (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id),
    paper_id BIGINT NOT NULL REFERENCES papers(id),
    version INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    total_score INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, version)
);

CREATE TABLE paper_question_snapshots (
    id BIGSERIAL PRIMARY KEY,
    paper_snapshot_id BIGINT NOT NULL REFERENCES paper_snapshots(id),
    question_id BIGINT NOT NULL REFERENCES questions(id),
    type VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    score INT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    config_json JSONB NOT NULL,
    answer_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE exam_sessions (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL REFERENCES exams(id),
    paper_snapshot_id BIGINT NOT NULL REFERENCES paper_snapshots(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    attempt_no INT NOT NULL DEFAULT 1,
    status VARCHAR(32) NOT NULL,
    started_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    client_device_id VARCHAR(128),
    client_version VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (exam_id, user_id, attempt_no)
);

CREATE TABLE answers (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES exam_sessions(id),
    question_snapshot_id BIGINT NOT NULL REFERENCES paper_question_snapshots(id),
    answer_json JSONB NOT NULL,
    score INT DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'SAVED',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (session_id, question_snapshot_id)
);

CREATE TABLE submissions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES exam_sessions(id),
    question_snapshot_id BIGINT NOT NULL REFERENCES paper_question_snapshots(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    language VARCHAR(32) NOT NULL,
    source_code TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    max_score INT NOT NULL DEFAULT 0,
    compile_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE judge_tasks (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id),
    status VARCHAR(32) NOT NULL,
    priority INT NOT NULL DEFAULT 0,
    retry_count INT NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE judge_case_results (
    id BIGSERIAL PRIMARY KEY,
    submission_id BIGINT NOT NULL REFERENCES submissions(id),
    test_case_id BIGINT REFERENCES test_cases(id),
    status VARCHAR(32) NOT NULL,
    score INT NOT NULL DEFAULT 0,
    time_ms INT,
    memory_kb INT,
    stdout TEXT,
    stderr TEXT,
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE scores (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES exam_sessions(id),
    objective_score INT NOT NULL DEFAULT 0,
    programming_score INT NOT NULL DEFAULT 0,
    manual_score INT NOT NULL DEFAULT 0,
    total_score INT NOT NULL DEFAULT 0,
    status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE client_logs (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT REFERENCES exam_sessions(id),
    user_id BIGINT NOT NULL REFERENCES users(id),
    event_type VARCHAR(64) NOT NULL,
    event_payload JSONB,
    client_device_id VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_exam_sessions_exam_user_status
    ON exam_sessions (exam_id, user_id, status);

CREATE INDEX idx_answers_session_question
    ON answers (session_id, question_snapshot_id);

CREATE INDEX idx_submissions_session_question_created
    ON submissions (session_id, question_snapshot_id, created_at DESC);

CREATE INDEX idx_judge_tasks_status_priority_created
    ON judge_tasks (status, priority, created_at);

CREATE INDEX idx_client_logs_session_created
    ON client_logs (session_id, created_at DESC);
