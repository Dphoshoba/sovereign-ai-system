# Stage 3B Architecture Specification

**Status:** IMPLEMENTED (3B.1 interfaces, 3B.2 orchestrator, 3B.3 adapter framework, 3B.4 rollback engine)
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

## Provider Adapter Framework (Stage 3B.3)

### Components

| Component | File | Purpose |
|---|---|---|
| `ProviderAdapter` | `adapters/provider-adapter.ts` | Abstract base class with `providerId`, `providerVersion`, `supportedOperations`, lifecycle methods (`initialize`, `validate`, `dispose`), and `getCapabilityProfile()` |
| `AdapterRegistry` | `adapters/adapter-registry.ts` | Deterministic ordered registry with duplicate detection |
| `CapabilityNegotiator` | `adapters/capability-negotiator.ts` | Negotiates adapter capabilities against runtime capabilities; detects conflicts for destructive operations when mutations disabled |
| `ProviderDiscovery` | `adapters/provider-discovery.ts` | Discovers registered adapters with optional risk-level filtering; handles descriptor failures gracefully |
| `AdapterValidator` | `adapters/adapter-validator.ts` | Validates adapter completeness (providerId, version, methods, capability consistency) |
| `AdapterLifecycle` | `adapters/adapter-lifecycle.ts` | State machine: CREATED → INITIALIZED → READY → ACTIVE; recovery: ERROR → READY; terminal: DISPOSED |
| `AdapterFactory` | `adapters/adapter-factory.ts` | Factory registration, `create()`, `createAndRegister()` (create + validate + register + lifecycle transition in one call) |
| `AdapterDIContainer` | `adapters/adapter-di-container.ts` | Token-based DI with singleton/transient, nested resolution, circular dependency detection |

### Design Properties

- **Connector-neutral** — No adapter references Google Drive, Gmail, Calendar, or any real provider
- **No provider mutations** — `ProviderAdapter` has no `execute()`, `send()`, `mutate()`, or `callApi()` methods
- **Deterministic ordering** — Registry, discovery, lifecycle entries, and factory types are all sorted alphabetically by ID
- **Fail-safe** — Invalid adapters fail validation before registration; factory `createAndRegister()` rolls back on lifecycle transition failure

### Adapter Lifecycle

```
CREATED ──→ INITIALIZED ──→ READY ──→ ACTIVE ──→ DISPOSED
                │              │         │
                └──→ ERROR ←──┘─────────┘
                        │
                        └──→ READY (recovery)
                        └──→ DISPOSED
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

## Rollback Engine (Stage 3B.4)

### Components

| Component | File | Purpose |
|---|---|---|
| `types.ts` | `rollback-engine/types.ts` | `CompensationChain`, `CompensationStep`, `TransactionRecord`, `AuditEvent`, `RollbackScope`, `RollbackStatus` types |
| `compensation-plan.ts` | `rollback-engine/compensation-plan.ts` | `CompensationPlanGenerator` — generates compensation chains from rollback plans using strategy-based step ordering (`REVERSE_ORDER`, `FORWARD_ORDER`, `PARALLEL`), computes deterministic chain hashes, detects conflicts via step-parameter comparison |
| `rollback-planner.ts` | `rollback-engine/rollback-planner.ts` | `RollbackPlanner` — creates a full `RollbackPlan` from an `ExecutionRequest` + `ConnectorCandidate`, delegates step generation to an injected `RollbackExecutor`, computes planHash deterministically |
| `rollback-validator.ts` | `rollback-engine/rollback-validator.ts` | `RollbackValidator` — validates `RollbackPlan` completeness (required fields), `CompensationChain` integrity (hash, completion bounds, step diversity), and individual `CompensationStep` fields |
| `rollback-audit.ts` | `rollback-engine/rollback-audit.ts` | `RollbackAuditor` — creates structured `AuditEvent` records with versioned schema, references to plan/chain, and status snapshots |
| `rollback-coordinator.ts` | `rollback-engine/rollback-coordinator.ts` | `RollbackCoordinator` — full simulation: plan → validate → generate chain → audit → return result with all intermediate objects |

### Data Flow

```
plan(request, candidate)
  │
  ├─ RollbackPlanner.plan()
  │     ├─ Create RollbackPlan (rollbackId, planHash)
  │     ├─ Delegate step generation to RollbackExecutor
  │     └─ Return { plan, steps, metadata }
  │
  ├─ RollbackValidator.validatePlan()
  │     ├─ Check required fields (rollbackId, executionId, strategy, etc.)
  │     ├─ Warn on NONE scope or empty steps
  │     └─ Return { valid, errors, warnings }
  │
  ├─ CompensationPlanGenerator.generate()
  │     ├─ Order steps by strategy (REVERSE_ORDER / FORWARD_ORDER / PARALLEL)
  │     ├─ Compute chainHash from plan + steps
  │     ├─ Conflict detection via step-parameter comparison
  │     └─ Return CompensationChain { chainId, steps, chainHash, ... }
  │
  ├─ RollbackValidator.validateChain()
  │     ├─ Check chainHash integrity
  │     ├─ Check completedSteps ≤ totalSteps
  │     ├─ Check step diversity (unique stepIndexes)
  │     └─ Return { valid, errors, warnings }
  │
  ├─ RollbackAuditor.recordAuditEvent()
  │     └─ Create versioned AuditEvent { eventId, timestamp, schema, ... }
  │
  └─ Return CompensationPlan { chain, audit, validation }
```

### Key Properties

- **No provider mutations** — All rollback engine operations are simulation/planning only; no external API calls
- **Deterministic hashing** — `chainHash` and `planHash` are computed from serialized state (stable JSON), ensuring reproducibility
- **Strategy-based ordering** — `REVERSE_ORDER` (LIFO), `FORWARD_ORDER` (FIFO), `PARALLEL` (unordered)
- **Conflict detection** — `CompensationPlanGenerator` detects when two steps share the same parameters, emitting warnings
- **Validation-first** — `RollbackCoordinator` validates before generating compensation chains; invalid plans produce structured errors before any planning work
