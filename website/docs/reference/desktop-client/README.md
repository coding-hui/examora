---
title: Desktop Client
---

# Desktop Client

The desktop client is the student-facing runtime for secure exam participation.

## Responsibilities

- Log in with Logto
- Show available exams
- Start and resume exam sessions
- Autosave answers locally and remotely
- Submit objective and programming answers
- Collect audit-oriented anti-cheat events

## Local Capabilities

- Fullscreen mode
- Window focus tracking
- Network status tracking
- Local JSON cache for answers and queued logs
- Desktop-only shell integration through Tauri commands

## Trust Model

- The desktop client is not a trusted authority
- Final time, status, and score always come from the backend
- Anti-cheat signals are useful for review, not automatic punishment
