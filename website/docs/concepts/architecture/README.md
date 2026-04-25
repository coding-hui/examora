---
title: Architecture
---

# Architecture

Examora is built as a modular monolith with one user-facing backend, one asynchronous judge worker, and a constrained sandbox boundary.

![Examora system architecture](/img/system-architecture-overview.png)

## System Components

- `apps/admin-web`: Vue 3 admin console for question bank, papers, exams, and scores
- `apps/exam-desktop`: Tauri 2 desktop client for student exam sessions
- `services/api`: Rust Axum API for auth, RBAC, exam orchestration, scoring, and logs
- `services/judge-worker`: asynchronous consumer for programming submissions
- `services/sandbox-runner`: isolated compile/run abstraction used by the worker

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
