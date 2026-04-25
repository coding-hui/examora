# Examora MVP v1 Database Design

## Core principles

- Source models are editable; exam delivery models are frozen snapshots
- Draft answers and formal programming submissions are separate
- Database design must support a future second attempt without breaking the schema

## Primary tables

### Identity and access

- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`

### Question bank

- `subjects`
- `questions`
- `test_cases`
- `papers`
- `paper_questions`

### Exam delivery

- `exams`
- `paper_snapshots`
- `paper_question_snapshots`
- `exam_sessions`
- `answers`
- `scores`

### Programming judge

- `submissions`
- `judge_tasks`
- `judge_case_results`

### Audit

- `client_logs`

## Question data rules

- `config_json` stores only display/runtime config
- `answer_json` stores only scoring truth
- Hidden test cases live in `test_cases` with `is_hidden = true`
- Candidate APIs never read from `questions.answer_json` directly

## Session rules

- `exam_sessions` is unique on `(exam_id, user_id, attempt_no)`
- MVP business logic allows only `attempt_no = 1`
- Future retakes can increment `attempt_no` without schema changes

## Snapshot rules

- `paper_snapshots` is created when an exam is published
- `paper_question_snapshots` stores frozen question payloads and answer payloads for that exam
- All scoring paths must read snapshot records, not source `questions`

## SQL reference

The authoritative bootstrap schema lives in `docs/schema.sql`.
