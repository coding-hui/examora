---
title: Architecture
---

# Architecture

Examora is a monorepo with three layers: client apps, Go services, and shared packages.

![Examora system architecture](/img/system-architecture-overview.png)

## System Components

- `apps/admin`: React + Umi admin console for question bank, papers, exams, and scores
- `apps/desktop`: Tauri 2 desktop client for student exam sessions
- `cmd/api`: Go Gin API server for auth, RBAC, exam orchestration, and scoring
- `cmd/worker`: Asynq worker for programming submissions
- `cmd/sandbox`: Isolated compile/run sandbox

## Core Boundaries

- Source data and frozen exam snapshots are different models
- Admin DTOs and candidate DTOs must stay separate
- User code must never execute inside the API process
- Desktop events are audit signals, not trusted proof

## Delivery Model

- Admin creates source questions and papers
- Publishing an exam creates immutable snapshots
- Students fetch snapshot-based content only
- Scores are computed from snapshot data, not mutable source rows