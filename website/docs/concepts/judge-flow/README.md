---
title: Judge Flow
---

# Judge Flow

Programming problems follow an asynchronous judge pipeline.

## Flow

1. The desktop client saves draft code into `answers`
2. A formal code run creates a `submission`
3. The API creates a `judge_task`
4. `judge-worker` consumes the task
5. The worker executes mock logic first, then later real sandbox logic
6. Results are written back to `submissions` and per-case result tables
7. The final exam score reads the chosen `finalSubmissionId`

## Why Async

- The API remains responsive
- User code never runs inside the request path
- Retries and queue control become manageable
- Real sandboxing can be introduced later without changing the product flow
