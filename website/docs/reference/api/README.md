---
title: API
---

# API Reference

Base path: `/api`. All timestamps use ISO 8601 UTC strings.

## Authentication

- Frontends authenticate with Logto
- API endpoints expect `Authorization: Bearer <token>`
- `GET /api/v1/auth/me` resolves the current Examora user from the Logto token

## Route Groups

All routes live under `/api/v1`. Permission is enforced by `RequireAdmin`/`RequireClient` middleware, not by URL structure.

- `/api/v1/*` (authenticated): unified entry point
- Admin resources: `/api/v1/questions`, `/api/v1/papers`, `/api/v1/exams`, etc. (RequireAdmin)
- Candidate resources: `/api/v1/exams/available`, `/api/v1/exams/:id/sessions/start`, `/api/v1/submissions`, etc. (RequireClient)

## Key Guarantees

- Candidate routes never expose answers or hidden test cases
- Published exam data is served from snapshots
- Submission and score transitions are backend-owned
