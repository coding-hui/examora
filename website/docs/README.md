---
title: Overview
sidebar_position: 1
---

# Examora

Online examination platform for multi-subject exams, programming exams, and desktop-secured exam scenarios.

## What You Should Read First

- [Getting Started](./getting-started/) for local setup and day-one development commands
- [Architecture](./concepts/architecture/) for service boundaries and exam snapshot rules
- [Authentication](./concepts/authentication/) for Logto integration and backend RBAC
- [Exam Lifecycle](./concepts/exam-lifecycle/) for the create-publish-take-submit loop
- [Roadmap](./planning/roadmap/) for staged development priorities
- [API Reference](./reference/api/) for admin/client routes and auth expectations
- [Database](./reference/database/) for the core table model
- [Judge Runtime](./reference/judge-runtime/) for programming submission and sandbox flow

## Quick Start

```bash
cp .env.example .env
pnpm install
go mod download
docker compose -f deploy/docker-compose.yml up -d
```

Start services:

```bash
go run ./cmd/api
go run ./cmd/worker
```

## Core Principles

- Candidate-facing APIs must never expose answers or hidden test cases
- Published exams must be delivered and scored from snapshots
- Programming drafts live in `answers`; formal runs live in `submissions`
- Logto handles authentication; Examora handles authorization