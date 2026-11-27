# Stage 3B Execution Model

**Status:** PLANNING
**Parent:** Stage 3A frozen at `05631b9`

## Overview

Stage 3B extends the Stage 3A non-executing pipeline with controlled execution, verification, and rollback. The Stage 3A sequence (`RECEIVED → ... → EXECUTION_BLOCKED`) remains unchanged. Stage 3B adds the path from `EXECUTION_BLOCKED` through to completion or failure.

## Execution Phases

### Phase 1: Pre-Execution (Stage 3A + Gate)

1. Stage 3A pipeline runs to `EXECUTION_BLOCKED`
2. Approval gate evaluates whether execution is authorized:
   - Check runtime capabilities (stage ≥ 3B)
   - Check connector capabilities (execute permitted)
   - Check approval requirements met
   - Check idempotency/lock state
3. If gate passes → transition to `EXECUTING`
4. If gate fails → remain in `EXECUTION_BLOCKED` with classification

### Phase 2: Execution

1. Connector `execute()` is called with the approved `ExecutionPlan`
2. Runtime records:
   - Pre-execution snapshot (state, input hash, timestamp)
   - Execution start timestamp
   - Execution result (success/failure)
   - Provider response (mutation ID, etag, revision)
3. On success → transition to `VERIFYING`
4. On failure → transition to `ROLLING_BACK`

### Phase 3: Verification

1. Connector `verify()` is called with the original plan and execution result
2. Runtime checks:
   - Expected state matches actual state
   - Mutation ID matches expected
   - No side-effect drift
3. On verified → transition to `AUDITING`
4. On verification failure → transition to `ROLLING_BACK`

### Phase 4: Audit

1. AuditRecordBuilder produces immutable audit record
2. Record includes:
   - Original context (from Stage 3A snapshots)
   - Execution result
   - Verification result
   - Rollback record (if any)
   - Mutation flags: true
3. Transition to `COMPLETED` or `FAILED`

### Phase 5: Rollback (Recovery Path)

1. Connector `rollback()` is called with the original plan and failure cause
2. Runtime records:
   - Pre-rollback snapshot
   - Rollback result
   - Recovery mutation flag
3. Transition to `AUDITING` then `FAILED`
4. If rollback also fails → `CRITICAL_FAILURE` state, operator alert

## Planning Before Execution

The `ExecutionPlan` is a deterministic structure produced before any provider interaction:

```typescript
interface ExecutionPlan {
  queueId: string;
  connectorId: string;
  operation: string;
  parameters: Record<string, unknown>;
  idempotencyToken: string;
  previewHash: string;
  governanceDecisionId: string;
  plannedAt: string;       // deterministic timestamp
  planHash: string;         // deterministic hash of all above
}
```

The plan hash is computed before execution and verified during audit to guarantee the executed operation matches the approved plan.

## Determinism Constraints

Stage 3B introduces controlled non-determinism in the execution phase (provider responses are inherently non-deterministic), but preserves determinism in:
- Pre-execution planning (Stage 3A pipeline)
- Audit records (fixed timestamps for non-execution events)
- Rollback planning
- Failure classification

New non-deterministic elements are explicitly tracked:
- Provider response time
- Provider error messages
- Network-level retry timing

These are recorded in the audit but excluded from deterministic hashes.
