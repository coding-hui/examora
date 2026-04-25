---
title: Judge Runtime
---

# Judge Runtime

The judge runtime is split between orchestration and isolated execution.

## Services

- `judge-worker`: queue consumer and result writer
- `sandbox-runner`: compile/run abstraction with no business credentials

## Execution Stages

- Stage 1: mock judge for end-to-end product flow
- Stage 2: real `isolate` integration for compile and run

## Runtime Constraints

- No outbound network
- Non-root execution
- Isolated working directories
- CPU, memory, process, output, and wall-clock limits
- Cleanup after every run
