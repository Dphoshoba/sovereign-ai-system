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
| **Certification Level** | `READ_ONLY` |
| **Certified Stage** | Stage 3C.2 |
| **Supported Operations** | `events.list`, `events.get`, `calendarList.list`, `calendars.get` |
| **Mutation Status** | `NONE` |
| **Rollback Coverage** | N/A (read-only) |
| **Idempotency Support** | `APPLICATION` (via extended properties, Stage 3C.4) |
| **Approval Requirements** | `events.list`: NONE, `events.get`: NONE, `calendarList.list`: NONE, `calendars.get`: NONE |
| **Last Certified** | 2026-07-18 (GOV-2026-Stage3C-006) |
| **Certification Tag** | `gamma-drive-stage3c2-calendar-readonly` |
| **Known Limitations** | Read-only phase; no mutations certified. Dry-run pipeline in progress (Stage 3C.3). |

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
