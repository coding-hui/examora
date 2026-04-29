---
title: Roadmap
sidebar_position: 5
---

# Roadmap

This page tracks the public-facing feature roadmap for Examora.

## Status Legend

- `✓` Implemented
- `Planned` In roadmap, not finished yet

## Feature Roadmap

## Implementation Phases

| Phase | Module | Description | Status |
| --- | --- | --- | --- |
| M1 | Exam publishing with frozen snapshots | Publish exam, freeze paper to snapshot, candidate safe paper retrieval API | Planned |
| M2 | Admin management pages | Question bank, paper assembly, exam publishing UI | Planned |
| M3 | Desktop candidate exam flow | Login, take exam, auto-save, event reporting on desktop client | Planned |
| M4 | Scoring and judge observability | Objective auto-grading, programming judge results, minimal operations tooling | Planned |

## Feature Roadmap

| Module | Description | Status |
| --- | --- | --- |
| Admin console | Admin-side management for subjects, questions, papers, exams, and results. | Planned |
| Desktop exam client | Desktop application for candidate login, exam taking, and submission. | Planned |
| Authentication and access control | Identity handling and role-based access separation for admin and candidate flows. | Planned |
| Subject and question bank | Core content management for subjects, question types, and reusable question assets. | Planned |
| Paper and exam publishing | Paper assembly, exam creation, and publish flow with frozen delivery snapshots. | Planned |
| Candidate exam flow | Candidate entry, session lifecycle, answer saving, and final hand-in. | Planned |
| Objective scoring | Automatic grading for supported objective question types. | Planned |
| Programming judge | Draft saving, formal submission, async judging, and sandbox execution for programming questions. | Planned |
| Audit and proctoring logs | Client-side event capture and admin-side audit visibility for exam sessions. | Planned |
| Operations and engineering tooling | Migrations, seed data, logging, metrics, CI, and related engineering support. | Planned |

## Current Development Focus

**Phase M1** is the current focus: implementing frozen snapshots for exam publishing and candidate-safe paper retrieval APIs. This establishes the critical data boundary between editable source content and published exam delivery.

## Notes

- This public roadmap is intentionally brief
- Detailed technical planning is kept internally
