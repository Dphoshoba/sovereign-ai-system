# Stage 3B Architecture Specification

**Status:** PLANNING (No implementation)
**Parent:** Stage 3A FROZEN at `05631b9`
**Objective:** Transform non-executing Stage 3A runtime into a safe execution runtime for approved provider operations.

## Scope

Stage 3B extends the Stage 3A pipeline by adding execution capability while preserving:
- Deterministic planning before execution
- Immutable audit history
- Governance controls
- Rollback capability

## Architecture Principles

1. **Phase Isolation** — Stage 3A runtime modules are never modified. Stage 3B extends, never alters.
2. **Connector-Neutral Core** — No connector-specific logic leaks into `lib/platform/execution/`.
3. **Deterministic Planning** — Every execution must be planned and validated before any provider mutation.
4. **Explicit Approval** — Destructive operations require governance approval.
5. **Auditability** — Every mutation produces an immutable audit record.
6. **Reversibility** — Every mutation must support rollback where the provider allows it.

## Execution Lifecycle

```
Stage 3A Pipeline (unchanged)
  RECEIVED → VALIDATING_PACKAGE → LOCK_VALIDATION → PREPARING → PREFLIGHT → READY → EXECUTION_BLOCKED

Stage 3B Execution Extension (new)
  EXECUTION_BLOCKED → (approval gate) → EXECUTING → VERIFYING → AUDITING → COMPLETED

Recovery Paths
  EXECUTING → ROLLING_BACK → AUDITING → FAILED
  VERIFYING → ROLLING_BACK → AUDITING → FAILED
```

## Runtime Phases

| Phase | Owner | Description |
|---|---|---|
| Planning | Stage 3A | Validate, classify, snapshot, and approve the execution package |
| Approval | Stage 3B.5 | Governance approval gate before execution |
| Execution | Stage 3B.2 | Provider mutation via connector adapter |
| Verification | Stage 3B.2 | Post-execution state verification |
| Rollback | Stage 3B.4 | Recover from failed execution |
| Audit | Stage 3A | Immutable audit recording (reused) |

## Capability Model

Connectors declare capabilities that the runtime reads before execution:

```typescript
interface ConnectorExecutionCapabilities {
  // Methods
  prepare: boolean;
  execute: boolean;
  verify: boolean;
  rollback: boolean;

  // Execution characteristics
  supportsDryRun: boolean;
  supportsIdempotency: boolean;
  supportsRollback: boolean;

  // Risk classification
  riskLevel: 'READ' | 'MODIFY' | 'DESTRUCTIVE';

  // Approvals
  requiresApproval: boolean;
  approvalLevel: 'NONE' | 'STANDARD' | 'HEIGHTENED' | 'CRITICAL';
}
```

## Connector Interface

```typescript
interface ConnectorExecutionAdapter {
  execute(plan: ExecutionPlan): Promise<ExecutionResult>;
  verify(plan: ExecutionPlan, result: ExecutionResult): Promise<VerificationResult>;
  rollback(plan: ExecutionPlan, cause: Error): Promise<RollbackResult>;
  audit(plan: ExecutionPlan, result: ExecutionResult): Promise<AuditRecord>;
}
```

## Failure Boundaries

| Layer | Failure | Handling |
|---|---|---|
| Pre-execution validation | Invalid plan | Block execution, report failure |
| Approval gate | Missing/inadequate approval | Block execution, escalate |
| Execution | Provider error | Capture error, trigger rollback |
| Verification | State mismatch | Trigger rollback |
| Rollback | Rollback failure | Log critical failure, alert operator |
| Audit | Audit failure | Execution still valid, audit marked incomplete |
