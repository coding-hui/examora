# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

### Frontend (pnpm workspace)
```bash
pnpm install          # install dependencies
pnpm dev:admin        # admin-web dev server on :5173
pnpm dev:desktop      # desktop dev server on :5174
pnpm -r build         # build all workspace packages
pnpm -r typecheck     # type-check all workspace packages
```

### Go (cmd workspace)
```bash
go build ./...         # build all Go packages
go test ./...          # run all tests
go run ./cmd/api       # run API server
go run ./cmd/worker    # run judge worker
go run ./cmd/sandbox   # run sandbox runner
```

### Infrastructure (Docker)
```bash
make infra-up         # docker compose up -d (Postgres + Redis) for production
make infra-down       # docker compose down
```
Note: For local development, SQLite is used by default (no Docker needed).

### Combined / root
```bash
make deps             # pnpm install + go mod download
make api              # go run ./cmd/api
make worker           # go run ./cmd/worker
```

## Architecture

Examora is a monorepo with three logical layers:

**ClientSide**
- `apps/admin` — React + Umi admin console
- `apps/desktop` — Tauri 2 + React desktop exam client (uses `@examora/client`)

**ServiceLayer**
- `cmd/api` — Go Gin API server (binds `:8080`)
- `cmd/worker` — Go async worker using Asynq + Redis Stream
- `cmd/sandbox` — Go sandbox runner (isolated execution environment)

**Internal packages** (`internal/`)
- `auth` — JWT/JWKS authentication
- `exam` — Exam management
- `judge` — Judge orchestration
- `paper` — Paper/snapshot management
- `question` — Question bank
- `submission` — Submission handling
- `user` — User management
- `platform` — Platform settings
- `client` — Candidate-facing API client

**DataLayer**
- SQLite for local development (auto-created as `./examora.db`)
- PostgreSQL 16 on `:5432` for production (via Docker)
- Redis 7 on `:6379` for job queue
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

1. `POST /api/v1/submissions` → inserts `submissions` + `judge_tasks` rows, enqueues to Redis Stream
2. `judge-worker` consumes from Redis Stream → reads submission + test cases from PostgreSQL → calls `sandbox-runner` → writes `judge_case_results` → updates `submissions.status`
3. Candidate polls status until terminal state

Submission statuses: `PENDING → JUDGING → COMPILING → RUNNING → ACCEPTED | PARTIAL_ACCEPTED | WRONG_ANSWER | COMPILATION_ERROR | RUNTIME_ERROR | TIME_LIMIT_EXCEEDED | MEMORY_LIMIT_EXCEEDED | OUTPUT_LIMIT_EXCEEDED | SYSTEM_ERROR`

## Key Files

- `website/docs/getting-started/` — Setup and development guide
- `website/docs/concepts/architecture/` — System architecture and components
- `website/docs/reference/api/` — API contract reference
- `website/docs/reference/database/` — Database model documentation (schema planned for Phase 1)
- `website/docs/reference/judge-runtime/` — Sandbox execution design

## Coding Style

- TS/Vue: 2 spaces; Go (gofmt): tabs
- TS variables/functions: `camelCase`; Vue components and Go types: `PascalCase`; Go functions/packages: `snake_case`
- Keep admin DTOs and candidate DTOs separate; do not reuse one question shape for both roles

## Testing Guidelines

Add tests with new behavior:
- Go: unit tests next to modules (`*_test.go`), integration tests under `tests/`
- Frontend: co-locate tests as `*.spec.ts` or `*.test.ts`; `apps/admin/tests` exists as app-level test location
- Run at minimum `go build ./...` before submitting changes
- Add focused tests when touching scoring, snapshots, auth, or judge flow

## Design Constraints

- Candidate-facing DTOs must never expose `answer_json` or hidden test cases
- Published exams are frozen through snapshots; scoring reads from snapshots, never source
- Programming drafts live in `answers` table; formal judge attempts live in `submissions` + `judge_tasks`
- `worker` may access business infrastructure; `sandbox` must not access PostgreSQL, Redis, or credentials

## Planning & Documentation

- Internal technical planning: `.tech/01-foundation.md`, `.tech/02-auth-and-access.md`, etc.
- Public roadmap: `website/docs/planning/roadmap/README.md`
- Architecture docs: `website/docs/concepts/architecture/`
- API reference: `website/docs/reference/api/`
- Database schema: `website/docs/reference/database/`
- Judge runtime: `website/docs/reference/judge-runtime/`

## Authentication

**Logto** is used as the authentication provider:
- Auth domain: `https://auth.micromoving.net/`
- App ID: configured via `LOGTO_APP_ID` environment variable (see `.env.example`)
- Frontend uses `@logto/vue`
- Backend validates Logto-issued Bearer tokens using JWKS (`{LOGTO_ENDPOINT}/oidc/jwks`)
- Business roles are stored in Examora data, not in the frontend session
