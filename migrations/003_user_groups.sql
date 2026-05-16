-- Examora schema - Phase 3: User groups and exam assignments

CREATE TABLE IF NOT EXISTS user_groups (
    id BIGSERIAL PRIMARY KEY,
    parent_id BIGINT,
    name VARCHAR(128) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    source VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
    external_provider VARCHAR(64),
    external_id VARCHAR(128),
    external_parent_id VARCHAR(128),
    sync_mode VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
    last_synced_at TIMESTAMP,
    created_by BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_user_groups_parent_id ON user_groups(parent_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_groups_external ON user_groups(external_provider, external_id);

CREATE TABLE IF NOT EXISTS user_group_members (
    id BIGSERIAL PRIMARY KEY,
    user_group_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    source VARCHAR(32) NOT NULL DEFAULT 'LOCAL',
    external_provider VARCHAR(64),
    external_group_id VARCHAR(128),
    external_user_id VARCHAR(128),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_group_members_group_user ON user_group_members(user_group_id, user_id);
CREATE INDEX IF NOT EXISTS idx_user_group_members_user_id ON user_group_members(user_id);

CREATE TABLE IF NOT EXISTS exam_assignments (
    id BIGSERIAL PRIMARY KEY,
    exam_id BIGINT NOT NULL,
    exam_snapshot_id BIGINT NOT NULL,
    target_type VARCHAR(32) NOT NULL,
    target_id BIGINT NOT NULL,
    created_by BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_exam_assignments_exam_target ON exam_assignments(exam_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_exam_assignments_exam_snapshot_id ON exam_assignments(exam_snapshot_id);
