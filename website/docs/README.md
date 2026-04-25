---
title: Overview
sidebar_position: 1
---

# Examora

Online examination platform for multi-subject exams, programming exams, and desktop-secured exam scenarios.

Examora is a desktop-first online examination platform for multi-subject exams, programming exams, and secured exam scenarios.

## What You Should Read First

- [Getting Started](./getting-started/) for local setup and day-one development commands
- [Architecture](./concepts/architecture/) for service boundaries and exam snapshot rules
- [Authentication](./concepts/authentication/) for Logto integration and backend RBAC
- [Exam Lifecycle](./concepts/exam-lifecycle/) for the create-publish-take-submit loop
- [API Reference](./reference/api/) for admin/client routes and auth expectations
- [Database](./reference/database/) for the core table model
- [Judge Runtime](./reference/judge-runtime/) for programming submission and sandbox flow

## Quick Start

```bash
cp .env.example .env
corepack install
pnpm install
cargo check
docker compose -f deploy/docker-compose.yml up -d
```

Start services:

```bash
cargo run -p examora-api
cargo run -p examora-judge-worker
```

## Core Principles

- Candidate-facing APIs must never expose answers or hidden test cases
- Published exams must be delivered and scored from snapshots
- Programming drafts live in `answers`; formal runs live in `submissions`
- Logto handles authentication; Examora handles authorization
