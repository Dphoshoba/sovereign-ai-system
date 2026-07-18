# Stage 3C Architecture Specification — Provider Integration

**Status:** CERTIFIED (Stage 3C.0 — architecture; Stage 3C.1 — contracts; Stage 3C.2 — Calendar read-only adapter; Stage 3C.3 — dry-run pipeline)
**Parent:** Stage 3B CERTIFIED and FROZEN at `499401a` (`gamma-drive-stage3b4-rollback-engine`)
**Governance:** GOV-2026-Stage3C-001 through GOV-2026-Stage3C-008
**Objective:** Define the complete provider integration architecture for safe, deterministic, and reversible external provider mutations.

## Scope

Stage 3C extends the Stage 3B execution pipeline by replacing simulated execution/verification phases with real provider adapter calls, while preserving all Stage 3A and Stage 3B invariants:

- Deterministic planning before execution
- Immutable audit history
- Governance controls
- Rollback capability
- Phase isolation
- Connector-neutral core

## Architecture Principles

1. **Provider Isolation** — Every provider interaction is mediated through a certified adapter. No provider code reaches the runtime core.
2. **Deterministic Request Construction** — Every provider request must be derivable from a deterministic plan hash. Non-deterministic inputs (timestamps, random nonces) are injected at the last responsible moment.
3. **Idempotent By Default** — Every mutation request carries an idempotency key. The runtime rejects detectable replays before they reach the provider.
4. **Fail-Closed Credential Model** — Every credential is encrypted at rest, scoped to the minimum required operation, and redacted in all logs and audit records.
5. **Compensation-Guaranteed Rollback** — Every mutable operation must have a corresponding compensation strategy defined before execution.
6. **Audit-Before-Outcome** — The audit record is written before any outcome is reported to the caller.

## Execution Flow (Stage 3C)

```
Stage 3A Pipeline (unchanged)
  RECEIVED → VALIDATING_PACKAGE → LOCK_VALIDATION → PREPARING → PREFLIGHT → READY → EXECUTION_BLOCKED → AUDITING → COMPLETED

Stage 3B Phases (unchanged — orchestration framework)
  S3B_INITIAL → S3B_APPROVAL → S3B_EXECUTION → S3B_VERIFICATION → S3B_AUDIT → S3B_COMPLETED

Stage 3C Provider Integration (replaces simulated stubs)
  S3B_APPROVAL
    ├─ ApprovalGate.evaluate(approvalRequest)  ← real approval check
    ├─ APPROVED → continue
    └─ DENIED  → S3B_ROLLBACK

  S3B_EXECUTION  ← REPLACED by real adapter call
    ├─ ConnectorExecutionAdapter.execute(request, candidate)
    │     ├─ Dry-run mode: validate request, return predicted result, NO mutation
    │     ├─ Sandbox mode: execute against provider sandbox/test environment
    │     ├─ Live mode: execute against real provider endpoint
    │     └─ Adapter serializes provider-specific API call
    ├─ Record ProviderMutationResult { mutationId, providerState, etag, revision }
    └─ Failure → S3B_ROLLBACK

  S3B_VERIFICATION  ← REPLACED by real adapter call
    ├─ ConnectorExecutionAdapter.verify(request, mutationResult, candidate)
    ├─ Compare expected state vs actual provider state
    ├─ Detect drift (list of field-level differences)
    └─ Failure → S3B_ROLLBACK

  S3B_AUDIT (unchanged — audit events recorded)
  S3B_COMPLETED or S3B_FAILED
```

## Stage 3C Sub-Stages

| Sub-Stage | Focus | Key Deliverables |
|---|---|---|
| **3C.0** | Architecture & planning | Architecture docs, trust boundary, credential model, risk register, ADR |
| **3C.1** | Provider-neutral integration contracts | 9 provider contract interfaces (request, response, error, auth, credential, transport, verification, reconciliation, idempotency) |
| **3C.2** | Google Calendar read-only adapter | events.list, events.get, calendarList.list — first concrete provider, no mutations |
| **3C.3** | Calendar mutation dry-run pipeline | Mutation request construction, approval gates, idempotency, rollback plans, deterministic simulation — transport never invoked | ✅ **CERTIFIED** |
| **3C.4** | Sandboxed Calendar Mutation | events.insert/update/delete against sandbox calendar; post-mutation verification; idempotency enforcement; audit capture | ✅ **AUTHORIZED** |
| **3C.5** | Error classification & retry | Provider error classification, retry eligibility, ambiguous-outcome reconciliation | ⬜ PLANNING |
| **3C.6** | Rollback integration | Real rollback executor implementation, compensation chain execution | ⬜ PLANNING |
| **3C.7** | Certification | Full integration test suite, security review, governance certification | ⬜ PLANNING |

## Adapter Architecture (Stage 3C)

```
┌─────────────────────────────────────────────────────┐
│                 ExecutionOrchestrator                │
│  (Stage 3B — unchanged, but wired to real adapters)  │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
     execute()   verify()   rollback()   audit()
           │          │          │          │
┌──────────┴──────────┴──────────┴──────────┴─────────┐
│              ConnectorExecutionAdapter                │
│           (Stage 3C — real provider calls)            │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
     serialize()  deserialize()  mapError()  buildAudit()
           │          │          │          │
┌──────────┴──────────┴──────────┴──────────┴─────────┐
│              Provider Contracts (Stage 3C.1)          │
│          ProviderRequest / ProviderResponse           │
│     ProviderError / Authentication / Credential       │
│        Transport / Verification / Reconciliation      │
│                    IdempotencyService                  │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
┌──────────┴──────────┴──────────┴──────────┴─────────┐
│                 ProviderAdapter                       │
│        (Stage 3B.3 framework — subclassed)            │
└──────────┬──────────┬──────────┬──────────┬─────────┘
           │          │          │          │
      formatReq()  parseResp()  classifyErr()  buildMeta()
           │          │          │          │
┌──────────┴──────────┴──────────┴──────────┴─────────┐
│               HTTP / gRPC / Provider SDK              │
│           (Stage 3C — isolated transport layer)       │
└──────────────────────────────────────────────────────┘
```

## Separation of Concerns

| Layer | Responsibility | Certified In |
|---|---|---|
| Orchestrator | Phase orchestration, approval, rollback dispatch | Stage 3B.2 |
| Adapter Interface | `execute`, `verify`, `rollback`, `audit` contract | Stage 3B.1 |
| Adapter Registry | Adapter lifecycle, discovery, validation | Stage 3B.3 |
| Capability Model | Risk levels, approval requirements, operation metadata | Stage 3B.1 |
| Compensation Engine | Rollback planning, validation, audit | Stage 3B.4 |
| **Provider Contracts** | **Provider-neutral interfaces (request, response, error, auth, credential, transport, verification, reconciliation, idempotency)** | **Stage 3C.1** |
| **Provider Adapter** | **Provider-specific request formatting, response parsing, error mapping** | **Stage 3C** |
| **Credential Manager** | **Secure storage, rotation, scoped access, redaction** | **Stage 3C** |
| **Idempotency Store** | **Deduplication, replay detection** | **Stage 3C** |
| **Error Classifier** | **Provider error code → runtime failure code mapping** | **Stage 3C** |

## Certified Baseline Invariants

The following must remain true after Stage 3C implementation:

- `lib/platform/execution/` core files unchanged (additive extensions only)
- Stage 3A runtime tests: 51/51 passing
- Stage 3B.1 interface tests: 19/19 passing
- Stage 3B.2 orchestrator tests: 27/27 passing
- Stage 3B.3 adapter framework tests: 56/56 passing
- Stage 3B.4 rollback engine tests: 40/40 passing
- Platform test suite: 318/318 passing
- Provider contract tests: 37/37 passing (Stage 3C.1)
- Calendar adapter tests: 43/43 passing (Stage 3C.2)
- Dry-run pipeline tests: 31/31 passing (Stage 3C.3)
- Cumulative regression: 429/429 passing

## Provider Contract Layer (Stage 3C.1)

The provider contract layer sits between `ConnectorExecutionAdapter` and `ProviderAdapter`, defining provider-neutral interfaces for all external communication:

| Contract | File | Purpose |
|---|---|---|
| `ProviderRequest` | `provider-contracts/provider-request.ts` | Canonical outbound request (method, url, headers, body, idempotency key, retry state) |
| `ProviderResponse` | `provider-contracts/provider-response.ts` | Canonical provider response (status, headers, body, etag, revision, timing) |
| `ProviderError` | `provider-contracts/provider-error.ts` | Provider-independent error taxonomy (16 codes, 3 categories, retry configuration) |
| `AuthenticationProvider` | `provider-contracts/authentication-provider.ts` | Token acquisition, refresh, expiry detection, revocation |
| `CredentialProvider` | `provider-contracts/credential-provider.ts` | Credential descriptor, validation, revocation |
| `Transport` | `provider-contracts/transport.ts` | Network abstraction — send request, availability check (no implementation) |
| `VerificationProvider` | `provider-contracts/verification-provider.ts` | Read-back verification of provider state after mutation |
| `ReconciliationProvider` | `provider-contracts/reconciliation-provider.ts` | Ambiguous-outcome reconciliation via read-back |
| `IdempotencyService` | `provider-contracts/idempotency-service.ts` | Replay detection, key lifecycle, TTL-based cleanup |

All contracts are provider-neutral. No reference to Google Calendar, Google Drive, Gmail, or any specific provider exists in any contract file.
