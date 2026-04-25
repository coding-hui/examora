# Examora MVP v1 Architecture

## Objective

Examora MVP v1 is a modular monolith with one user-facing backend, one asynchronous judge worker, and a constrained sandbox boundary.

The first production goal is a reliable exam loop:

1. Admin creates subject, questions, paper, and exam
2. Exam is published and frozen into snapshots
3. Student starts a desktop exam session
4. Student answers questions and saves drafts
5. Student submits the exam
6. Backend calculates the score and stores the result

## Components

### `apps/admin-web`

- Vue 3 + TypeScript admin console
- Uses admin-only DTOs
- Can manage source questions and published exams
- Cannot read candidate session data without explicit admin APIs

### `apps/exam-desktop`

- Tauri 2 shell with Vue 3 frontend
- Uses candidate-only DTOs
- Owns local cache, exam mode controls, and anti-cheat event collection
- Never receives answers or hidden test cases

### `services/api`

- Rust Axum modular monolith
- Owns authentication, RBAC, question management, exam sessions, scoring, programming submission creation, and client log ingestion
- Generates exam snapshots at publish time
- Is the only service allowed to speak to both frontend applications

### `services/judge-worker`

- Consumes programming judge tasks from Redis Stream
- Reads submissions and test cases
- Writes submission status, per-case results, and final score
- Can run in mock mode first and real sandbox mode later

### `services/sandbox-runner`

- Stateless execution abstraction for compile/run tasks
- Receives one job payload at a time
- Must not access PostgreSQL, Redis, or business API
- Runs under a separate trust boundary from the worker

## Critical Boundaries

### Source data vs frozen exam data

- `questions`, `papers`, and `paper_questions` are editable source models
- Published exams are served from snapshot tables only
- All scoring logic reads from snapshots, not source rows

### Candidate DTO vs admin DTO

- Admin DTOs may include answers, hidden cases, and full management metadata
- Candidate DTOs exclude `answer_json`, hidden cases, and leak-prone explanation fields
- Shared frontend types are split by role instead of sharing a single question model

### Answer drafts vs programming submissions

- `answers` is the single source of truth for current exam progress
- Programming question drafts are stored inside `answers.answer_json`
- Each formal program run creates a `submissions` row
- Final grading uses `answers.answer_json.final_submission_id`

## Runtime Flow

### Standard question flow

1. Student starts session
2. Desktop pulls frozen paper snapshot
3. Desktop autosaves to local JSON and backend `answers`
4. Student submits exam
5. API computes objective scores from snapshot answers

### Programming question flow

1. Desktop autosaves code draft to `answers`
2. Student clicks submit/run
3. API creates `submissions` and a `judge_tasks` item
4. `judge-worker` processes the task
5. Worker writes `judge_case_results` and updates `submissions`
6. Desktop polls submission state
7. Exam submission uses the selected final submission ID

## Security Posture

- Desktop anti-cheat data is advisory only
- Published exam content is immutable for scoring purposes
- User code is never executed inside the API process
- Sandbox nodes are non-root, isolated, and network-disabled by default
