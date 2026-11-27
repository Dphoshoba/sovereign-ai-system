# Stage 3C Test Strategy

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification

## Overview

Stage 3C testing must validate provider integration without making live API calls, without credentials, and without network access during unit and integration tests. This strategy defines four execution modes with increasing fidelity, and the corresponding test phases.

## Execution Modes

| Mode | Provider Contact | Credentials | Mutation | Purpose |
|---|---|---|---|---|
| **Read-Only** | No | No | No | Validate request construction, response parsing with fixture data |
| **Dry-Run** | No (validates locally) | No | No | Validate request against provider schema without sending |
| **Sandbox** | Yes (test tenant) | Test credentials | Yes | Validate real provider interaction in isolated environment |
| **Live-Isolated** | Yes (real tenant) | Real credentials | Yes | Validate production behavior with controlled test data |

### Test Coverage by Mode

| Test Layer | Read-Only | Dry-Run | Sandbox | Live-Isolated |
|---|---|---|---|---|
| Request construction | ✓ | ✓ | ✓ | ✓ |
| Response parsing | ✓ (fixtures) | ✓ (fixtures) | ✓ | ✓ |
| Error mapping | ✓ (fixture codes) | ✓ | ✓ | ✓ |
| Credential handling | Mock | Mock | Test credentials | Real credentials |
| Idempotency logic | Unit test | Unit test | ✓ | ✓ |
| Retry logic | Unit test | Unit test | ✓ | ✓ |
| Rate limiting | Unit test | Unit test | ✓ | ✓ |
| Rollback execution | Unit test | Unit test | ✓ | ✓ |
| Ambiguous reconciliation | Simulated | Simulated | ✓ | ✓ |

## Test Phases

### Phase 1: Unit Tests (Stage 3C.1 — 3C.2)

No provider interaction. All adapter, credential, and idempotency logic tested with mocks and fixtures.

| Test Area | Files | Target Count | Key Assertions |
|---|---|---|---|
| CredentialManager | `credential-manager.test.ts` | 25 | Encrypt/decrypt, refresh, redact, revoke, scope validation |
| IdempotencyStore | `idempotency-store.test.ts` | 15 | Put/get/isReplay/complete/fail, TTL expiry, race conditions |
| ErrorClassifier | `error-classifier.test.ts` | 20 | HTTP→classification mapping, Google error codes, edge cases |
| CalendarAdapter (read-only) | `calendar-adapter.test.ts` | 15 | Request construction, fixture response parsing |

**Total Phase 1: ~75 tests**

### Phase 2: Integration Tests (Stage 3C.3 — 3C.4)

Adapter wired to orchestrator with mock provider. Tests the full execution flow.

| Test Area | Files | Target Count | Key Assertions |
|---|---|---|---|
| Orchestrator + Calendar adapter | `execution-calendar.test.ts` | 20 | Full flow: approve → execute → verify → audit |
| Rollback integration | `rollback-calendar.test.ts` | 15 | Compensation execution for each Calendar operation |
| Idempotency in flow | `idempotency-flow.test.ts` | 10 | Replay detection, duplicate prevention |

**Total Phase 2: ~45 tests**

### Phase 3: Provider Contract Tests (Stage 3C.5 — 3C.6)

Verify that the adapter correctly implements the documented provider API contract using recorded/documented request/response pairs from Google's official API documentation.

| Test Area | Files | Target Count | Key Assertions |
|---|---|---|---|
| Request contract | `calendar-request-contract.test.ts` | 10 | Generated request URL/method/body matches Google spec |
| Response contract | `calendar-response-contract.test.ts` | 10 | Parsed response fields match documented schema |
| Error contract | `calendar-error-contract.test.ts` | 8 | Every documented error code maps to expected classification |

**Total Phase 3: ~28 tests**

### Phase 4: Regression Tests (Stage 3C.7)

Full regression against all certified stages. No new tests — all existing tests must continue to pass.

| Test Suite | Expected Count |
|---|---|
| Stage 3A (execution.test.ts) | 51 |
| Stage 3B.1 (execution-interfaces.test.ts) | 19 |
| Stage 3B.2 (execution-orchestrator.test.ts) | 27 |
| Stage 3B.3 (adapter-framework.test.ts) | 56 |
| Stage 3B.4 (rollback-engine.test.ts) | 40 |
| Platform SDK | 75 |
| API response helpers | 33 |
| Governance | 10 |
| Queue | 7 |
| **Total baseline regression** | **318** |
| Stage 3C new tests | ~148 |
| **Grand total** | **~466** |

## Fixture Strategy

Provider responses are simulated using fixture files derived from Google's official API documentation:

```
tests/fixtures/
  providers/
    calendar/
      events-list-response.json     — Documented response from Google Calendar v3 reference
      events-insert-request.json    — Documented request body for creating an event
      events-insert-response.json   — Documented response body
      error-rate-limit.json         — Documented rate limit error response
      error-validation.json         — Documented 400 validation error
      ...
```

Fixtures are committed to the repository. They contain realistic but synthetic data (no real user events, no real credentials, no real calendar IDs).

## Determinism Requirements

All tests in Phases 1-3 must be deterministic:
- No reliance on wall clock time (timestamps are mocked)
- No reliance on random values (RNG is seeded)
- No network access (provider is mocked or fixture-based)
- No shared state between test runs
- Order-independent execution

## Tooling

| Tool | Purpose |
|---|---|
| Vitest | Test runner (existing) |
| MSW (Mock Service Worker) | HTTP-level provider mocking for integration tests |
| Test fixtures (JSON) | Provider response simulation |
| Nock (alternative) | HTTP interception if MSW is incompatible |

## Rejected Approaches

| Approach | Reason |
|---|---|
| Live API calls in CI | Requires credentials, rate-limited, non-deterministic, violates G-003 |
| Manual testing only | Cannot certify without automated regression |
| Snapshot testing of API responses | Fragile; changes with every documentation update |
| No fixture-based testing | Phase 2 integration tests would have no provider interaction to validate against |
