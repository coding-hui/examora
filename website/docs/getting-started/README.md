# Getting Started

## Prerequisites

- Go 1.22+
- Node.js 20+
- pnpm 9+
- Docker / Docker Compose (for production)

## Setup

```bash
cp .env.example .env
pnpm install
go mod download
```

## Running Services

```bash
# API server (port 8080)
go run ./cmd/api

# Judge worker
go run ./cmd/worker

# Sandbox runner
go run ./cmd/sandbox
```

## Frontend Apps

```bash
pnpm dev:admin        # admin console on :5173
pnpm dev:desktop      # desktop client on :5174
```

## Infrastructure

```bash
make infra-up         # start Postgres + Redis (Docker)
make infra-down       # stop infra
```

## Common Tasks

```bash
go build ./...         # build all Go packages
go test ./...          # run tests
make lint              # run golangci-lint
pnpm -r typecheck      # type-check all TS packages
pnpm -r build          # build all packages
```

## Project Structure

```
examora/
├── apps/
│   ├── admin/              # React + Umi admin console
│   └── desktop/            # Tauri 2 + React desktop client
├── cmd/
│   ├── api/                # Go Gin API server
│   ├── worker/             # Asynq judge worker
│   └── sandbox/           # Sandbox runner
├── internal/
│   ├── api/                # HTTP handlers
│   ├── auth/               # Authentication
│   ├── exam/               # Exam management
│   ├── judge/              # Judge orchestration
│   ├── library/            # Question bank
│   └── platform/           # Infrastructure
├── packages/
│   ├── types/              # Role-split TypeScript types
│   ├── client/             # Frontend API client
│   └── utils/              # Shared utilities
├── deploy/                 # Docker Compose infra
└── website/                # Docusaurus documentation
```

## Authentication

- Frontends use `@logto/vue` with Logto at `https://auth.micromoving.net/`
- API validates Logto access tokens via JWKS (`{LOGTO_ENDPOINT}/oidc/jwks`)
- Business roles stay in Examora data, not in the frontend session