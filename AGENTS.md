# Repository Guidelines

## Project Overview

Examora is an online examination platform MVP. It supports administrators creating questions, composing papers, publishing exams, and candidates taking exams through a desktop client. The system includes automatic scoring for objective questions and asynchronous code judging for programming questions.

The repository is a monorepo containing:

- `cmd/api` — Go HTTP API server entrypoint
- `cmd/worker` — Async judge worker entrypoint
- `cmd/sandbox` — Code execution sandbox server entrypoint
- `cmd/dev-seed` — Development fixture seeder
- `internal/` — Core Go business logic and infrastructure
- `apps/admin` — Admin console (Ant Design Pro + Umi Max + React)
- `apps/desktop` — Tauri + Vue 3 desktop client for candidates
- `packages/types` — Shared TypeScript type definitions
- `packages/client` — Frontend API client
- `packages/utils` — Shared utilities
- `website/` — Public documentation website (Docusaurus)
- `.tech/` — Internal technical planning documents
- `deploy/` — Docker Compose and Dockerfiles
- `migrations/` — PostgreSQL schema migrations

## Technology Stack

### Backend

- **Go 1.25** with module path `github.com/coding-hui/examora`
- **Gin** — HTTP web framework
- **GORM** — ORM supporting PostgreSQL (production) and SQLite (local dev)
- **Redis** — Caching and job queue broker
- **Asynq** — Async task queue for judge jobs
- **Casbin** — RBAC authorization
- **JWT** — Local token authentication
- **Logto** — Optional SSO/OIDC authentication

### Frontend

- **Admin**: React 19, Umi Max 4, Ant Design Pro, TypeScript, Tailwind CSS, Biome
- **Desktop**: Vue 3, Vite, TypeScript, Tauri v2
- **Website**: Docusaurus 3, React

### Infrastructure

- PostgreSQL 16 (production)
- Redis 7
- Docker & Docker Compose for local deployment

## Project Structure & Module Organization

```
cmd/
  api/          # API server main.go
  worker/       # Judge worker main.go
  sandbox/      # Sandbox server main.go
  dev-seed/     # Development seeder main.go

internal/
  api/          # HTTP route handlers and DTOs
  auth/         # Authentication, JWT, Casbin, Logto, user store
  exam/         # Exam domain: sessions, snapshots, submissions, scoring
  judge/        # Judge domain: task queue, sandbox runner, worker
  library/      # Question bank and paper management
  server/       # Container (DI), API/Worker/Sandbox server constructors
  transport/    # HTTP middleware, response helpers, validators
  infra/
    config/     # Environment-based configuration
    database/   # GORM setup, AutoMigrate, models
    event/      # Event abstractions
    logger/     # Structured logging
    redis/      # Redis client
    transaction/# DB transaction manager

apps/
  admin/        # Admin console (Ant Design Pro)
  desktop/      # Tauri desktop app (Vue 3)

packages/
  types/        # Shared TS types (admin vs candidate DTOs)
  client/       # TS API client wrapper
  utils/        # Shared TS utilities

website/        # Docusaurus documentation
design-system/  # UI/UX design notes
```

### Key Conventions

- Keep admin DTOs and candidate DTOs **separate**; do not reuse one question shape for both roles.
- Candidate-facing APIs must **never** expose `answer`, hidden test cases, or internal scoring data.
- Source questions/papers live in `library`; published exams are **frozen into snapshots** (`exam_snapshots`, `question_snapshots`).
- Prefer adding shared types in `packages/types` instead of duplicating DTOs in apps.

## Build, Test, and Development Commands

### Prerequisites

```bash
cp .env.example .env
pnpm install
```

### Backend

```bash
# Start PostgreSQL and Redis locally
make infra-up

# Run the API server (port 8080)
make api

# Run the judge worker
make worker

# Run the sandbox server (port 8081)
make sandbox

# Run all Go tests
make go-check
# or directly:
go test ./...

# Format, lint, and test
make check        # runs fmt + lint + test
```

### Frontend

```bash
# Admin console
cd apps/admin
pnpm dev          # dev server (port 5173)
pnpm build        # production build
pnpm test         # jest tests
pnpm lint         # biome lint + tsc

# Desktop app
cd apps/desktop
pnpm dev          # dev server (port 5174)
pnpm build        # production build
pnpm typecheck    # vue-tsc --noEmit

# Shared packages
# Built as part of workspace dependencies; no separate build needed

# Documentation website
cd website
pnpm start        # local dev server
pnpm build        # static build
```

### Docker Compose

```bash
# Start all services (postgres, redis, api, worker, sandbox)
docker compose -f deploy/docker-compose.yml up -d

# Stop
docker compose -f deploy/docker-compose.yml down
```

## Coding Style & Naming Conventions

- **Go**: 4 spaces (where `gofmt` applies); `PascalCase` for exported types, `snake_case` for functions/modules.
- **TypeScript/Vue**: 2 spaces; `camelCase` for variables/functions, `PascalCase` for Vue components.
- Prefer ASCII in source files unless the file already uses Unicode.
- All Go imports should group stdlib, third-party, then local project imports. `golangci-lint` enforces this.

## API Response Format

All API responses use a unified envelope:

```json
{
  "code": 0,
  "message": "success",
  "data": { }
}
```

Error responses:

```json
{
  "code": 40001,
  "message": "invalid request",
  "data": null
}
```

## Testing Guidelines

### Go

- Unit tests are co-located next to modules (`*_test.go`).
- Run at minimum `go test ./...` before submitting changes.
- Add focused tests when touching scoring, snapshots, auth, or judge flow.
- Existing test files:
  - `internal/api/library_test.go`
  - `internal/exam/snapshot_service_test.go`
  - `internal/infra/config/config_test.go`
  - `internal/judge/task_test.go`
  - `internal/library/question_test.go`

### Frontend

- Co-locate tests as `*.spec.ts` or `*.test.ts`.
- `apps/admin/tests` exists as an app-level test location.
- Jest is used for the admin app.

## Authentication & Authorization

The system supports two authentication modes:

1. **Local JWT**: Username/password with bcrypt hashing. Default admin seeded on startup (`admin` / `examora-admin-2024` in development).
2. **Logto OIDC**: Optional SSO via Logto. Configure via `LOGTO_ENDPOINT`, `LOGTO_APP_ID`, `LOGTO_API_AUDIENCE`.

Authorization uses **Casbin** with roles:
- `admin` — full access to admin resources
- `client` — candidate-facing exam access

Middleware:
- `Authenticator` — validates Bearer JWT
- `RequireAdmin` — ensures `admin_dashboard:write` permission
- `RequireClient` — ensures `client:access` permission

Token blacklisting is implemented via Redis to support logout.

## Security Considerations

- **Never expose `answer_json` or hidden test cases in candidate-facing APIs.**
- **Treat desktop anti-cheat logs as audit data, not proof of cheating.**
- **Sandbox must not access PostgreSQL, Redis, or business credentials.** The sandbox server is isolated and only executes submitted code.
- JWT secret must be changed in production (`JWT_SECRET` env var).
- Token cookies are set `HttpOnly`, `Secure` (in HTTPS), and `SameSite`.

## Database

### Supported Databases

- **PostgreSQL** — production and Docker environments. Use `migrations/001_init.sql` and `migrations/002_snapshot_tables.sql` for fresh initialization.
- **SQLite** — local development only. GORM `AutoMigrate` creates tables automatically. Migration SQL files are PostgreSQL-only.

### Key Models

- `users` — local auth identities
- `casbin_rule` — RBAC policy storage
- `questions` / `test_cases` — question bank
- `papers` / `paper_questions` — exam papers
- `exams` — exam definitions
- `submissions` — candidate answers
- `judge_tasks` — async judge queue tasks
- `client_events` — desktop audit events
- `exam_snapshots` / `question_snapshots` / `exam_sessions` — published exam frozen state

## Environment Configuration

Key environment variables (see `.env.example`):

| Variable | Description |
|----------|-------------|
| `APP_ENV` | `development` or `production` |
| `APP_HOST` / `APP_PORT` | API bind address (default `0.0.0.0:8080`) |
| `DATABASE_DSN` | PostgreSQL DSN or SQLite path (e.g., `./examora.db`) |
| `REDIS_ADDR` / `REDIS_PASSWORD` / `REDIS_DB` | Redis connection |
| `JWT_SECRET` | JWT signing secret |
| `SANDBOX_ADDR` | Sandbox service URL (default `http://localhost:8081`) |
| `LOGTO_ENDPOINT` / `LOGTO_APP_ID` / `LOGTO_API_AUDIENCE` | Logto SSO config |

## Deployment

Docker images are built from:

- `deploy/Dockerfile.api` — API server
- `deploy/Dockerfile.worker` — Judge worker
- `deploy/Dockerfile.sandbox` — Sandbox runner

All use multi-stage builds based on `golang:1.24-alpine` and run on `alpine:3.21`.

## Commit & Pull Request Guidelines

Recent history is minimal, so use short imperative commit messages such as `Add exam snapshot schema`.

For pull requests:

- Describe the scope and motivation
- Link the issue or task when available
- Include screenshots for UI changes
- Note schema, API, or config changes explicitly
- Mention verification steps you ran

## Internal Planning

Keep public-facing roadmap content in `website/docs/planning/roadmap/README.md`.
Keep detailed internal planning and technical decomposition in `.tech/`, organized by numbered module documents.
Authentication design is aligned with `.tech/02-auth-and-access.md`.
