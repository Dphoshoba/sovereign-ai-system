# Stage 3B State Machine Specification

**Status:** PLANNING
**Parent:** Stage 3A frozen at `05631b9`

## Stage 3A States (Frozen — No Changes)

```
RECEIVED → VALIDATING_PACKAGE → LOCK_VALIDATION → PREPARING → PREFLIGHT → READY → EXECUTION_BLOCKED → AUDITING → COMPLETED
FAILED (from any state)
CANCELLED (future state)
```

## Stage 3B New States

| State | Description |
|---|---|
| `EXECUTING` | Provider mutation in progress |
| `VERIFYING` | Post-execution state verification |
| `ROLLING_BACK` | Recovery rollback in progress |
| `CRITICAL_FAILURE` | Unrecoverable failure (operator intervention required) |

## Stage 3A → 3B Transition Extension

Only the `READY` state transitions are modified to allow execution:

### READY (modified)
```
  Allowed:  ['EXECUTION_BLOCKED', 'EXECUTING', 'FAILED']
  Forbidden: ['COMPLETED', 'SENSITIVE_SINK']
```
No change from Stage 3A — `EXECUTING` already exists in the transition matrix as an allowed transition from `READY`. Stage 3A's pipeline deliberately never takes this path, instead going through `EXECUTION_BLOCKED`.

### EXECUTION_BLOCKED (modified — Stage 3B adds EXECUTING)
```
  Allowed:  ['AUDITING', 'FAILED', 'EXECUTING']
  Forbidden: ['COMPLETED']
```
The addition of `EXECUTING` to `EXECUTION_BLOCKED.allowed` is the critical change that enables Stage 3B. The approval gate sits between `EXECUTION_BLOCKED` and `EXECUTING`.

### EXECUTING (new)
```
  Allowed:  ['VERIFYING', 'ROLLING_BACK', 'FAILED', 'CANCELLED']
  Forbidden: ['COMPLETED', 'AUDITING']
```

### VERIFYING (new)
```
  Allowed:  ['AUDITING', 'ROLLING_BACK', 'FAILED']
  Forbidden: ['EXECUTING', 'COMPLETED']
```

### ROLLING_BACK (new)
```
  Allowed:  ['AUDITING', 'CRITICAL_FAILURE', 'FAILED']
  Forbidden: ['EXECUTING', 'VERIFYING', 'COMPLETED']
```

### CRITICAL_FAILURE (new)
```
  Allowed:  [] (terminal — operator intervention)
  Forbidden: ['COMPLETED', 'EXECUTING']
```

## Canonical Stage 3B Success Path

```
RECEIVED
→ VALIDATING_PACKAGE
→ LOCK_VALIDATION
→ PREPARING
→ PREFLIGHT
→ READY
→ EXECUTION_BLOCKED
→ (approval gate)
→ EXECUTING
→ VERIFYING
→ AUDITING
→ COMPLETED
```

## Stage 3B Failure Paths

### Execution Failure (with successful rollback)
```
... → EXECUTING → ROLLING_BACK → AUDITING → FAILED
```

### Execution Failure (with rollback failure)
```
... → EXECUTING → ROLLING_BACK → CRITICAL_FAILURE
```

### Verification Failure (with successful rollback)
```
... → EXECUTING → VERIFYING → ROLLING_BACK → AUDITING → FAILED
```

### Verification Failure (with rollback failure)
```
... → EXECUTING → VERIFYING → ROLLING_BACK → CRITICAL_FAILURE
```

### Approval Denied
```
... → EXECUTION_BLOCKED → AUDITING → COMPLETED
  (executionAttemped: false, providerMutationAttempted: false)
```

## Forbidden Transitions (Invariants)

| From | To | Reason |
|---|---|---|
| Any pre-execution state | `EXECUTING` | Must pass through `EXECUTION_BLOCKED` |
| `EXECUTING` | `COMPLETED` | Must verify first |
| `ROLLING_BACK` | `EXECUTING` | Cannot re-execute after failure |
| `CRITICAL_FAILURE` | Any | Terminal state — operator must intervene |
