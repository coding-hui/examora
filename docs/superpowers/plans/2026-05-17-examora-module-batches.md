# Examora Module Batches Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Examora in staged, independently verifiable batches aligned with mainstream online exam and coding assessment systems.

**Architecture:** Preserve the current monorepo boundaries: Go domains in `internal/`, shared DTOs in `packages/types`, admin UI in `apps/admin`, desktop candidate UI in `apps/desktop`, and documentation in `website/` plus `docs/superpowers`. Each batch must leave a working vertical slice and avoid leaking admin-only fields to candidate APIs.

**Tech Stack:** Go 1.25, Gin, GORM, Redis, Asynq, Casbin, JWT, React 19, Umi Max, Ant Design Pro, Vue 3, Tauri v2, TypeScript, pnpm.

---

## File Structure

- `docs/superpowers/specs/2026-05-17-examora-industry-exam-system-roadmap-design.md`: high-level product and architecture route.
- `docs/superpowers/plans/2026-05-17-examora-module-batches.md`: this staged implementation index.
- `.tech/03-next-development-plan.md`: update after Batch 0 to remove stale legacy route references and align with the staged roadmap.
- `internal/library`, `internal/exam`, `internal/judge`, `internal/api`: backend implementation areas for publish safety, sessions, scoring, and audit data.
- `apps/admin/src/pages`: admin module implementation area.
- `apps/desktop/src`: desktop candidate module implementation area.
- `packages/types/src/index.ts`: shared DTO and path contract area.
- `website/docs`: public documentation updates after stable feature batches.

## Batch 0: Admin Baseline

**Objective:** Finish and commit the current admin modernization baseline before starting new module work.

**Files:**
- Existing admin changes in `apps/admin/config`, `apps/admin/src/pages`, `apps/admin/src/theme`, and `apps/admin/src/locales`
- Update: `.tech/03-next-development-plan.md`

- [x] Verify current admin changes.

Run:

```bash
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
pnpm --dir apps/admin build
go test ./...
```

Expected:

```text
All admin tests pass, TypeScript passes, admin build compiles, and Go tests pass.
```

- [x] Chrome-check current admin baseline.

Check:

```text
/content/papers/:id shows compact save-bar publish readiness.
/examination/events shows the real event page.
/admin/exams shows the 404 fallback.
/monitoring/proctoring/events shows the 404 fallback.
/assessment/results/submissions shows the 404 fallback.
```

- [x] Update `.tech/03-next-development-plan.md`.

Replace stale legacy route references:

```text
/admin/questions -> /content/library/questions
/admin/papers -> /content/papers
/admin/exams -> /examination/exams
/assessment/results/submissions -> /examination/submissions
/assessment/results/judge-tasks -> /examination/judge-tasks
/monitoring/proctoring/events -> /examination/events
```

Add a note that `docs/superpowers/specs/2026-05-17-examora-industry-exam-system-roadmap-design.md` is the current high-level roadmap.

- [x] Commit Batch 0.

```bash
git add apps/admin docs/superpowers .tech/03-next-development-plan.md
git commit -m "Normalize admin module roadmap"
```

## Batch 1: Publish Safety

**Objective:** Enforce publish rules in backend services, not only in admin UI.

**Files:**
- Modify: `internal/library/paper.go`
- Modify: `internal/exam/snapshot_service.go`
- Modify: `internal/api/library_test.go`
- Modify: `internal/exam/snapshot_service_test.go`
- Modify: `packages/types/src/index.ts` only if error response metadata is added

- [x] Add tests for invalid paper publish.

Cases:

```text
Paper with zero questions cannot transition to PUBLISHED.
Paper with total score 0 cannot transition to PUBLISHED.
Paper containing DRAFT question cannot transition to PUBLISHED.
Paper containing 0-score question cannot transition to PUBLISHED.
```

Run:

```bash
go test ./internal/library -run Paper -v
go test ./internal/api -run Library -v
```

Expected initial result before implementation:

```text
At least one new publish-safety test fails because backend validation is missing.
```

- [x] Implement paper publish validation.

Rules:

```text
Only DRAFT and PUBLISHED are valid paper statuses.
Transition to PUBLISHED requires question_count > 0.
Transition to PUBLISHED requires total_score > 0.
Every included question must be PUBLISHED.
Every included paper question score must be > 0.
```

- [x] Add tests for invalid exam publish.

Cases:

```text
Exam with no paper cannot publish.
Exam bound to DRAFT paper cannot publish.
Exam bound to empty paper cannot publish.
Exam snapshot includes at least one question after valid publish.
```

Run:

```bash
go test ./internal/exam -run Publish -v
go test ./internal/api -run Exam -v
```

- [x] Implement exam publish validation.

Rules:

```text
Exam must be DRAFT.
Exam must bind an existing PUBLISHED paper.
Paper outline must contain at least one question.
Snapshot creation must fail before status update if validation fails.
```

- [x] Verify Batch 1.

Run:

```bash
go test ./...
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
```

## Batch 2: Content Asset Center

**Objective:** Make question and paper authoring reliable enough for repeated admin use.

**Files:**
- Modify: `apps/admin/src/pages/Content/Library/Questions`
- Modify: `apps/admin/src/pages/Content/Papers`
- Modify: `internal/library/question.go`
- Modify: `internal/library/paper.go`
- Modify: `packages/types/src/index.ts`

- [x] Add backend dependency tests.

Cases:

```text
Question used by a paper cannot be hard-deleted.
Published question used by a published paper cannot be unpublished.
Programming question cannot publish without at least one sample test case and one hidden test case.
```

- [x] Implement dependency-safe question status actions.

Expected behavior:

```text
Admin receives clear error messages when status changes are blocked.
Batch status actions report per-item success and failure.
```

- [x] Improve paper preview and readiness display.

Expected behavior:

```text
Paper detail shows section order, question count, total score, unpublished count, and zero-score count.
Save bar stays compact and does not resize the layout unexpectedly.
```

- [x] Verify Batch 2.

Run:

```bash
go test ./internal/library ./internal/api
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
pnpm --dir apps/admin build
```

## Batch 3: Exam Operations Center

**Objective:** Make exam detail the admin operations console.

**Files:**
- Modify: `apps/admin/src/pages/Examination/ExamDetail`
- Modify: `apps/admin/src/pages/Examination/ExamList`
- Modify: `internal/api/exam.go`
- Modify: `packages/types/src/index.ts`

- [x] Add snapshot metadata to admin exam detail responses.

Fields:

```text
exam_snapshot_id
published_at
snapshot_question_count
snapshot_total_score
```

- [x] Add tests for exam detail metadata.

Run:

```bash
go test ./internal/api -run Exam -v
```

- [x] Update admin exam detail overview.

Display:

```text
Exam status
Paper id
Snapshot id
Published time
Candidate count
Submitted count
Result count
Audit event count
```

- [x] Replace fixed 100-row loads with paginated requests for sessions, results, and events.

Expected behavior:

```text
Each tab requests page and page_size from the table pagination state.
Reload preserves selected exam and active tab.
```

- [x] Verify Batch 3.

Run:

```bash
go test ./internal/api ./internal/exam
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
pnpm --dir apps/admin build
```

## Batch 4: Candidate Desktop Flow

**Objective:** Build a usable desktop exam-taking path.

**Files:**
- Modify: `apps/desktop/src/App.vue`
- Create or modify desktop pages/components under `apps/desktop/src`
- Modify: `packages/client/src/index.ts`
- Modify: `packages/types/src/index.ts`

- [ ] Add desktop auth state and API client wiring.

Expected behavior:

```text
Candidate can log in with local JWT.
Token is stored only in desktop app state or local storage according to current desktop conventions.
Logout clears token and local exam state.
```

- [ ] Add available exams list.

API:

```text
GET /api/v1/exams/available
```

Expected behavior:

```text
List shows assigned exams with status, start/end time, and duration.
Unavailable exams have disabled start action with reason.
```

- [ ] Add exam session start and resume.

APIs:

```text
POST /api/v1/exams/:id/sessions/start
GET /api/v1/exams/:id/sessions/current
GET /api/v1/exams/:id/paper
```

Expected behavior:

```text
Starting an exam creates or resumes the session.
Refreshing the desktop route reloads current session and draft answers.
```

- [ ] Add answer rendering and auto-save.

Expected behavior:

```text
Objective questions render from candidate-safe content.
Programming questions render starter code and language.
Answers auto-save every 30 seconds and on navigation away.
Save status is visible but not noisy.
```

- [ ] Add final submit.

API:

```text
POST /api/v1/exams/:id/submit
```

Expected behavior:

```text
Submit requires confirmation.
Submitted sessions become read-only.
Candidate sees submission success and result pending state.
```

- [ ] Verify Batch 4.

Run:

```bash
pnpm --dir apps/desktop typecheck
pnpm --dir apps/desktop build
go test ./internal/api ./internal/exam
```

## Batch 5: Scoring and Judge Visibility

**Objective:** Make scoring and judging transparent to admins.

**Files:**
- Modify: `internal/exam/grading.go`
- Modify: `internal/judge/service.go`
- Modify: `internal/judge/worker/handler.go`
- Modify: `apps/admin/src/pages/Assessment/Results`
- Modify: `packages/types/src/index.ts`

- [ ] Add grading tests for objective question types.

Cases:

```text
Single choice exact match scores full points.
Multiple choice requires exact set match for MVP.
True/false exact match scores full points.
Fill blank exact normalized string match scores full points.
Missing answer scores zero.
```

- [ ] Add judge task lifecycle tests.

Cases:

```text
Programming answer creates judge task.
Accepted task updates question result.
System error task remains visible with error summary.
```

- [ ] Improve admin result detail.

Display:

```text
Question title or id
Question type
Score / max score
Status
Objective answer summary
Programming result summary
Judge task link when available
```

- [ ] Verify Batch 5.

Run:

```bash
go test ./internal/exam ./internal/judge ./internal/api
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
```

## Batch 6: Audit and Risk Review

**Objective:** Normalize client audit events and expose useful admin review filters.

**Files:**
- Modify: `internal/exam/client_event.go`
- Modify: `internal/api/exam.go`
- Modify: `apps/admin/src/pages/Monitoring/Proctoring/Events`
- Modify: `packages/types/src/index.ts`

- [ ] Define normalized event type constants.

Event types:

```text
HEARTBEAT
DEVICE_BIND
ANSWER_SAVE
SUBMIT
FOCUS_LOST
FOCUS_RETURNED
NETWORK_CHANGE
CLIENT_ERROR
SECURITY_REPORT
```

- [ ] Add API tests for event recording and listing.

Cases:

```text
Candidate can record event for assigned exam.
Admin can list events by exam.
Event list supports page and page_size.
Event payload is preserved as JSON.
```

- [ ] Add admin filters.

Filters:

```text
Exam
User id
Event type
Time range
```

- [ ] Verify Batch 6.

Run:

```bash
go test ./internal/exam ./internal/api
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
```

## Batch 7: Reports, Operations, and Documentation

**Objective:** Add lightweight reporting and keep docs aligned with the implemented platform.

**Files:**
- Modify or create docs under `website/docs`
- Modify or create scripts under `scripts`
- Modify: `website/docs/reference/api/README.md`
- Modify: `website/docs/reference/database/README.md`
- Modify: `website/docs/concepts/exam-lifecycle/README.md`

- [ ] Add admin reporting endpoints or computed frontend summaries.

MVP report metrics:

```text
Exam candidate count
Submitted count
Average score
Score distribution buckets
Question correctness rate
Judge failure rate
```

- [ ] Add operational verification script.

Script behavior:

```text
Run backend tests.
Run admin tests, lint, and build.
Run desktop typecheck.
Print exact command failures.
```

- [ ] Update public docs.

Docs to align:

```text
API reference includes admin and candidate routes.
Database reference documents source vs snapshot tables.
Exam lifecycle explains draft, published, running, submitted, closed.
Desktop client docs explain safe delivery and audit events.
```

- [ ] Verify Batch 7.

Run:

```bash
go test ./...
pnpm --dir apps/admin jest --runInBand
pnpm --dir apps/admin lint
pnpm --dir apps/admin build
pnpm --dir apps/desktop typecheck
pnpm --dir website build
```

## Global Done Criteria

The roadmap is complete when:

```text
Admin can author content, publish exams, assign users, inspect sessions, inspect events, and inspect results.
Candidate can take and submit an assigned exam in the desktop client.
Objective scoring and programming judge tasks produce visible results.
Candidate APIs do not leak answers or hidden cases.
Legacy admin routes stay removed.
All global verification commands pass.
```
