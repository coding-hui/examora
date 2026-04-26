# Repository Guidelines

## Project Structure & Module Organization

This repository is a monorepo for the Examora MVP.

- `apps/admin`: admin console
- `apps/desktop`: Tauri + frontend desktop client
- `services/api`: Rust Axum API service
- `services/judge-worker`: async judge worker
- `services/sandbox-runner`: sandbox execution abstraction
- `packages/types`: shared TypeScript contracts
- `packages/client`: frontend API client
- `packages/utils`: shared utilities
- `website/`: public documentation website
- `.tech/`: internal module-based planning and technical notes
- `deploy/`: local infra bootstrap such as `docker-compose.yml`

Keep public-facing roadmap content in `website/docs/planning/roadmap/README.md`.
Keep detailed internal planning and technical decomposition in `.tech/`, organized by numbered module documents such as `01-foundation.md` and `02-auth-and-access.md`.
Authentication is based on Logto; keep auth design aligned with `.tech/02-auth-and-access.md`.
Prefer adding shared types in `packages/types` instead of duplicating DTOs in apps.

## Build, Test, and Development Commands

- `pnpm install`: install frontend workspace dependencies
- `make infra-up`: start PostgreSQL and Redis locally
- `make cargo-check`: validate the Rust workspace
- `make api`: run the API on port `8080`
- `make worker`: run the judge worker
- `cargo run -p examora-api`: direct API startup without `make`
- `pnpm --dir website build`: build the public docs site
- `pnpm --dir website start`: run the public docs site locally

Example bootstrap:

```bash
cp .env.example .env
pnpm install
make infra-up
make cargo-check
```

## Coding Style & Naming Conventions

- Use 2 spaces in TypeScript/Vue and 4 spaces in Rust where rustfmt applies.
- Follow `camelCase` for TS variables/functions, `PascalCase` for Vue components and Rust types, and `snake_case` for Rust functions/modules.
- Prefer ASCII in source files unless the file already uses Unicode.
- Keep admin DTOs and candidate DTOs separate; do not reuse one question shape for both roles.

## Testing Guidelines

Testing is not fully wired yet. Add tests with new behavior:

- Rust: unit tests next to modules, integration tests under `services/*/tests`
- Frontend: co-locate tests as `*.spec.ts` or `*.test.ts`; `apps/admin/tests` already exists as an app-level test location

Run at minimum `cargo check` before submitting changes. Add focused tests when touching scoring, snapshots, auth, or judge flow.

## Commit & Pull Request Guidelines

Recent history is minimal (`init`, `Initial commit`), so use short imperative commit messages such as `Add exam snapshot schema`.

For pull requests:

- describe the scope and motivation
- link the issue or task when available
- include screenshots for UI changes
- note schema, API, or config changes explicitly
- mention verification steps you ran

## Security & Configuration Tips

- Never expose `answer_json` or hidden test cases in candidate-facing APIs.
- Treat desktop anti-cheat logs as audit data, not proof of cheating.
- `sandbox-runner` must not access PostgreSQL, Redis, or business credentials.
