# Stage 3B Architecture Specification

**Status:** IMPLEMENTED (3B.1 interfaces, 3B.2 orchestrator)
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
Stage 3A Pipeline (unchanged — reaches EXECUTION_BLOCKED)
  RECEIVED → VALIDATING_PACKAGE → LOCK_VALIDATION → PREPARING → PREFLIGHT → READY → EXECUTION_BLOCKED or AUDITING → COMPLETED

Stage 3B Execution Orchestration (new — S3BPhase lifecycle)
  S3B_INITIAL → S3B_APPROVAL → S3B_EXECUTION → S3B_VERIFICATION → S3B_AUDIT → S3B_COMPLETED

Recovery Paths (from any phase)
  S3B_APPROVAL → S3B_ROLLBACK → (AUDIT) → S3B_FAILED
  S3B_EXECUTION → S3B_ROLLBACK → (AUDIT) → S3B_FAILED
  S3B_VERIFICATION → S3B_ROLLBACK → (AUDIT) → S3B_FAILED

RuntimeState transitions within Stage 3B (additive only, Stage 3A unchanged):
  EXECUTING → {VERIFYING, ROLLING_BACK, FAILED, CANCELLED}
  VERIFYING → {AUDITING, ROLLING_BACK, FAILED}
  ROLLING_BACK → {AUDITING, CRITICAL_FAILURE, FAILED}
  CRITICAL_FAILURE → terminal
```

## Runtime Phases

| Phase | Stage | Description |
|---|---|---|
| Planning | Stage 3A | Validate, classify, snapshot, and approve the execution package |
| Orchestration Entry | Stage 3B.2 | `ExecutionOrchestrator.orchestrate()` calls `ExecutionRuntime.run()`, checks eligibility via `isS3BEligible()` |
| Approval | Stage 3B.2 | `ApprovalGate.evaluate()` integration point (S3B_APPROVAL phase) |
| Execution | Stage 3B.2 | Dry-run execution planning via `createExecutionRequest()` (S3B_EXECUTION phase) |
| Verification | Stage 3B.2 | Verification integration point (S3B_VERIFICATION phase) |
| Audit | Stage 3B.2 | S3B audit event recording via `ExecutionLifecycle.recordEvent()` (S3B_AUDIT phase) |
| Rollback | Stage 3B.2 | `RollbackExecutor.plan()` integration point (S3B_ROLLBACK phase) |
| Audit (final) | Stage 3A | Immutable audit recording (reused — `AuditRecordBuilder`) |

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

## Orchestrator Flow (Stage 3B.2)

The `ExecutionOrchestrator` wraps the Stage 3A pipeline and extends it with Stage 3B phases:

```
orchestrate(context)
  │
  ├─ ExecutionRuntime.run(context)
  │     └─ isS3BEligible(result)?
  │           ├─ NO  → return S3B_PASS_THROUGH (non-S3A result unchanged)
  │           └─ YES → begin S3B lifecycle
  │
  ├─ Phase: S3B_APPROVAL
  │     ├─ ApprovalGate.evaluate(request)
  │     ├─ APPROVED → continue
  │     ├─ DENIED  → S3B_ROLLBACK → S3B_FAILED
  │     └─ ERROR   → S3B_ROLLBACK → S3B_FAILED
  │
  ├─ Phase: S3B_EXECUTION
  │     ├─ Validate request (idempotencyToken, planHash)
  │     ├─ PASS  → continue
  │     └─ FAIL  → S3B_ROLLBACK → S3B_FAILED
  │
  ├─ Phase: S3B_VERIFICATION
  │     ├─ PASS  → continue
  │     └─ FAIL  → S3B_ROLLBACK → S3B_FAILED
  │
  ├─ Phase: S3B_AUDIT
  │     ├─ Record S3B audit events
  │     ├─ PASS  → S3B_COMPLETED
  │     └─ FAIL  → S3B_FAILED
  │
  └─ Return S3BOrchestrationResult { outcome, runtimeResult, s3bPhases, s3bAuditEvents }
```

Key properties:
- **No provider mutations** — Stage 3B.2 is orchestration-only; execution is simulated
- **No Stage 3A modifications** — `RuntimeState` type additions (`ROLLING_BACK`, `CRITICAL_FAILURE`) are additive; transition matrix entries are additive
- **Deterministic phases** — `ExecutionLifecycle` enforces phase ordering via `S3B_PHASE_TRANSITIONS`
- **Connector-neutral** — `ApprovalGate` and `RollbackExecutor` are injected interfaces, not concrete implementations

## Failure Boundaries

| Layer | Failure | Handling |
|---|---|---|
| Pre-execution validation | Invalid plan | Block execution, report failure |
| Approval gate | Missing/inadequate approval | Block execution, escalate |
| Execution | Provider error | Capture error, trigger rollback |
| Verification | State mismatch | Trigger rollback |
| Rollback | Rollback failure | Log critical failure, alert operator |
| Audit | Audit failure | Execution still valid, audit marked incomplete |
