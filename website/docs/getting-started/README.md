# Getting Started

## Prerequisites

- Rust stable toolchain
- Node.js 20+
- Corepack-enabled `pnpm@10.33.0`
- Docker / Docker Compose

## Setup

```bash
cp .env.example .env
corepack install
pnpm install
cargo check
docker compose -f deploy/docker-compose.yml up -d
```

## Running Services

```bash
# API server (port 8080)
cargo run -p examora-api

# Judge worker
cargo run -p examora-judge-worker

# Docs website
pnpm --dir website start
```

## Frontend Apps

```bash
pnpm dev:admin        # admin console on :5173
pnpm dev:desktop      # desktop client on :5174
```

## Common Tasks

```bash
make infra-up        # start Postgres + Redis
make infra-down      # stop infra
make cargo-check     # type-check Rust
pnpm -r typecheck    # type-check all TS packages
pnpm -r build        # build all packages
```

## Project Structure

```
examora/
├── apps/
│   ├── admin-web/          # Vue 3 admin console
│   └── exam-desktop/      # Tauri 2 + Vue 3 desktop client
├── services/
│   ├── api/                # Rust Axum API server
│   ├── judge-worker/       # Async judge consumer
│   └── sandbox-runner/     # Sandboxed execution library
├── packages/
│   ├── types/              # Role-split TypeScript types
│   ├── client/             # Frontend API client
│   └── utils/              # Shared utilities
├── deploy/                 # Docker Compose infra
└── website/                # Documentation site
```

## Authentication Direction

- Frontends use `@logto/vue` with Logto at `https://auth.micromoving.net/`
- API validates Logto access tokens via JWKS (`{LOGTO_ENDPOINT}/oidc/jwks`)
- Business roles stay in Examora data, not in the frontend session
