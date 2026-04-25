---
title: API
---

# API Reference

Base path: `/api`. All timestamps use ISO 8601 UTC strings.

## Authentication

- Frontends authenticate with Logto
- API endpoints expect `Authorization: Bearer <token>`
- `GET /api/auth/me` resolves the current Examora user from the Logto token

## Route Groups

- `/api/auth/*`: identity-related introspection
- `/api/admin/*`: admin-only management routes
- `/api/client/*`: student exam-session routes

## Key Guarantees

- Candidate routes never expose answers or hidden test cases
- Published exam data is served from snapshots
- Submission and score transitions are backend-owned
