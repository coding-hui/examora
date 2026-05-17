# Examora Next Development Plan

## Current Source of Truth

The current high-level product and architecture roadmap is:

- `docs/superpowers/specs/2026-05-17-examora-industry-exam-system-roadmap-design.md`

The staged implementation index is:

- `docs/superpowers/plans/2026-05-17-examora-module-batches.md`

This file keeps the internal engineering route aligned with those documents and records the admin route baseline that future work should build on.

## Admin Route Baseline

Use the new admin information architecture only:

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

Legacy routes stay removed and should resolve through the 404 fallback:

- `/admin/questions` -> `/content/library/questions`
- `/admin/papers` -> `/content/papers`
- `/admin/exams` -> `/examination/exams`
- `/assessment/results/submissions` -> `/examination/submissions`
- `/assessment/results/judge-tasks` -> `/examination/judge-tasks`
- `/monitoring/proctoring/events` -> `/examination/events`
- `/examination/candidates` has no replacement until assignment management is implemented.

## Batch Execution Route

1. Admin Baseline
   - Stabilize route migration, paper pre-publish checks, real audit events page, and theme behavior.
   - Verify admin tests, lint, build, Go tests, and Chrome route checks.
2. Publish Safety
   - Enforce paper and exam publish readiness in backend services.
   - Direct API calls must not publish empty papers, zero-score papers, draft-question papers, or invalid exams.
3. Content Asset Center
   - Harden question lifecycle, dependency checks, programming test-case requirements, and paper preview.
4. Exam Operations Center
   - Make exam detail the operational console for snapshots, assignments, sessions, submissions, judge tasks, and events.
5. Candidate Desktop Flow
   - Complete assigned exam list, start/resume, safe snapshot loading, autosave, and final submission.
6. Scoring and Judge Visibility
   - Complete objective scoring visibility and programming judge result state.
7. Audit and Risk Review
   - Normalize client events into searchable admin audit data without treating audit signals as automatic cheating conclusions.
8. Reports, Operations, and Docs
   - Add lightweight reports, operational scripts, and public documentation updates.

## Guardrails

- Keep admin DTOs and candidate DTOs separate.
- Candidate APIs must not expose answer keys, hidden test cases, or internal scoring data.
- Source questions and papers remain mutable library assets; published exams must use frozen snapshots.
- Every batch should leave a working vertical slice and pass its declared verification commands.
