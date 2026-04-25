# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

### Frontend (pnpm workspace)
```bash
pnpm install          # install dependencies
pnpm dev:admin        # admin-web dev server on :5173
pnpm dev:desktop      # exam-desktop dev server on :5174
pnpm -r build         # build all workspace packages
pnpm -r typecheck     # type-check all workspace packages
```

### Rust (Cargo workspace)
```bash
cargo check           # type-check all Rust crates
cargo run -p examora-api           # run API service
cargo run -p examora-judge-worker   # run judge worker
```

### Infrastructure (Docker)
```bash
make infra-up         # docker compose up -d (Postgres + Redis)
make infra-down       # docker compose down
```

### Combined / root
```bash
make deps             # pnpm install
make cargo-check      # cargo check
make api              # cargo run -p examora-api
make worker           # cargo run -p examora-judge-worker
```

## Architecture

Examora is a monorepo with three logical layers:

**ClientSide**
- `apps/admin-web` — Vue 3 admin console (no API client wired yet)
- `apps/exam-desktop` — Tauri 2 + Vue 3 desktop exam client (uses `@examora/client`)

**ServiceLayer**
- `services/api` — Rust Axum API server (skeleton; only health endpoint exists; binds `:8080`)
- `services/judge-worker` — Rust async worker consuming from Redis Stream (currently mock; exits on start)
- `services/sandbox-runner` — Rust library crate; `run_job()` stub returns `Unimplemented`

**DataLayer**
- PostgreSQL 16 on `:5432`, Redis 7 on `:6379` (from `deploy/docker-compose.yml`)
- MinIO for file storage — **deferred** (not in docker-compose, not required for MVP)

**Shared packages** (`packages/`)
- `@examora/types` — TypeScript types split by role boundary (admin vs. candidate). All candidate-facing types exclude answers and hidden test cases.
- `@examora/client` — minimal fetch-based client (stub; needs method implementations)
- `@examora/utils` — currently unused ghost package

## Critical Data Boundaries

1. **Source vs. snapshot** — `questions`/`papers` are editable source; exam publish freezes to `paper_snapshots`/`paper_question_snapshots`. All scoring reads from snapshots, never source.

2. **Answers vs. submissions** — Answer drafts go to `answers` table; formal programming judge attempts go to `submissions` + `judge_tasks` tables.

3. **Admin vs. candidate types** — `AdminQuestion` contains `answer`; `QuestionSnapshot` never exposes it. This boundary is enforced at the type level via `@examora/types`.

## Judge Flow (planned, not yet implemented)

1. `POST /api/client/programming/submissions` → inserts `submissions` + `judge_tasks` rows, enqueues to Redis Stream
2. `judge-worker` consumes from Redis Stream → reads submission + test cases from PostgreSQL → calls `sandbox-runner` → writes `judge_case_results` → updates `submissions.status`
3. Candidate polls status until terminal state

Submission statuses: `PENDING → JUDGING → COMPILING → RUNNING → ACCEPTED | PARTIAL_ACCEPTED | WRONG_ANSWER | COMPILATION_ERROR | RUNTIME_ERROR | TIME_LIMIT_EXCEEDED | MEMORY_LIMIT_EXCEEDED | OUTPUT_LIMIT_EXCEEDED | SYSTEM_ERROR`

## Key Files

- `website/docs/getting-started/` — Setup and development guide
- `website/docs/concepts/architecture/` — System architecture and components
- `website/docs/reference/api/` — API contract reference
- `website/docs/reference/database/` — Database model documentation (schema planned for Phase 1)
- `website/docs/reference/judge-runtime/` — Sandbox execution design
