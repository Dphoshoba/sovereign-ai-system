# Stage 3C Certification Plan

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification
**Governance:** GOV-2026-Stage3C-001

## Certification Gates

### Gate 1: Architecture Approval (Stage 3C.0)

| Criterion | Evidence Required |
|---|---|
| Architecture documents approved | All 10 architecture documents exist and are reviewed |
| Provider selection ADR approved | ADR-STAGE3C-FIRST-PROVIDER.md ratified |
| Risk register reviewed | STAGE3C_RISK_REGISTER.md with pre/post-mitigation scores |
| Governance decision recorded | GOV-2026-Stage3C-001 published |

### Gate 2: Credential Framework (Stage 3C.1)

| Criterion | Evidence Required |
|---|---|
| CredentialManager implementation complete | All interface methods implemented |
| Encryption/decryption verified | Known-plaintext test passes with recorded output |
| Redaction verified | No credential material in logs, audits, or errors (tested) |
| Token refresh works (sandbox) | Refresh flow tested with mock provider |
| Build passes | TypeScript clean |
| Unit tests pass | ≥25 credential tests, all passing |

### Gate 3: Google Calendar Adapter (Stage 3C.2)

| Criterion | Evidence Required |
|---|---|
| Calendar adapter implements ConnectorExecutionAdapter | All 4 methods (execute, verify, rollback, audit) implemented |
| Request construction matches Google spec | Verified against documented API: URL, method, headers, body |
| Response parsing handles documented schema | All documented response fields parsed correctly |
| Error mapping covers documented error codes | Every Google Calendar error code has a classification |
| Build passes | TypeScript clean |
| Unit tests pass | ≥15 Calendar adapter tests, all passing |

### Gate 4: Live Execution Wiring (Stage 3C.3)

| Criterion | Evidence Required |
|---|---|
| Orchestrator wired to real Calendar adapter | `ExecutionOrchestrator` calls real adapter methods |
| Dry-run mode functional | Request validated, no mutation sent |
| Sandbox mode functional | Request sent to test tenant, response parsed (with test credentials) |
| Build passes | TypeScript clean |
| Integration tests pass | ≥20 orchestrator-calendar integration tests |

### Gate 5: Idempotency and Replay (Stage 3C.4)

| Criterion | Evidence Required |
|---|---|
| IdempotencyStore implementation complete | Put/get/isReplay/complete/fail/cleanup all implemented |
| Replay detection verified | Same key → cached result returned; different key → new execution |
| TTL expiry works | Entries expire after configured TTL |
| Idempotency audit events recorded | All 5 idempotency event types verified |
| Build passes | TypeScript clean |
| Unit tests pass | ≥15 idempotency tests, all passing |

### Gate 6: Error Classification and Retry (Stage 3C.5)

| Criterion | Evidence Required |
|---|---|
| ErrorClassifier implementation complete | All HTTP codes and Google error codes classified |
| Retry logic functional | Exponential backoff, max retries, jitter verified |
| Ambiguous reconciliation flow implemented | Read-back, compare, resolve/escalate |
| Build passes | TypeScript clean |
| Unit tests pass | ≥20 error classification tests, all passing |
| Integration tests pass | ≥10 idempotency flow tests, all passing |

### Gate 7: Rollback Integration (Stage 3C.6)

| Criterion | Evidence Required |
|---|---|
| Calendar RollbackExecutor implemented | `plan()` returns valid RollbackPlan for each Calendar operation |
| Compensation chain execution works | Each operation's compensation strategy verified |
| Pre-mutation snapshotting works | GET-before-mutate for update/delete operations |
| Partial rollback handled | Step failure does not abort remaining compensations |
| Rollback audit events recorded | All rollback event types verified |
| Build passes | TypeScript clean |
| Integration tests pass | ≥15 rollback-calendar tests, all passing |
| Provider contract tests pass | ≥28 contract tests, all passing |

### Gate 8: Full Certification (Stage 3C.7)

| Criterion | Evidence Required |
|---|---|
| All Stage 3C tests pass | ~148 tests, all passing |
| All Stage 3A/3B regression tests pass | 318 tests, all passing |
| TypeScript clean | No errors, no warnings |
| Build succeeds | Production build completes |
| Determinism verified | Same inputs → same outputs (tested with seed) |
| No provider mutations in certified runtime | Verified by code review |
| No credentials in codebase | Verified by grep |
| No network access in unit tests | Verified by test isolation |
| Security review complete | Trust boundary, credential model, redation verified |
| Governance Board decision recorded | GOV-2026-Stage3C-002 (certification) |

## Certification Test Matrix

| Test Suite | Gate 2 | Gate 3 | Gate 4 | Gate 5 | Gate 6 | Gate 7 | Gate 8 |
|---|---|---|---|---|---|---|---|
| CredentialManager (25) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| CalendarAdapter (15) | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Orchestrator+Calendar (20) | | | ✓ | ✓ | ✓ | ✓ | ✓ |
| Rollback+Calendar (15) | | | | | | ✓ | ✓ |
| IdempotencyStore (15) | | | | ✓ | ✓ | ✓ | ✓ |
| Idempotency flow (10) | | | | | ✓ | ✓ | ✓ |
| ErrorClassifier (20) | | | | | ✓ | ✓ | ✓ |
| Contract tests (28) | | | | | | ✓ | ✓ |
| 3A/3B regression (318) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Certification Artifacts

Each gate produces the following artifacts in `governance/certification/stage3c/`:

```
governance/certification/stage3c/
  artifacts/
    gate-2-credential-framework/
      tsc-output.txt
      test-output.txt
      redaction-verification.txt
    gate-3-calendar-adapter/
      tsc-output.txt
      test-output.txt
      contract-verification.txt
    gate-4-live-wiring/
      tsc-output.txt
      test-output.txt
    gate-5-idempotency/
      tsc-output.txt
      test-output.txt
    gate-6-error-retry/
      tsc-output.txt
      test-output.txt
    gate-7-rollback/
      tsc-output.txt
      test-output.txt
      contract-test-output.txt
    gate-8-full-certification/
      tsc-output.txt
      full-test-output.txt
      determinism-report.txt
      security-review.txt
      governance-decision.txt
```

Each sub-stage also produces a tag:

| Sub-Stage | Tag |
|---|---|
| 3C.0 (planning) | `gamma-drive-stage3c0-architecture` |
| 3C.1 (credential) | `gamma-drive-stage3c1-credential-framework` |
| 3C.2 (calendar adapter) | `gamma-drive-stage3c2-calendar-adapter` |
| 3C.3 (live wiring) | `gamma-drive-stage3c3-live-execution` |
| 3C.4 (idempotency) | `gamma-drive-stage3c4-idempotency` |
| 3C.5 (error/retry) | `gamma-drive-stage3c5-error-retry` |
| 3C.6 (rollback) | `gamma-drive-stage3c6-rollback-integration` |
| 3C.7 (certification) | `gamma-drive-stage3c7-certification` |

## Stage 3C Freeze Criteria

Stage 3C is FROZEN when all 8 gates are PASS, the Governance Board certifies, and the tag `gamma-drive-stage3c-full` is created with all certification artifacts archived.
