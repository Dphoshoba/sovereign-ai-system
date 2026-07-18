# Stage 3C.6 — Rollback Integration Design

**Date:** 2026-07-19
**Author:** GOV-2026-Stage3C-014
**Status:** APPROVED

---

## Objective

Integrate rollback as a first-class certified execution lifecycle by creating a concrete `RollbackExecutorImpl` and a dedicated `ROLLBACK_EXECUTION` pipeline state, replacing all direct `adapter.rollback()` calls with the new executor.

---

## Architecture

```
SandboxExecutionPipeline (orchestration)
        │
        ▼
RollbackExecutionPhase (state transition)
        │
        ▼
RollbackExecutorImpl (operational execution)
        │
        ├── RollbackPlanner → CompensationPlanGenerator (planning)
        ├── RollbackValidator (validation)
        ├── ConnectorExecutionAdapter.rollback() (execution)
        ├── VerificationProvider (verification)
        ├── TelemetryEmitter (telemetry)
        └── RollbackAudit (auditing)
```

### Responsibility Split

| Layer | Responsibilities |
|---|---|
| **Pipeline** | Decides rollback is required; enters ROLLBACK_EXECUTION state; invokes executor; handles success/failure transitions; updates pipeline state |
| **RollbackExecutionPhase** | Orchestrates the rollback lifecycle; does NOT contain rollback logic |
| **RollbackExecutorImpl** | Obtains plan, validates, executes via adapter, verifies provider state, emits telemetry, writes audit events, returns structured result |
| **Adapter** | Provider-specific rollback primitives only (G-010 Adapter Purity) |
| **Rollback Engine** | Planning, validation, audit, simulation (unchanged from Stage 3B.4) |

---

## Pipeline State Change

Add `ROLLBACK_EXECUTION` to the execution lifecycle:

```
ISOLATION_CHECK → CREDENTIAL_CHECK → APPROVAL_GATE → IDEMPOTENCY
    → ROLLBACK_PLANNING → AUDIT_PRE → EXECUTION → VERIFICATION
    → RECONCILIATION → ROLLBACK_EXECUTION → AUDIT_POST → COMPLETED
```

- ROLLBACK_EXECUTION is entered only when required.
- Successful executions bypass it (AUDIT_POST follows RECONCILIATION directly).
- Failed executions transition into it.

---

## Components to Create

### 1. `RollbackExecutionPhase` (`lib/platform/execution/adapters/sandbox/rollback-execution-phase.ts`)

A phase handler that:
- Receives the execution context (request, candidate, error, rollback plan)
- Invokes `RollbackExecutorImpl.execute()`
- Handles success → pipeline CONTINUE / failure → pipeline FAILURE transitions
- Records lifecycle events on the pipeline report

### 2. `RollbackExecutorImpl` (`lib/platform/execution/rollback-executor-impl.ts`)

A concrete implementation of the `RollbackExecutor` interface:

```typescript
class RollbackExecutorImpl implements RollbackExecutor {
  constructor(config: RollbackExecutorConfig)

  plan(request, candidate): Promise<RollbackPlan>
  execute(request, candidate, plan): Promise<RollbackResult>
}
```

**`execute()` lifecycle:**
1. Validate the plan (via `RollbackValidator`)
2. For each step, call `adapter.rollback()` with appropriate parameters
3. Verify provider state after each step (via `VerificationProvider`)
4. Apply backoff/retry on transient failures (via `RetryPolicy`)
5. Emit telemetry events (via `TelemetryEmitter`)
6. Record audit events (via `RollbackAudit`)
7. On partial failure, mark remaining steps as FAILED and return partial result

### 3. `RollbackResult` (`lib/platform/execution/rollback-contract.ts` extension)

```typescript
interface RollbackResult {
  rollbackId: string;
  executionId: string;
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  stepsCompleted: number;
  stepsTotal: number;
  completedAt: string;
  failureReason?: string;
  stepResults: RollbackStepResult[];
}

interface RollbackStepResult {
  stepIndex: number;
  status: 'COMPLETED' | 'FAILED' | 'SKIPPED';
  error?: string;
  telemetrySpanId?: string;
}
```

---

## Pipeline Integration

In `SandboxExecutionPipeline`, replace all `attemptRollback()` / `adapter.rollback()` direct calls with:

```
On execution failure → transition to ROLLBACK_EXECUTION phase
On verification failure → transition to ROLLBACK_EXECUTION phase
RollbackExecutionPhase → RollbackExecutorImpl → result → state update
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| Plan validation fails | Do not execute; mark ROLLBACK_FAILED; transition to AUDIT_POST |
| Step execution fails (transient) | Retry with backoff (up to configurable max retries) |
| Step execution fails (permanent) | Mark step FAILED; continue to next step if possible; return PARTIAL |
| Verification fails after step | Log warning; continue (best-effort rollback) |
| All steps fail | Return FAILED status |
| Executor throws unexpectedly | Catch; log critical; return FAILED; transition to AUDIT_POST |

---

## Testing Strategy

| Test Suite | Scope | Est. Tests |
|---|---|---|
| `RollbackExecutorImpl` unit tests | Planning, execution, step lifecycle, partial/full failure | 18 |
| `RollbackExecutionPhase` unit tests | Phase transitions, pipeline integration | 8 |
| Sandbox pipeline integration tests | Full rollback lifecycle (plan → execute → verify → audit) | 6 |
| Rollback idempotency tests | Re-executing the same rollback plan | 4 |
| **Total new tests** | | **36** |

---

## G-024 Rollback Determinism

Add governance policy requiring:
- Every rollback executes through the certified `RollbackExecutor` lifecycle
- Direct provider rollback invocation from orchestration pipelines is prohibited
- Rollback execution shall be deterministic, auditable, verifiable, and idempotent

---

## Files to Create

| File | Purpose |
|---|---|
| `lib/platform/execution/rollback-executor-impl.ts` | Concrete `RollbackExecutorImpl` |
| `lib/platform/execution/adapters/sandbox/rollback-execution-phase.ts` | Rollback phase handler |
| `tests/platform/rollback-executor-impl.test.ts` | Executor unit tests |
| `tests/platform/rollback-execution-phase.test.ts` | Phase unit tests |

## Files to Modify

| File | Change |
|---|---|
| `lib/platform/execution/rollback-contract.ts` | Add `RollbackResult`, `RollbackStepResult` types |
| `lib/platform/execution/adapters/sandbox/sandbox-execution-pipeline.ts` | Add ROLLBACK_EXECUTION state; replace direct `adapter.rollback()` calls |
| `ENGINEERING_OPERATING_SYSTEM.md` | Update Part 4 (current state), add G-024, update pipeline diagram |
| `IMPLEMENTATION_GUIDE.md` | Update rollback procedures section |
| `VERSION` | Stage 3C.6 planning → certified |
| `governance/architecture/STAGE3C_ARCHITECTURE.md` | Add 3C.6 row |
| `governance/certification/PROVIDER_CERTIFICATION_MATRIX.md` | Update sandbox row |

---

## Certification Criteria

1. `RollbackExecutorImpl` independently tested (18+ unit tests)
2. Pipeline invokes executor, never `adapter.rollback()` directly
3. Rollback remains idempotent
4. Rollback verification confirms provider state
5. Rollback telemetry is emitted
6. Rollback audit is complete
7. Failure during rollback is handled deterministically
8. Full regression suite remains green
9. G-024 added to EOS
