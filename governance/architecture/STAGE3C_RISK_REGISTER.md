# Stage 3C Risk Register

**Status:** PLANNING (Stage 3C.0)
**Parent:** Stage 3C Architecture Specification
**Assessment Date:** 2026-07-18

## Risk Scoring

| Score | Severity | Definition |
|---|---|---|
| 1 | Negligible | No material impact |
| 2 | Minor | Minimal disruption, easily recoverable |
| 3 | Moderate | Significant disruption, recoverable with effort |
| 4 | Major | Severe impact, extended recovery time |
| 5 | Critical | Catastrophic impact, potential data loss or security breach |

## Risk Register

### R-001: Credential Leakage via Logs

| Attribute | Value |
|---|---|
| **Description** | Access token or refresh token appears in log output, audit record, or error message |
| **Category** | Security |
| **Pre-Mitigation** | Likelihood: 3 (Moderate), Impact: 5 (Critical) — **Risk Score: 15 (HIGH)** |
| **Mitigation** | CredentialManager.redact() called on all log-worthy objects; field-pattern-based redaction; automated test verifies no token material in any output |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 5 (Critical) — **Risk Score: 5 (LOW)** |
| **Status** | Accepted with mitigation |

### R-002: OAuth Token Expiry Mid-Execution

| Attribute | Value |
|---|---|
| **Description** | Access token expires during a long-running execution (e.g., batch insert of multiple events) |
| **Category** | Availability |
| **Pre-Mitigation** | Likelihood: 3 (Moderate), Impact: 3 (Moderate) — **Risk Score: 9 (MEDIUM)** |
| **Mitigation** | Token refresh before each provider call; 5-minute buffer for expiry check; refresh triggered automatically on 401 response |
| **Post-Mitigation** | Likelihood: 2 (Low), Impact: 3 (Moderate) — **Risk Score: 6 (LOW)** |
| **Status** | Accepted with mitigation |

### R-003: Idempotency Key Collision

| Attribute | Value |
|---|---|
| **Description** | Two different executions produce the same idempotency key, causing one to be incorrectly deduplicated |
| **Category** | Data Integrity |
| **Pre-Mitigation** | Likelihood: 2 (Low), Impact: 4 (Major) — **Risk Score: 8 (MEDIUM)** |
| **Mitigation** | Key includes executionId (globally unique) + operationHash (deterministic) + attemptNumber; collision probability approaches zero |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 4 (Major) — **Risk Score: 4 (LOW)** |
| **Status** | Accepted with mitigation |

### R-004: Provider API Breaking Change

| Attribute | Value |
|---|---|
| **Description** | Google Calendar API changes response schema, removes fields, or deprecates endpoints without advance notice |
| **Category** | Operational |
| **Pre-Mitigation** | Likelihood: 2 (Low), Impact: 4 (Major) — **Risk Score: 8 (MEDIUM)** |
| **Mitigation** | Adapter pins to v3 API; response schema validation catches mismatches immediately; contract tests verify against documented spec; version update requires recertification |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 4 (Major) — **Risk Score: 4 (LOW)** |
| **Status** | Accepted with mitigation |

### R-005: Ambiguous Outcome Not Resolved

| Attribute | Value |
|---|---|
| **Description** | Reconciliation cannot determine whether a mutation was applied (e.g., timeout with no read-back visibility) |
| **Category** | Operational |
| **Pre-Mitigation** | Likelihood: 2 (Low), Impact: 3 (Moderate) — **Risk Score: 6 (LOW)** |
| **Mitigation** | Escalation to operator with full context (executionId, operation, parameters, idempotencyKey); manual resolution via audit log |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 3 (Moderate) — **Risk Score: 3 (LOW)** |
| **Status** | Accepted with mitigation |

### R-006: Rate Limit Exhaustion

| Attribute | Value |
|---|---|
| **Description** | Google Calendar quota or per-user rate limit exceeded during batch operations |
| **Category** | Availability |
| **Pre-Mitigation** | Likelihood: 3 (Moderate), Impact: 2 (Minor) — **Risk Score: 6 (LOW)** |
| **Mitigation** | Exponential backoff on 429 responses; rate limit header monitoring; configurable max calls per window; queue-based execution pacing |
| **Post-Mitigation** | Likelihood: 2 (Low), Impact: 2 (Minor) — **Risk Score: 4 (LOW)** |
| **Status** | Accepted with mitigation |

### R-007: Compensation Failure (events.update Rollback)

| Attribute | Value |
|---|---|
| **Description** | Rollback of events.update fails because another process concurrently modified the event |
| **Category** | Data Integrity |
| **Pre-Mitigation** | Likelihood: 3 (Moderate), Impact: 3 (Moderate) — **Risk Score: 9 (MEDIUM)** |
| **Mitigation** | Pre-mutation snapshot stored; compensation retries with re-fetched current state and merge; partial rollback logged and escalated |
| **Post-Mitigation** | Likelihood: 2 (Low), Impact: 3 (Moderate) — **Risk Score: 6 (LOW)** |
| **Status** | Accepted with mitigation |

### R-008: Credential Encryption Key Compromise

| Attribute | Value |
|---|---|
| **Description** | The CREDENTIAL_ENCRYPTION_KEY environment variable is exposed via log, error, or CI output |
| **Category** | Security |
| **Pre-Mitigation** | Likelihood: 2 (Low), Impact: 5 (Critical) — **Risk Score: 10 (HIGH)** |
| **Mitigation** | Key injected at deployment, never stored in code or config files; CI/CD pipelines use secret managers; rotation capability in place |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 5 (Critical) — **Risk Score: 5 (LOW)** |
| **Status** | Accepted with mitigation |

### R-009: Silent Data Loss During events.delete Compensation

| Attribute | Value |
|---|---|
| **Description** | The pre-deletion snapshot is incomplete or incorrect, so recreating the event loses data |
| **Category** | Data Integrity |
| **Pre-Mitigation** | Likelihood: 2 (Low), Impact: 4 (Major) — **Risk Score: 8 (MEDIUM)** |
| **Mitigation** | Full event body fetched before delete; schema validation of snapshot before storing; verification step compares recreated event against snapshot |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 4 (Major) — **Risk Score: 4 (LOW)** |
| **Status** | Accepted with mitigation |

### R-010: Provider SDK Behavior Change

| Attribute | Value |
|---|---|
| **Description** | If a Google-provided SDK is used (contraindicated), an SDK update could change behavior silently |
| **Category** | Operational |
| **Pre-Mitigation** | Likelihood: 2 (Low), Impact: 3 (Moderate) — **Risk Score: 6 (LOW)** |
| **Mitigation** | No SDK dependency; all provider communication uses HTTP directly; contract tests verify against API spec, not SDK behavior |
| **Post-Mitigation** | Likelihood: 1 (Rare), Impact: 3 (Moderate) — **Risk Score: 3 (LOW)** |
| **Status** | Accepted with mitigation |

## Risk Summary

| Risk ID | Description | Pre-Mitigation | Post-Mitigation | Residual |
|---|---|---|---|---|
| R-001 | Credential leakage via logs | 15 (HIGH) | 5 (LOW) | ✅ Acceptable |
| R-002 | Token expiry mid-execution | 9 (MEDIUM) | 6 (LOW) | ✅ Acceptable |
| R-003 | Idempotency key collision | 8 (MEDIUM) | 4 (LOW) | ✅ Acceptable |
| R-004 | Provider API breaking change | 8 (MEDIUM) | 4 (LOW) | ✅ Acceptable |
| R-005 | Ambiguous outcome not resolved | 6 (LOW) | 3 (LOW) | ✅ Acceptable |
| R-006 | Rate limit exhaustion | 6 (LOW) | 4 (LOW) | ✅ Acceptable |
| R-007 | Compensation failure (update) | 9 (MEDIUM) | 6 (LOW) | ✅ Acceptable |
| R-008 | Encryption key compromise | 10 (HIGH) | 5 (LOW) | ✅ Acceptable |
| R-009 | Silent data loss (delete) | 8 (MEDIUM) | 4 (LOW) | ✅ Acceptable |
| R-010 | SDK behavior change | 6 (LOW) | 3 (LOW) | ✅ Acceptable |

**Pre-mitigation total:** 85 (Average: 8.5 — MEDIUM)
**Post-mitigation total:** 44 (Average: 4.4 — LOW)
**Reduction:** 48.2% (acceptable residual risk across all entries)

## Risk Acceptance

All risks are accepted with the stated mitigations. No risk exceeds the acceptable threshold of 6 (LOW) post-mitigation. No critical risk (score ≥ 15) remains post-mitigation.
