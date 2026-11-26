# Gamma OS Provider Certification Matrix

**Created:** 2026-07-18 (Stage 3C.1 certification)
**Maintained by:** Governance Board
**Purpose:** Track provider certification levels, supported operations, rollback coverage, and known limitations across all integrated providers.

## Schema

| Field | Description |
|---|---|
| **Provider** | Provider name and API identifier |
| **Certification Level** | `READ_ONLY` / `MUTATE_SAFE` / `MUTATE_FULL` / `CERTIFIED` |
| **Certified Stage** | The Gamma OS stage that certified this provider |
| **Supported Operations** | List of certified operations |
| **Mutation Status** | `NONE` / `CREATE_ONLY` / `UPDATE` / `DESTRUCTIVE` / `FULL` |
| **Rollback Coverage** | Operations with certified compensation strategies |
| **Idempotency Support** | `NATIVE` / `APPLICATION` / `NONE` |
| **Approval Requirements** | Approval level map per operation |
| **Last Certified** | Date of most recent certification |
| **Certification Tag** | Git tag for the certification |
| **Known Limitations** | Documented gaps or restrictions |

## Provider Entries

### Google Calendar

| Field | Value |
|---|---|
| **Provider** | Google Calendar API v3 (`google-calendar`) |
| **Certification Level** | `MUTATE_SAFE` |
| **Certified Stage** | Stage 3C.2 (read-only) + Stage 3C.3 (dry-run pipeline) + Stage 3C.4 (sandbox mutation) + Stage 3C.5 (operational hardening) + Stage 3C.6 (rollback integration executor) |
| **Supported Operations** | `events.list`, `events.get`, `calendarList.list`, `calendars.get` (read-only); `events.insert`, `events.update`, `events.delete` (sandbox-gated mutation) |
| **Mutation Status** | `CREATE_ONLY` (sandbox-gated; production mutations not certified) |
| **Rollback Coverage** | Compensating rollback plans for `events.insert` (compensating delete) and `events.delete` (compensating insert) per G-019; `events.update` rollback requires prior state snapshot |
| **Idempotency Support** | `APPLICATION` (via idempotency key, enforced by SandboxExecutionPipeline) |
| **Approval Requirements** | `events.list`: NONE, `events.get`: NONE, `calendarList.list`: NONE, `calendars.get`: NONE; `events.insert`: STANDARD, `events.update`: STANDARD, `events.delete`: HEIGHTENED |
| **Last Certified** | 2026-07-19 (GOV-2026-Stage3C-014) |
| **Certification Tag** | `gamma-drive-stage3c6-rollback-integration` |
| **Known Limitations** | Sandbox-gated mutations only (G-016). Only single-event mutations certified — no batch, no background, no multi-resource. Credential and transport layers use mock/sandbox tokens. Stage 3C.5 pipeline adds retry, backoff, rate-limit handling, reconciliation, credential rotation, idempotency store, telemetry, and failure injection. RollbackExecutorImpl integrated for deterministic compensation execution. |

## Adding a New Provider

To add a new provider to this matrix:

1. Complete the provider's architecture planning (Stage 3C.0 equivalent)
2. Implement provider-neutral contracts (Stage 3C.1 equivalent)
3. Implement read-only adapter (Stage 3C.2 equivalent)
4. Progress through mutation, rollback, and certification stages
5. Submit matrix entry for Governance Board approval

## Provider Lifecycle

```
PLANNING → READ_ONLY → MUTATE_SAFE → MUTATE_FULL → CERTIFIED → DEPRECATED
                                                                        │
                                                                   MAINTENANCE
```

| Phase | Definition |
|---|---|
| **PLANNING** | Architecture and contracts defined; no provider code |
| **READ_ONLY** | Read operations certified; no mutations |
| **MUTATE_SAFE** | Safe create/update operations certified; destructive operations require separate approval |
| **MUTATE_FULL** | Full operation set certified including destructive operations |
| **CERTIFIED** | All operations, rollback, idempotency, and reconciliation certified |
| **DEPRECATED** | Provider no longer accepting new certifications; existing integrations maintained |
