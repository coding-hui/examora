# Examora MVP v1 Judge And Sandbox Design

## Execution stages

### Stage 1: Mock judge

- `judge-worker` consumes tasks
- Returns deterministic mocked statuses
- Verifies queueing, polling, score writeback, and UI flow

### Stage 2: Real isolate integration

- Worker prepares source files and test files
- Worker calls `sandbox-runner`
- Runner executes compile and run steps inside isolated directories
- Worker parses results and persists them

## Trust boundaries

### `judge-worker`

- Allowed: PostgreSQL, Redis
- Not allowed: direct admin API calls during execution

### `sandbox-runner`

- Allowed: temporary working directory, compilers, runtime binaries
- Not allowed: PostgreSQL, Redis, outbound network, business credentials

## Minimum runtime limits

- no network
- non-root user
- per-run isolated directory
- CPU time limit
- wall-clock time limit
- memory limit
- process limit
- stdout/stderr size limit
- file write limit
- guaranteed cleanup after execution

## Result normalization

The MVP comparator normalizes:

- line endings
- trailing spaces on each line
- trailing blank suffix

It does not normalize:

- middle spaces
- numeric floating-point tolerance
- special judge logic

## Submission status progression

`PENDING -> JUDGING -> COMPILING -> RUNNING -> terminal state`

Terminal states:

- `ACCEPTED`
- `PARTIAL_ACCEPTED`
- `WRONG_ANSWER`
- `COMPILATION_ERROR`
- `RUNTIME_ERROR`
- `TIME_LIMIT_EXCEEDED`
- `MEMORY_LIMIT_EXCEEDED`
- `OUTPUT_LIMIT_EXCEEDED`
- `SYSTEM_ERROR`
