# Stage 3C Error Classification and Retry Model

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification

## Overview

Provider API calls can fail in many ways: network timeouts, HTTP errors, rate limits, ambiguous responses, and silent failures. This model defines how errors are classified, which errors are retryable, and how ambiguous outcomes are reconciled.

## Error Classification Hierarchy

```
ProviderError
├── TRANSIENT (retryable)
│   ├── NETWORK_TIMEOUT          — Connection or read timeout
│   ├── NETWORK_UNAVAILABLE      — DNS failure, connection refused
│   ├── RATE_LIMITED             — HTTP 429, X-RateLimit-* exhausted
│   ├── SERVER_ERROR             — HTTP 5xx (internal server error)
│   └── SERVICE_UNAVAILABLE      — HTTP 503
├── PERMANENT (not retryable)
│   ├── BAD_REQUEST              — HTTP 400 (malformed request)
│   ├── UNAUTHORIZED             — HTTP 401 (expired or invalid token)
│   ├── FORBIDDEN                — HTTP 403 (insufficient permissions)
│   ├── NOT_FOUND                — HTTP 404 (resource does not exist)
│   ├── CONFLICT                 — HTTP 409 (etag mismatch, precondition failed)
│   ├── INVALID_ARGUMENT         — Operation parameters are invalid
│   └── QUOTA_EXCEEDED           — Daily quota exhausted (not rate limit)
└── AMBIGUOUS (requires reconciliation)
    ├── TIMEOUT_NO_RESPONSE      — Request sent, no response received
    ├── SUCCESS_WITH_ERROR       — HTTP 200 but body indicates failure
    └── DUPLICATE_DETECTED       — Idempotency check found unexpected duplicate
```

## Classification Logic

```typescript
interface ProviderErrorClassifier {
  /**
   * Classify a provider response or error into a runtime error category.
   * Maps provider-specific HTTP codes and error bodies to canonical types.
   */
  classify(
    statusCode: number,
    errorBody: Record<string, unknown> | null,
    context: ErrorContext,
  ): ClassifiedError;
}

interface ClassifiedError {
  category: 'TRANSIENT' | 'PERMANENT' | 'AMBIGUOUS';
  code: string;            // Canonical error code (e.g., RATE_LIMITED)
  retryable: boolean;
  providerCode?: string;   // Original provider error code (e.g., 'rateLimitExceeded')
  providerMessage?: string;// Original provider message (redacted)
  details: Record<string, unknown>;
}
```

### Google Calendar Error Mapping

| HTTP Status | Google Error Code | Classification | Retryable |
|---|---|---|---|
| 200 + error body | N/A | AMBIGUOUS | Reconciliation |
| 400 | `invalid` | PERMANENT — BAD_REQUEST | No |
| 401 | `unauthorized` | PERMANENT — UNAUTHORIZED | Credential refresh |
| 403 | `forbidden` | PERMANENT — FORBIDDEN | No |
| 404 | `notFound` | PERMANENT — NOT_FOUND | No |
| 409 | `conflict` | PERMANENT — CONFLICT | Conditional (re-fetch) |
| 429 | `rateLimitExceeded` | TRANSIENT — RATE_LIMITED | Yes (exponential backoff) |
| 500 | `backendError` | TRANSIENT — SERVER_ERROR | Yes (exponential backoff) |
| 503 | `backendError` | TRANSIENT — SERVICE_UNAVAILABLE | Yes (exponential backoff) |
| Timeout | N/A | AMBIGUOUS — TIMEOUT_NO_RESPONSE | Reconciliation |
| Connection error | N/A | TRANSIENT — NETWORK_UNAVAILABLE | Yes |

## Retry Policy

### Retry Eligibility

| Classification | Max Retries | Backoff Strategy | Notes |
|---|---|---|---|
| TRANSIENT | 3 | Exponential: 1s, 4s, 16s | Jitter: ±20% |
| PERMANENT | 0 | N/A | Escalate to operator |
| AMBIGUOUS | 0 | N/A | Reconciliation (not retry) |

### Exponential Backoff Parameters

```
Initial delay:    1,000 ms
Multiplier:       4x
Max delay:        60,000 ms
Jitter:           ±20% of calculated delay
Max retries:      3 (TRANSIENT)
```

### Retry Decision Flow

```
Error occurred
  ├─ Classify error
  │     ├─ PERMANENT → no retry; fail immediately
  │     ├─ TRANSIENT → check retry count
  │     │     ├─ < maxRetries → compute backoff → wait → retry
  │     │     └─ ≥ maxRetries → fail with EXCEEDED_RETRY_LIMIT
  │     └─ AMBIGUOUS → enter reconciliation flow
```

## Ambiguous-Outcome Reconciliation

### Definition

An ambiguous outcome occurs when the runtime cannot determine whether a provider mutation was applied. This happens when:

1. A network timeout occurs after the request was sent but before a response was received
2. HTTP 200 is returned but the body contains an error
3. The idempotency store shows EXECUTING but no result is available (process crash)

### Reconciliation Flow

```
Ambiguous outcome detected
  │
  ├─ 1. Read-back: Fetch current provider state
  │      ├─ events.list with time range filter
  │      └─ Compare against expected state from execution request
  │
  ├─ 2. Was mutation applied?
  │      ├─ YES → Complete execution with success
  │      ├─ NO  → Retry mutation with new attemptNumber
  │      └─ UNSURE → Escalate to operator
  │
  └─ 3. Record reconciliation result in audit
```

### Read-Back Window

| Operation | Read-Back Strategy |
|---|---|
| `events.insert` | List events by time range matching the event start/end |
| `events.update` | Get event by ID; compare fields against expected |
| `events.delete` | Get event by ID; expect 404 Not Found |
| `events.list` | Idempotent by nature; no reconciliation needed |

### Reconciliation Timeout

- Maximum reconciliation window: 30 seconds
- If reconciliation exceeds the window, the execution remains in AMBIGUOUS state and escalates to operator review

## Audit Events

| Event | Trigger |
|---|---|
| `ERROR_CLASSIFIED` | Any provider error classified |
| `RETRY_ATTEMPTED` | Transient error retried |
| `RETRY_EXCEEDED` | Max retries exhausted |
| `AMBIGUOUS_DETECTED` | Ambiguous outcome detected |
| `AMBIGUOUS_RESOLVED` | Reconciliation determined outcome |
| `AMBIGUOUS_ESCALATED` | Reconciliation failed; operator notified |

## Integration with Existing FailureClassifier

Stage 3B's `failure-classifier.ts` (`ExecutionFailureCode`) handles runtime-level failures. Stage 3C adds a provider-specific layer that maps provider errors to these existing codes:

| Provider Error | ExecutionFailureCode |
|---|---|
| BAD_REQUEST | `INVALID_INPUT` |
| UNAUTHORIZED | `CREDENTIAL_INVALID` |
| FORBIDDEN | `ACCESS_DENIED` |
| RATE_LIMITED | `RATE_LIMITED` |
| TIMEOUT | `NETWORK_FAILURE` |
| SERVER_ERROR | `PROVIDER_UNAVAILABLE` |
| Reconciliation failure | `VERIFICATION_FAILED` |

## Rejected Approaches

| Approach | Reason |
|---|---|
| Infinite retry | Risk of cascading provider abuse |
| All 4xx errors retryable | 400/401/403 will never succeed on retry |
| No reconciliation for timeouts | Risk of silent duplicate mutation |
| Always re-execute on ambiguous | Risk of duplicate (mutation was actually applied) |
