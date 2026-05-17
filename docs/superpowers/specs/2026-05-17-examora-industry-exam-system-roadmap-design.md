# Examora Industry Exam System Roadmap Design

## Purpose

Examora should evolve from an MVP into a practical online examination and coding assessment system. The design follows common patterns from mainstream exam and assessment platforms: controlled content authoring, immutable published exams, candidate-safe delivery, resumable exam sessions, auditable client events, automatic scoring, asynchronous code judging, and admin-facing operational visibility.

This document is the product and architecture route. Detailed implementation steps live in `docs/superpowers/plans/2026-05-17-examora-module-batches.md`.

## Design Principles

- Keep source content and published delivery separate: questions and papers remain editable source assets; exams read frozen snapshots after publishing.
- Keep admin and candidate data contracts separate: admin DTOs may include answers and hidden test cases; candidate DTOs must never expose scoring internals.
- Treat proctoring events as audit signals, not final cheating conclusions.
- Prefer small, testable slices that preserve a working main path after every batch.
- Use existing stack and boundaries: Go/Gin/GORM/Redis/Asynq on the backend, `packages/types` for shared DTOs, Ant Design Pro admin, and Tauri/Vue desktop.

## Target Module Map

### Content Asset Center

Admins manage reusable assessment assets:

- Question bank with objective, subjective, and programming questions.
- Question status lifecycle: draft to published, with dependency checks before delete or unpublish.
- Programming test cases split into samples and hidden cases.
- Paper assembly with sections, ordering, scores, publish readiness checks, and preview.

Mainstream reference behavior: content can be edited safely before publishing, but published exams are not affected by later source edits.

### Exam Operations Center

Admins configure and operate exams:

- Create exam, bind published paper, set time window and duration.
- Publish exam to immutable snapshots.
- Assign candidates directly or by user group.
- Monitor sessions, submissions, audit events, and results from a single exam detail page.
- Close or archive exams after delivery.

Mainstream reference behavior: publishing is a controlled transition with strict validation; the exam detail page acts as the operations console.

### Candidate Desktop Flow

Candidates use the desktop client for controlled exam delivery:

- Login, see assigned exams, start or resume a session.
- Load candidate-safe paper snapshots.
- Answer objective questions and programming questions.
- Auto-save answers and submit the final paper.
- Report client audit events such as heartbeat, device binding, answer save, submit, focus loss, and runtime errors.

Mainstream reference behavior: answers are resilient to refresh/restart, and the client never receives answer keys or hidden test cases.

### Scoring and Judge Pipeline

The system scores submissions through a mixed pipeline:

- Objective questions score synchronously from snapshots.
- Programming questions create asynchronous judge tasks.
- Judge worker runs sandbox cases and stores task/result summaries.
- Subjective questions remain pending manual grading in a later expansion.

Mainstream reference behavior: scoring state is transparent to admins and candidates, with retry and failure visibility for code judging.

### Monitoring, Results, and Reporting

Admins review operational and assessment outcomes:

- Audit event list by exam, user, event type, and time.
- Submission/result detail with question-level scoring.
- Judge task list with status, language, retry, error summary, and timing.
- Lightweight reports: score distribution, pass rate, item correctness, judge failure rate.

Mainstream reference behavior: reporting supports post-exam review without turning audit signals into automatic disciplinary decisions.

### System Administration

Admins manage platform identities and access:

- Local users and user groups.
- Role-based access for admin and candidate flows.
- Optional external identity mapping remains behind existing auth abstractions.
- Operational docs for health checks, seeds, migrations, and deployment.

## Data and API Boundaries

- `library` remains the source domain for questions, test cases, papers, and paper sections.
- `exam` owns exams, snapshots, sessions, assignments, drafts, results, and client events.
- `judge` owns judge tasks, worker processing, sandbox calls, and result summaries.
- `packages/types` is the source for frontend DTOs shared across admin, desktop, and client package.
- Candidate API payloads must be checked in tests for absence of `answer`, `test_cases`, `hidden_test_cases`, and internal scoring fields.

## Route Direction

The admin information architecture uses the new route set only:

- `/overview/dashboard`
- `/content/library/questions`
- `/content/library/programming`
- `/content/papers`
- `/examination/exams`
- `/examination/submissions`
- `/examination/judge-tasks`
- `/examination/events`
- `/system/settings/users`
- `/system/settings/user-groups`

Legacy `/admin/*`, `/assessment/*`, `/monitoring/*`, and `/examination/candidates` routes stay removed and should resolve to the 404 fallback.

## Batch Roadmap

### Batch 0: Admin Baseline

Stabilize the current admin modernization as the new baseline: route migration, paper pre-publish checks, real audit events page, theme default following system, and verification commands.

### Batch 1: Publish Safety

Move publish-readiness rules into backend services so direct API calls cannot publish invalid papers or exams.

### Batch 2: Content Asset Center

Harden question and paper management around dependency checks, status transitions, paper preview, and authoring ergonomics.

### Batch 3: Exam Operations Center

Make exam detail the operational console for snapshot metadata, assignments, sessions, results, and events.

### Batch 4: Candidate Desktop Flow

Build the desktop candidate path from login through start, answer, autosave, resume, and submit.

### Batch 5: Scoring and Judge Visibility

Complete scoring and judging visibility for objective and programming questions.

### Batch 6: Audit and Risk Review

Normalize client events and expose them as searchable admin audit data.

### Batch 7: Reports, Operations, and Docs

Add lightweight reports, operational scripts, and public/internal documentation updates.

## Acceptance Criteria

- Admin can create questions, publish questions, assemble papers, publish papers, create exams, publish exams, assign users, and inspect exam operation state.
- Candidate can take an assigned exam through desktop and submit answers.
- Objective scores and programming judge tasks are visible after submission.
- Candidate-safe APIs do not leak sensitive fields.
- Every batch leaves the repository passing agreed verification commands.
