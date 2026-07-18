# Stage 3B Risk Register

**Status:** PLANNING
**Parent:** Stage 3A frozen at `05631b9`

## Risk Assessment Methodology

Each risk is assessed by:
- **Likelihood**: Improbable / Possible / Likely / Certain
- **Impact**: Low / Moderate / High / Critical
- **Mitigation**: Strategy to reduce likelihood or impact
- **Residual Risk**: Risk level after mitigation

## Identified Risks

### R-001: Provider API Inconsistency

| Field | Value |
|---|---|
| Description | Provider returns unexpected response or changes API behavior between planning and execution |
| Likelihood | Possible |
| Impact | High |
| Mitigation | Pre-execution verification via dry-run; post-execution state verification; rollback path |
| Residual | Moderate |

### R-002: Partial Execution Failure

| Field | Value |
|---|---|
| Description | Provider partially applies a mutation (e.g., creates file but fails to apply permissions) |
| Likelihood | Possible |
| Impact | High |
| Mitigation | Idempotent operations; verification step explicitly checks complete state; rollback undoes partial state |
| Residual | Moderate |

### R-003: Rollback Failure

| Field | Value |
|---|---|
| Description | Rollback operation fails, leaving system in inconsistent state |
| Likelihood | Possible |
| Impact | Critical |
| Mitigation | CRITICAL_FAILURE state triggers operator alert; audit trail preserves pre-execution state for manual recovery |
| Residual | High |

### R-004: Approval Bypass via Bug

| Field | Value |
|---|---|
| Description | Code defect allows execution without required approval |
| Likelihood | Improbable |
| Impact | Critical |
| Mitigation | Approval gate is a separate validation layer before execution; state machine enforces approval path; dedicated negative tests |
| Residual | Moderate |

### R-005: Idempotency Token Collision

| Field | Value |
|---|---|
| Description | Two operations share the same idempotency token, causing one to be incorrectly skipped or replayed |
| Likelihood | Improbable |
| Impact | Moderate |
| Mitigation | Token generation includes queue ID, connector ID, and operation hash; duplicate detection at queue level |
| Residual | Low |

### R-006: Connector Adapter Leaks Provider Specifics into Core

| Field | Value |
|---|---|
| Description | Connector-specific logic, types, or error handling leaks into `lib/platform/execution/` |
| Likelihood | Possible |
| Impact | Moderate |
| Mitigation | Strict interface boundary; connector-specific code only in `lib/connectors/<name>/`; code review gate |
| Residual | Low |

### R-007: State Machine Reachability Regression

| Field | Value |
|---|---|
| Description | A Stage 3B change accidentally creates a path from pre-execution state to EXECUTING that bypasses EXECUTION_BLOCKED |
| Likelihood | Improbable |
| Impact | Critical |
| Mitigation | Stage 3A frozen tests run on every milestone; dedicated reachability tests for every forbidden transition |
| Residual | Low |

### R-008: Provider Rate Limiting During Rollback

| Field | Value |
|---|---|
| Description | Provider rate limits prevent rollback from executing promptly |
| Likelihood | Possible |
| Impact | Moderate |
| Mitigation | Rollback operations use same retry strategy as execution; rate limit monitoring at connector level |
| Residual | Low |

### R-009: Non-Determinism Creep

| Field | Value |
|---|---|
| Description | Non-deterministic values (timestamps, random IDs) introduced into pre-execution or audit phases |
| Likelihood | Possible |
| Impact | Moderate |
| Mitigation | Determinism gate runs on every milestone; non-deterministic elements explicitly identified in execution model |
| Residual | Low |

### R-010: Stage 3A Accidental Modification

| Field | Value |
|---|---|
| Description | Stage 3B implementation inadvertently modifies a Stage 3A frozen file |
| Likelihood | Possible |
| Impact | Critical |
| Mitigation | Pre-commit hook checking SHA256 of frozen files; CI step verifying Stage 3A test suite passes unchanged |
| Residual | Moderate |

## Risk Summary

| ID | Risk | Likelihood | Impact | Residual |
|---|---|---|---|---|
| R-001 | Provider API inconsistency | Possible | High | Moderate |
| R-002 | Partial execution failure | Possible | High | Moderate |
| R-003 | Rollback failure | Possible | Critical | High |
| R-004 | Approval bypass | Improbable | Critical | Moderate |
| R-005 | Idempotency collision | Improbable | Moderate | Low |
| R-006 | Connector leak into core | Possible | Moderate | Low |
| R-007 | State machine regression | Improbable | Critical | Low |
| R-008 | Rate limiting on rollback | Possible | Moderate | Low |
| R-009 | Non-determinism creep | Possible | Moderate | Low |
| R-010 | Stage 3A modification | Possible | Critical | Moderate |
