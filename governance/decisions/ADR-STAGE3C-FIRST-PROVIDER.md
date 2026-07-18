# ADR-STAGE3C-FIRST-PROVIDER: First Provider and Operation Family Selection

**Status:** PROPOSED (Stage 3C.0)
**Date:** 2026-07-18
**Author:** Governance Board

## Context

Stage 3C requires a first certified provider integration to validate the provider integration architecture, credential model, idempotency strategy, and rollback mapping. The selected provider and operation family must be:

1. Real enough to exercise all Stage 3C components
2. Safe enough to fail without data loss
3. Well-documented with official API reference
4. Supportive of incremental read-then-write rollout

## Candidate Providers

| Provider | API Maturity | Operation Families | Key Challenge |
|---|---|---|---|
| Google Calendar | GA, stable REST v3 | events.list, events.get, events.insert, events.update, events.delete | OAuth credential lifecycle |
| Google Drive | GA, stable REST v3 | files.list, files.get, files.create, files.update, files.delete | Large file handling, pagination |
| Gmail | GA, stable REST v1 | messages.list, messages.get, messages.send, messages.modify, messages.delete | Content encoding, attachments |
| Google Sheets | GA, stable REST v4 | values.get, values.update, values.append, spreadsheets.create | Range addressing, cell formats |

## Decision: Google Calendar — events.list → events.insert

### Selected Provider

**Google Calendar API v3** (REST, GA since 2014)

### Operation Family Progression

The integration proceeds through staged operation families, each adding capability and risk:

| Phase | Operations | Risk Level | Purpose |
|---|---|---|---|
| **Read-Only** | `events.list`, `events.get` | READ | Validate credential acquisition, request construction, response parsing, rate limiting |
| **Safe Create** | `events.insert` | MODIFY | Validate idempotency, mutation execution, verification (read-back) |
| **Update** | `events.update`, `events.patch` | MODIFY | Validate etag-based concurrency, partial update |
| **Destructive** | `events.delete` | DESTRUCTIVE | Validate approval gates, rollback (recreate from audit), critical path |

### Rationale

1. **Read-before-write safety**: Read operations validate the entire pipeline (auth, request, response) with zero data-loss risk.
2. **Calendar events are ephemeral and reversible**: A test event can be created, read back, updated, and deleted within seconds. Deleted events can be recreated from audit data.
3. **Well-scoped data model**: Each event is a single JSON object with ~20 fields. No pagination, no file upload, no content encoding complexity.
4. **Official API documentation** at https://developers.google.com/calendar/api/v3/reference provides complete request/response schemas, error codes, and quota limits.
5. **Idempotency-friendly**: Creating an identical event with the same idempotency key should produce exactly one event. The API supports conditional creation via `If-Match` / `If-None-Match`.
6. **Rollback is recreate-from-audit**: For `events.insert`, the compensating operation is `events.delete` using the event ID stored in the audit record. For `events.delete`, compensation is `events.insert` using the stored event body.

### Rejected Alternatives

| Alternative | Reason |
|---|---|
| **Google Drive files.create** | File upload complexity, large payloads, binary content unsuitable for deterministic hashing |
| **Gmail messages.send** | Irreversible once delivered; no true rollback |
| **Google Sheets values.append** | Append is non-idempotent by nature (each append adds a row) |

## Consequences

### Positive

- Calendar operations are fully documented, testable, and reversible
- Read-only phase provides a safe on-ramp for credential and request-pipeline validation
- All 5 Stage 3C execution phases (dry-run, sandbox, live, verify, rollback) can be exercised
- The Calendar API is representative of Google's REST API patterns, easing future provider integration

### Negative

- Requires OAuth 2.0 credential handling (the credential model must support token refresh)
- Calendar event schemas have optional fields that increase verification complexity
- Google API quotas and rate limits must be managed (default: 1,000,000 queries/day, 10 queries/second per user)

## References

- Google Calendar API v3 Reference: https://developers.google.com/calendar/api/v3/reference
- Google API Console: https://console.developers.google.com/
- Stage 3B.1 ConnectorExecutionAdapter interface: `lib/platform/execution/connector-execution-adapter.ts`
