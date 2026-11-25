# G-045 — Certified Autonomous Recovery

**Classification:** Design Constraint
**Scope:** Self-Healing & Recovery Coordination (7C)

## Rule

When the Autonomous Decision Engine selects `initiate_recovery`, the Self-Healing Coordinator shall:
1. Not modify, reimplement, or bypass the certified recovery services from Phases IV–VI.
2. Route recovery actions to certified services only: `RollbackExecutor`, `ProviderCircuitBreaker`, `ReconciliationEngine`, `CredentialRotationManager`, `SagaCompensator`, `WorkflowRecoveryManager`.
3. Execute strategies from least to most invasive: circuit breaker probe → credential rotation → retry → reconciliation → rollback.
4. Produce a deterministic `HealingReport` that records every action, its outcome, and its rationale.

## Rationale

Phase VII coordinates without reimplementing. The certified recovery services from Phases IV–VI are tested, audited, and immutable. 7C's role is orchestration — sequencing the right service at the right time, reporting the result, and escalating when the certified path cannot resolve the failure.

## Enforcement

- Verified via tests that confirm `heal()` produces the same `HealingReport` for identical `OperationalDecision` and provider/circuit state.
- Verified via tests that confirm the coordinator delegates to mocked certified services rather than implementing its own recovery logic.
- Verified via tests that confirm all `DecisionAction` values produce a valid, classified report.

## Relationship to G-043 and G-044

- G-043 certifies the operational state model that 7C reads for context.
- G-044 certifies the autonomous decisions that 7C executes.
- G-045 certifies that 7C routes those decisions to the correct certified recovery services without reimplementing them.
