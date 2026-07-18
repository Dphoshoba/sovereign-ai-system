# Stage 3C Provider Trust Boundary

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification

## Overview

The trust boundary defines what crosses between the Gamma OS runtime and an external provider (e.g., Google Calendar). Anything inside the boundary is controlled by Gamma OS governance. Anything outside is assumed hostile or untrusted until verified.

## Boundary Definition

```
┌───────────────────────────────────────────────────────────┐
│                   Gamma OS Runtime (TRUSTED)               │
│                                                           │
│  ┌─────────────────────────────────────────────────────┐  │
│  │           ExecutionOrchestrator (Stage 3B)           │  │
│  │  - Phase transitions                                 │  │
│  │  - Approval evaluation                               │  │
│  │  - Rollback dispatch                                 │  │
│  │  - Audit recording                                   │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                      │
│  ┌──────────────────┴──────────────────────────────────┐  │
│  │         ConnectorExecutionAdapter (Stage 3C)         │  │
│  │  - Provider-specific request construction            │  │
│  │  - Response parsing and validation                   │  │
│  │  - Error code mapping                                │  │
│  │  - Idempotency key injection                         │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                      │
│  ┌──────────────────┴──────────────────────────────────┐  │
│  │               CredentialManager (Stage 3C)           │  │
│  │  - Secure token storage (encrypted at rest)          │  │
│  │  - Token refresh                                     │  │
│  │  - Scoped credential retrieval                       │  │
│  │  - Full redaction from all logs/audits               │  │
│  └──────────────────┬──────────────────────────────────┘  │
│                     │                                      │
│═════════════════════╪═══════════════════════════════════════│
│                     │         TRUST BOUNDARY               │
│                     │                                      │
│  ┌──────────────────┴──────────────────────────────────┐  │
│  │              HTTP Transport Layer                     │  │
│  │  - TLS 1.3 to provider endpoint                      │  │
│  │  - No credential material in request body (header)   │  │
│  │  - Structured logging of request/response metadata   │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                  Provider API (UNTRUSTED)                   │
│                                                           │
│  - Response payloads may be malformed or malicious        │
│  - Provider state may change between verify calls         │
│  - Rate limits may be exceeded without warning             │
│  - API may return success but not apply mutation          │
│  - API may return error after applying mutation           │
└───────────────────────────────────────────────────────────┘
```

## What Crosses the Boundary

### Outbound (Runtime → Provider)

| Data | Classification | Handling |
|---|---|---|
| Request URL and headers | Public | Structured log (metadata only) |
| Request body (operation parameters) | Application data | Structured log, included in audit |
| Access token (Bearer) | SECRET | Header only, NEVER logged, NEVER in audit, redacted from all output |
| Idempotency key | Internal | Logged for replay detection audit |
| API key (if applicable) | SECRET | Same handling as access token |

### Inbound (Provider → Runtime)

| Data | Classification | Handling |
|---|---|---|
| Response body | Application data | Validated against expected schema, verified in verify phase |
| HTTP status code | Operational | Mapped to runtime failure classification |
| Error response body | Operational | Parsed, classified, logged (excluding token material) |
| Response headers (etag, revision) | Operational | Captured in mutation result for concurrency and verification |
| Rate limit headers (X-RateLimit-*) | Operational | Consumed by rate limiter for backoff |

## Validation Gates at the Boundary

Every provider response passes through these validation gates before the adapter returns control to the orchestrator:

1. **HTTP-level**: Status code is expected (2xx for success, 4xx/5xx handled as classified errors)
2. **Schema-level**: Response body conforms to documented schema (field types, required fields)
3. **Semantic-level**: Response values are internally consistent (e.g., event.start == event.end for zero-duration events is acceptable but flagged)
4. **Idempotency-level**: A mutation that should have been idempotent did not create duplicate provider state

## What Never Crosses the Boundary

- Raw credentials or tokens in logs, audit records, or error messages
- Internal runtime state (phase, transition history, rollback plans)
- Governance decisions (approval verdicts, policy evaluations)
- Other provider credentials (cross-provider credential leakage prevention)

## Security Assumptions

1. TLS is correctly configured and certificate validation is enforced
2. Provider API endpoints are correct and not redirected without verification
3. Access tokens expire and require refresh; refresh tokens are stored encrypted
4. Provider API changes are announced and versioned; the adapter pins to a specific API version
