# Stage 3C Approval and Policy Model — Google Calendar

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification

## Overview

This document defines the approval requirements for each Google Calendar operation, building on the Stage 3B `ApprovalGate` interface and `ApprovalLevel` types. Approval decisions are evaluated before any provider mutation reaches the execution phase.

## Approval Levels (from Stage 3B.1)

| Level | Definition | Examples |
|---|---|---|
| `NONE` | No approval required | Read-only operations |
| `STANDARD` | Single approval from delegated authority | Create non-recurring event |
| `HEIGHTENED` | Approval from senior operator | Update shared calendar, modify event series |
| `CRITICAL` | Governance Board approval required | Delete events, modify calendar ACLs |

## Operation Approval Matrix

| Operation | Risk Level | Required Approval Level | Rationale |
|---|---|---|---|
| `events.list` | READ | NONE | Read-only; no provider state change |
| `events.get` | READ | NONE | Read-only; no provider state change |
| `events.insert` | MODIFY | STANDARD | Creates data but can be rolled back |
| `events.update` | MODIFY | STANDARD | Modifies existing data; snapshot pre-mutation |
| `events.patch` | MODIFY | STANDARD | Partial update; snapshot pre-mutation |
| `events.delete` | DESTRUCTIVE | HEIGHTENED | Destructive; requires senior operator approval |
| `events.instances` | READ | NONE | Read-only |
| `events.watch` | MODIFY | STANDARD | Creates push channel; reversible |
| `events.move` | DESTRUCTIVE | HEIGHTENED | Moves events between calendars |

## Approval Evaluation Flow

```
Pre-execution check (Stage 3B ApprovalGate):
  1. Read operation capability profile (requiredApprovalLevel)
  2. Create ApprovalRequest { operation, riskLevel, requiredLevel, context }
  3. Submit to ApprovalGate.evaluate()
  4. Evaluate verdict:
       ├─ APPROVED → continue to execution
       ├─ DENIED  → S3B_ROLLBACK (no provider state changed; rollback is cleanup only)
       └─ ERROR   → S3B_ROLLBACK
```

## Policy Rules

### Rule 1: Minimum Approval Level

The effective approval level for an execution is the maximum of:
- The operation's `requiredApprovalLevel` from the capability profile
- Any policy override from the Governance Board

```
effectiveLevel = max(operation.requiredApprovalLevel, policyOverride)
```

### Rule 2: Approval Caching

Within a single execution scope, an approval verdict is cached and reused for all operations sharing the same plan hash. A new execution (different plan hash) requires a fresh approval.

### Rule 3: Approval Expiry

An approval verdict expires after 24 hours. Expired approvals require re-evaluation before execution proceeds.

### Rule 4: Concurrent Operations

If multiple operations are planned in a single execution, the approval level is the maximum across all operations. A single approval covers the entire execution.

### Rule 5: Dry-Run Exemption

Dry-run and sandbox executions are exempt from approval requirements. They are logged and audited but not subject to approval gates. This allows testing without governance overhead.

## Policy Enforcement Points

| Enforcement Point | What Is Checked | What Happens on Violation |
|---|---|---|
| Pre-execution (ApprovalGate) | Required approval level met | Execution blocked; S3B_ROLLBACK |
| Pre-mutation (Adapter) | Idempotency key present | Mutation rejected; error logged |
| Post-mutation (Verification) | Expected vs actual state | S3B_ROLLBACK triggered |
| Audit (AuditRecorder) | Approval verdict recorded | Audit marked incomplete |

## Integration with Stage 3B Orchestrator

The existing `ExecutionOrchestrator.runApprovalPhase()` implementation already:

1. Checks if an `ApprovalGate` is configured
2. Creates an `ApprovalRequest` with the operation's risk level and required approval level
3. Evaluates the gate and routes to S3B_ROLLBACK on denial

Stage 3C extends this by:

1. Reading the actual operation's `requiredApprovalLevel` from the connector's capability profile (vs the hardcoded `'STANDARD'` in the current stub)
2. Passing the full operation parameters in the approval context
3. Supporting policy overrides from Governance Board decisions

## Approval Audit Events

| Event | Trigger |
|---|---|
| `APPROVAL_REQUESTED` | Approval request submitted to gate |
| `APPROVAL_GRANTED` | Gate returned APPROVED |
| `APPROVAL_DENIED` | Gate returned DENIED |
| `APPROVAL_EXPIRED` | Previously cached approval expired |
| `APPROVAL_BYPASSED` | Dry-run or sandbox mode; no approval needed |

## Rejected Approaches

| Approach | Reason |
|---|---|
| Single approval level for all operations | Read-only operations would incur unnecessary overhead |
| Approval required for dry-run | Defeats testing purposes |
| No expiry on approvals | Stale approvals could authorize operations against changed state |
| Manual approval for every operation | Impractical for batch operations; STANDARD delegated authority is sufficient for MODIFY |
