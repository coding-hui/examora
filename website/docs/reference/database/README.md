---
title: Database
---

# Database

The data model separates editable source content from immutable delivery content.

## Main Table Groups

- Identity: `users`, `roles`, `permissions`, `user_roles`, `role_permissions`
- Source content: `subjects`, `questions`, `test_cases`, `papers`, `paper_questions`
- Delivery: `exams`, `paper_snapshots`, `paper_question_snapshots`, `exam_sessions`, `answers`, `scores`
- Judge: `submissions`, `judge_tasks`, `judge_case_results`
- Audit: `client_logs`

## Important Rules

- `config_json` stores display/runtime configuration
- `answer_json` stores grading truth
- Snapshot tables are the only source for delivery and scoring after publish
- `exam_sessions` supports `attempt_no` for future retake expansion

## Authoritative Schema

The bootstrap SQL schema will be created in Phase 1 (Database Schema and Migrations). The schema file will live at `docs/schema.sql` in the repository root.
