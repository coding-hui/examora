---
title: Exam Lifecycle
---

# Exam Lifecycle

The MVP exam lifecycle is designed around one reliable loop: create, publish, take exam, submit, score.

![Exam session sequence flow](/img/exam-session-sequence.png)

## Flow

1. Admin creates subjects, questions, and a paper
2. Admin creates an exam from the paper
3. Admin publishes the exam
4. Publishing freezes the paper into snapshot tables
5. Student starts an exam session from the desktop client
6. Student answers questions with autosave
7. Student submits the session
8. Backend calculates scores and stores the result

## Important Rules

- Published exams must be delivered from snapshots only
- Session state is owned by the backend
- Candidate answers are drafts until submission
- Time limits and final submission status are backend-truth, not desktop-truth
