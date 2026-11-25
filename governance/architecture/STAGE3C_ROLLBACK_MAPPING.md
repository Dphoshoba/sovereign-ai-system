# Stage 3C Rollback Mapping — Google Calendar

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification

## Overview

Every mutable operation must have a corresponding compensation strategy defined before execution. This document maps each Google Calendar operation to its rollback or compensation strategy, classified by risk level, and identifies which operations require approval before rollback execution.

## Operation-to-Compensation Map

| Calendar Operation | Risk Level | Compensation Operation | Compensation Strategy | Reversible | Notes |
|---|---|---|---|---|---|
| `events.list` | READ | None (idempotent) | N/A | N/A | Read-only; no compensation needed |
| `events.get` | READ | None (idempotent) | N/A | N/A | Read-only; no compensation needed |
| `events.insert` | MODIFY | `events.delete` | REVERSE_ORDER | Yes | Delete the created event using ID from mutation result |
| `events.update` | MODIFY | `events.update` (restore previous) | STATE_RESTORE | Yes | Restore previous event body from pre-mutation snapshot |
| `events.patch` | MODIFY | `events.update` (restore previous) | STATE_RESTORE | Yes | Same as update; store full snapshot before patch |
| `events.delete` | DESTRUCTIVE | `events.insert` (recreate) | COMPENSATING | Conditional | Recreate event from pre-deletion audit snapshot; may fail if concurrent edits occurred |
| `events.instances` | READ | None (idempotent) | N/A | N/A | Read-only |
| `events.watch` | MODIFY | `events.stop` (stop watching) | REVERSE_ORDER | Yes | Stop push notification channel |
| `events.move` | DESTRUCTIVE | `events.move` (move back) | STATE_RESTORE | Yes | Move calendar back to original; store original calendarId pre-mutation |

## Compensation Strategy Definitions

| Strategy | Definition | When Used |
|---|---|---|
| `REVERSE_ORDER` | Execute compensations in reverse of original execution order (LIFO) | Multi-step operations where later steps depend on earlier ones |
| `COMPENSATING` | Execute compensations in the same order as original execution (FIFO) | Independent operations; recreating a deleted event |
| `STATE_RESTORE` | Restore the exact provider state from a pre-mutation snapshot | Update/patch operations where the previous state is known |

## Compensation Readiness by Operation

### events.insert → events.delete (REVERSE_ORDER)

- **Parameters needed**: `eventId` from mutation result
- **Precondition**: Event must still exist
- **Failure mode**: Event was already deleted by another process — compensation is a no-op (already deleted)
- **Confidence**: HIGH — direct reverse operation

### events.update → events.update (STATE_RESTORE)

- **Parameters needed**: Full pre-update event body (must be snapshotted before mutation)
- **Precondition**: Event must still exist and etag must not have changed
- **Failure mode**: Concurrent edit changed the event — compensation may fail with 409 Conflict
- **Mitigation**: Re-fetch current event, merge previous fields, retry
- **Confidence**: MEDIUM — concurrent edit risk

### events.delete → events.insert (COMPENSATING)

- **Parameters needed**: Full pre-deletion event body (must be stored in audit before mutation)
- **Precondition**: No calendar quota exceeded, event ID is available
- **Failure mode**: Event recreated with different ID — compensation succeeded functionally but exact state differs
- **Mitigation**: Store full event body pre-deletion; recreate with same fields
- **Confidence**: MEDIUM — ID will differ from original

## Snapshot Requirements

| Operation | Pre-Mutation Snapshot | Stored In | Size |
|---|---|---|---|
| `events.insert` | None (no prior state) | N/A | N/A |
| `events.update` | Full event body (GET before UPDATE) | RollbackAuditEvent | ~1KB per event |
| `events.patch` | Full event body (GET before PATCH) | RollbackAuditEvent | ~1KB per event |
| `events.delete` | Full event body (GET before DELETE) | RollbackAuditEvent | ~1KB per event |

## Compensation Chain Integration

The Stage 3B.4 rollback engine (`CompensationPlanGenerator`) generates compensation chains from rollback plans. For Stage 3C:

1. Each Calendar operation maps to a `RollbackStepDescriptor` with:
   - `compensatingOperation`: The inverse Calendar API operation
   - `parameters`: The snapshot data needed for compensation
   - `reversible`: Whether compensation is guaranteed to succeed

2. The `RollbackExecutor` implementation for Calendar:
   - Receives the `RollbackPlan` from `RollbackPlanner`
   - Executes each compensation step via the Calendar adapter
   - Reports success/failure per step
   - On partial failure, continues with remaining steps (best-effort)

3. The `RollbackCoordinator` orchestrates the full compensation:
   - Validates the plan
   - Generates the compensation chain
   - Executes via the adapter
   - Records audit events
   - Returns the final rollback result

## Approval Requirements for Rollback

| Rollback Scenario | Approval Required | Approver |
|---|---|---|
| Automatic rollback (execution failure, no mutation sent) | No | N/A (no provider state changed) |
| Automatic rollback (ambiguous outcome) | No | N/A (mutations are idempotent-gated) |
| Manual rollback request | Yes | Governance Board |
| Rollback of DESTRUCTIVE operation | Yes | Governance Board (HEIGHTENED) |

## Rejected Approaches

| Approach | Reason |
|---|---|
| No rollback for DESTRUCTIVE operations | Violates Stage 3B principle of reversibility |
| Always use REVERSE_ORDER | STATE_RESTORE is more reliable for update operations |
| Compensate by creating a "cancelled" event copy | Deleted events cannot be recreated with same ID; COMPENSATING strategy with full recreation is cleaner |
