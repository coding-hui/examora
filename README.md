# Examora

Examora (`极考`) is an online examination platform for multi-subject exams, programming exams, and desktop-secured exam scenarios.

This repository now contains the MVP v1 monorepo foundation:

- `apps/admin-web`: Vue 3 administrator console
- `apps/exam-desktop`: Tauri 2 + Vue 3 desktop exam client
- `services/api`: Rust Axum API service
- `services/judge-worker`: Rust judge task worker
- `services/sandbox-runner`: sandbox execution abstraction
- `packages/shared-types`: shared TypeScript contracts split by admin/client boundaries
- `packages/api-client`: frontend API client placeholder
- `docs/` — MVP v1 technical specs
- `deploy/`: local infrastructure bootstrap

## MVP Scope

MVP v1 is intentionally narrow:

- Admin can manage subjects, questions, papers, and exams
- Student can log in from the desktop client, start an exam session, answer questions, and submit
- Objective questions can be scored automatically
- Programming questions support draft saving and formal submissions
- Judge flow is mocked first and upgraded to real `isolate` execution later
- Desktop anti-cheat support is audit-oriented, not enforcement-oriented

## Architecture

![Examora Architecture](docs/architecture.png)

The system follows a four-layer logical architecture:

| Layer | Components | Responsibility |
|-------|------------|----------------|
| **ClientSide** | examora-admin, examora-desktop | Admin console & desktop exam client |
| **ServiceLayer** | examora-api | Business logic, request orchestration |
| **JudgeLayer** | judge-worker, isolate/nsjail | Code execution & evaluation in sandbox |
| **DataLayer** | PostgreSQL, Redis/MQ, MinIO | Data persistence, caching, task queue, file storage |

**Workflow**: Client → API → (PostgreSQL/MinIO write) → MQ task → judge-worker → isolate/nsjail → result write → Client view

## Repository Layout

```text
examora/
├── apps/
│   ├── admin-web/
│   └── exam-desktop/
├── services/
│   ├── api/
│   ├── judge-worker/
│   └── sandbox-runner/
├── packages/
│   ├── api-client/
│   ├── shared-types/
│   └── utils/
├── deploy/
├── docs/
├── Cargo.toml
├── package.json
└── pnpm-workspace.yaml
```

## Getting Started

### Prerequisites

- Rust stable toolchain
- Node.js 20+
- Corepack-enabled `pnpm@10.33.0`
- Docker / Docker Compose

### Development bootstrap

```bash
cp .env.example .env
corepack install
pnpm install
cargo check
docker compose -f deploy/docker-compose.yml up -d
```

### Start services

```bash
cargo run -p examora-api
cargo run -p examora-judge-worker
```

Frontend apps are scaffolded and can be expanded with the usual Vite commands.

You can also use the root `Makefile` for common tasks:

```bash
make infra-up
make cargo-check
make api
```

## Key Design Constraints

- Candidate-facing DTOs must never expose answers or hidden test cases
- Published exams are frozen through snapshots and are scored from snapshots, not source questions
- Programming drafts live in `answers`; formal judge attempts live in `submissions`
- `judge-worker` may access business infrastructure; `sandbox-runner` must not

Read the docs in `docs/` before extending the implementation.
