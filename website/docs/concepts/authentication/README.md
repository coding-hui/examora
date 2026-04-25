---
title: Authentication
---

# Authentication

Examora uses Logto for authentication and keeps authorization inside the backend.

## Current Model

- `@logto/vue` handles login state in `admin-web` and `exam-desktop`
- Frontends send Logto access tokens to the API
- `services/api` validates issuer, audience, and subject
- Examora maps external identities to local business users and roles

## Why This Split

- Authentication is delegated to a dedicated identity provider
- Role and resource access stay under Examora business control
- Admin and candidate access rules remain enforceable even if frontend state is manipulated

## Backend Responsibility

- Resolve a current business user from the Logto token
- Enforce RBAC for `/api/admin/*` and ownership rules for `/api/client/*`
- Never trust the frontend to decide roles
