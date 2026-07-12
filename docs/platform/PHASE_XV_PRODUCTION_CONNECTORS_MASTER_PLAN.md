# Phase XV Production Connectors Master Plan

Last updated: 2026-07-12

## Executive Summary

Phase XV is the Production Integration Platform phase. Its mission is to connect Gamma safely to external systems through certified adapters while preserving the governance, determinism, approval, and audit guarantees established in Stage 5.

This document is the blueprint for every connector in Phase XV and every certified integration after it. Gmail is the reference connector. Calendar, Drive, GitHub, Slack, Notion, and future connectors must follow the same release-engineering lifecycle:

```
Plan -> Implement -> Validate -> Certify -> Freeze -> Handover -> Next Phase
```

Build numbers are implementation markers. Certification is the release gate.

## Phase XV Objectives

| Objective | Requirement |
| --- | --- |
| Certified adapters | Every connector must be certified before production use. |
| Shared connector SDK | Common approval, queue, audit, retry, health, observability, and testing primitives must be reused. |
| Governance preservation | No connector bypasses Gamma governance, approval, or audit. |
| Deterministic readiness | Health, metrics, certification, and retry surfaces must support deterministic evaluation. |
| Human approval | Production actions require explicit human approval. |
| No connector execution in core | External execution remains behind adapter-controlled boundaries. |

## Current Connector Status

| Connector | Current Status | Certification Position | Next Release Step |
| --- | --- | --- | --- |
| Gmail | Certified reference connector | Certified v1.0, score 93/100 | Operational production activation checklist |
| Calendar | Production readiness projection exists | Candidate | Complete Calendar-specific certification package |
| Drive | Gamma Factory scaffold and readiness projection exist | Candidate | Complete Drive-specific certification package |
| GitHub | Gamma Factory scaffold and readiness projection exist | Candidate | Complete GitHub-specific certification package |
| Slack | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| Notion | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| Microsoft 365 | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| Discord | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| Stripe | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| Salesforce | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| HubSpot | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| Dropbox | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| OneDrive | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |
| SharePoint | Production readiness documentation exists | Candidate | Normalize to shared SDK lifecycle |

## Gmail Certification Status

Gmail is the Phase XV reference connector.

| Area | Status |
| --- | --- |
| Specification | Complete |
| Certification status | Certified |
| Certification score | 93/100 |
| Production readiness score | 92/100 |
| OAuth | Certified |
| Reader | Certified |
| Composer | Certified |
| Preview | Certified |
| Approval gate | Certified |
| Queue engine | Certified |
| Controlled executor | Certified |
| Health monitor | Certified |
| Compliance audit | Certified |
| Hardening | Certified |
| Documentation | Certified |

Gmail establishes the reusable connector pattern:

```
Read -> Sanitize -> Parse -> Preview -> Approve -> Queue -> Execute -> Audit -> Certify
```

## Remaining Gmail Work

Gmail is certified as the reference implementation. Remaining Gmail work is operationalization, not architecture.

| Work Item | Purpose | Required Before Live Production |
| --- | --- | --- |
| Production credential review | Confirm OAuth client, scopes, secret handling, and revocation path | YES |
| Real token refresh validation | Verify refresh behavior against production credentials | YES |
| Real-send feature flag review | Confirm real execution stays disabled by default and requires approval | YES |
| Production smoke route | Validate health, scopes, quota, rate limit, and approval surfaces | YES |
| Operator runbook | Document approve, reject, retry, revoke, and rollback workflows | YES |
| Audit export review | Confirm audit evidence can be retained and reviewed | YES |
| Incident rollback plan | Confirm connector disablement and token revocation procedures | YES |
| Final Gmail release certificate | Freeze Gmail as certified production integration | YES |

## Calendar Implementation Plan

Calendar should be the first post-Gmail certified integration because it can reuse Gmail's OAuth, approval, queue, audit, health, retry, and certification patterns while adapting resource parsing and action semantics to events.

### Calendar Scope

| Area | Plan |
| --- | --- |
| Read | Events, calendars, attendees, availability metadata |
| Preview | Event creation/update/delete previews with no side effects |
| Approval | Human approval for event writes, attendee changes, and external invitations |
| Queue | Approved calendar jobs queued with deterministic ordering |
| Execute | Adapter-controlled Calendar API calls after approval |
| Audit | Event changes, approver, reason, timestamp, rollback reference |
| Health | OAuth, scopes, quota, rate limits, calendar access, write readiness |

### Calendar Milestones

| Milestone | Deliverable |
| --- | --- |
| Plan | Calendar contract, scopes, risks, and connector boundary document |
| Implement | Adapter, reader, parser, action set, preview, approval, queue, executor, audit |
| Validate | Unit, integration, determinism, security, route smoke, boundary scans |
| Certify | Calendar certification document and production readiness score |
| Freeze | Calendar production integration tag |
| Handover | Calendar operator runbook and support checklist |

## Drive Implementation Plan

Drive should follow Calendar and reuse Google OAuth posture while adapting to file, folder, permission, and sharing semantics.

### Drive Scope

| Area | Plan |
| --- | --- |
| Read | Files, folders, metadata, permissions, shared drives |
| Preview | File move, copy, rename, permission, and share previews |
| Approval | Human approval for destructive changes, sharing changes, and external access |
| Queue | Approved Drive jobs queued with idempotency keys |
| Execute | Adapter-controlled Drive API calls after approval and quota checks |
| Audit | File identifier, action, approver, permission delta, rollback evidence |
| Health | OAuth, scopes, quota, rate limits, storage posture, shared-drive access |

### Drive Milestones

| Milestone | Deliverable |
| --- | --- |
| Plan | Drive contract, permission model, data-safety policy |
| Implement | Adapter, resource parser, action set, preview, approval, queue, executor, audit |
| Validate | File permission tests, redaction tests, deterministic health checks |
| Certify | Drive certification document and production readiness score |
| Freeze | Drive production integration tag |
| Handover | Drive operator runbook and rollback checklist |

## GitHub Implementation Plan

GitHub should follow Drive and adapt the shared SDK to repositories, issues, pull requests, workflows, secrets policy, and organization boundaries.

### GitHub Scope

| Area | Plan |
| --- | --- |
| Read | Repositories, issues, pull requests, branches, workflow metadata |
| Preview | Issue comments, PR comments, labels, assignments, branch actions |
| Approval | Human approval for writes, workflow dispatch, branch changes, and privileged actions |
| Queue | Approved GitHub jobs queued with repository and actor context |
| Execute | Adapter-controlled GitHub API calls after approval and policy checks |
| Audit | Repository, actor, action, approver, diff summary, rollback evidence |
| Health | Auth, scopes, rate limits, organization access, repository permissions |

### GitHub Milestones

| Milestone | Deliverable |
| --- | --- |
| Plan | GitHub contract, organization policy, branch protection assumptions |
| Implement | Adapter, reader, resource parser, action set, preview, approval, queue, executor, audit |
| Validate | Permission tests, branch-protection tests, deterministic health checks |
| Certify | GitHub certification document and production readiness score |
| Freeze | GitHub production integration tag |
| Handover | GitHub operator runbook and incident rollback checklist |

## Shared Connector SDK

The shared connector SDK is the common substrate for every certified integration. It should be treated as a platform product inside Phase XV, not as a helper folder.

### SDK Responsibilities

| Responsibility | Requirement |
| --- | --- |
| Connector identity | Stable connector id, display name, provider, version, status |
| Capability model | Read, preview, write, execute, audit, health, metrics capabilities |
| Auth model | Scopes, token health, revocation state, credential posture |
| Resource model | Connector-specific resource parser into Gamma-readable records |
| Action model | Proposed action, risk level, preview payload, rollback reference |
| Approval model | Human approval, rejection, reason, approver, timestamp |
| Queue model | Deterministic ordering, idempotency key, retry policy, status |
| Execution model | Feature-flagged, approval-bound, adapter-controlled execution |
| Audit model | Immutable event trail and certification evidence |
| Health model | Deterministic health scoring and operator warnings |
| Observability model | Metrics, traces, warnings, incidents, and readiness posture |

### SDK Modules

| Module | Shared Across Connectors | Adapter-Specific |
| --- | --- | --- |
| Approval gate | YES | Minimal labels |
| Queue engine | YES | Job type metadata |
| Compliance audit | YES | Event taxonomy extensions |
| Retry policy | YES | Provider-specific retryable errors |
| Dead-letter queue | YES | Provider-specific failure categories |
| Idempotency | YES | Resource-specific keys |
| Sanitizer | YES | Provider-specific secret patterns |
| Health scoring | YES | Provider metrics |
| OAuth adapter | Pattern | Provider endpoints and scopes |
| API client | NO | Provider implementation |
| Resource parser | Pattern | Provider implementation |
| Action set | Pattern | Provider implementation |

## Connector Certification Checklist

Every connector must pass this checklist before production certification.

| Check | Required |
| --- | --- |
| Connector boundary document | YES |
| Adapter contract documented | YES |
| OAuth or auth model documented | YES |
| Scopes documented and minimal | YES |
| Credential handling reviewed | YES |
| Preview has no side effects | YES |
| Human approval required for production writes | YES |
| Queue enabled before execution | YES |
| Execution feature flag defaults off | YES |
| Audit trail immutable | YES |
| Retry and dead-letter behavior documented | YES |
| Health monitoring deterministic | YES |
| Observability events defined | YES |
| Smoke routes passing | YES |
| Tests passing | YES |
| Boundary scan passing | YES |
| No connector execution inside Gamma OS core | YES |
| Operator runbook complete | YES |
| Production readiness statement complete | YES |
| Certification score recorded | YES |

## Shared Approval Flow

Approval is mandatory for production writes.

```
Proposed Action
  -> Risk Classification
  -> Side-Effect-Free Preview
  -> Human Approval or Rejection
  -> Queue
  -> Execution Eligibility Check
  -> Audit Receipt
```

Approval records must include connector id, action id, risk classification, preview hash, approver, decision, reason, timestamp, and audit reference.

## Shared Queue

The shared queue must provide:

- Deterministic ordering.
- Idempotency keys.
- Job status transitions.
- Retry count and retry window.
- Dead-letter handoff.
- Operator-visible reason for failure.
- Audit references for every state change.

No connector may execute a production action directly from preview.

## Shared Execution

Execution must be:

- Adapter-controlled.
- Feature-flagged.
- Approval-bound.
- Queue-bound.
- Rate-limit aware.
- Quota-aware.
- Audited.
- Reversible or explicitly marked irreversible before approval.

Execution must not live inside Gamma OS core. Gamma governs the action; the connector adapter performs provider-specific execution.

## Shared Audit

Audit records must capture:

- Connector id.
- Resource id.
- Action id.
- Actor.
- Approver.
- Decision.
- Queue id.
- Execution id.
- Result.
- Retry count.
- Receipt.
- Rollback reference.

Audit records must redact credentials, tokens, secrets, and sensitive provider metadata.

## Shared Retry

Retry policy must be deterministic and provider-aware.

| Error Type | Policy |
| --- | --- |
| Rate limit | Backoff and retry inside provider limits |
| Quota exceeded | Hold and require operator review |
| Auth expired | Refresh token if allowed; otherwise require reconnect |
| Permission denied | Do not retry automatically; require operator review |
| Validation error | Do not retry; return to preview/action correction |
| Transient provider error | Retry with bounded exponential backoff |
| Unknown error | Dead-letter after configured attempts |

## Shared Health Monitoring

Every connector health surface must include:

- Auth health.
- Scope posture.
- Quota posture.
- Rate-limit posture.
- Capability readiness.
- Queue health.
- Audit health.
- Retry backlog.
- Dead-letter count.
- Operator warnings.
- Production readiness score.

Health checks must accept explicit time inputs where time affects output.

## Shared Observability

Observability must provide:

| Signal | Requirement |
| --- | --- |
| Metrics | Request count, queue depth, retries, failures, approvals, rejections, latency |
| Logs | Redacted, structured, connector-scoped, action-scoped |
| Traces | Preview, approval, queue, execute, audit stages |
| Alerts | Auth failure, quota risk, retry backlog, dead-letter events |
| Dashboards | Connector readiness, risk posture, operator actions, incident state |
| Reports | Certification score and production readiness summary |

## Shared Tests

Every connector must include:

| Test Type | Requirement |
| --- | --- |
| Contract tests | Connector satisfies shared production connector contract |
| Auth tests | Scopes, token health, revocation, reconnect |
| Preview tests | No side effects and deterministic payloads |
| Approval tests | No approval bypass |
| Queue tests | Ordering, idempotency, status transitions |
| Execution tests | Feature flag, approval, quota, and rate limit gates |
| Audit tests | Required fields, redaction, immutable event chain |
| Retry tests | Error classification and dead-letter behavior |
| Health tests | Deterministic readiness scoring |
| Smoke tests | Public connector routes and readiness surfaces |
| Boundary tests | No execution inside Gamma OS core |
| Documentation tests | Certification artifacts exist and match status |

## Shared Release Process

Each connector release follows:

| Stage | Exit Criteria |
| --- | --- |
| Plan | Master plan entry, boundary doc, contract, scopes, risk register |
| Implement | Adapter, shared SDK bindings, previews, approval, queue, audit, health |
| Validate | Tests, smoke, boundary scan, deterministic checks |
| Certify | Certification doc, readiness score, operator runbook |
| Freeze | Connector release tag and immutable manifest |
| Handover | Operator handoff and next connector readiness |
| Next Phase | Begin next certified integration only after handover |

## Release Order

| Order | Connector | Rationale |
| ---: | --- | --- |
| 1 | Gmail | Certified reference implementation |
| 2 | Calendar | Highest reuse with Google OAuth and event workflows |
| 3 | Drive | Google OAuth reuse; file permissions need governed approval |
| 4 | GitHub | High-value operational integration with stronger policy boundaries |
| 5 | Slack | Message and channel workflow integration |
| 6 | Notion | Knowledge/database workflow integration |
| 7 | Microsoft 365 | Enterprise email/document integration |
| 8 | Discord | Community/channel workflow integration |
| 9 | Stripe | Financial action boundary and approval model |
| 10 | Salesforce | CRM governance and audit model |
| 11 | HubSpot | CRM and marketing workflow model |
| 12 | Dropbox | File storage integration model |
| 13 | OneDrive | Microsoft file storage model |
| 14 | SharePoint | Enterprise document collaboration model |

## Phase XV Acceptance Criteria

Phase XV is complete only when:

- Gmail is operationally certified for production.
- Calendar is certified as a production integration.
- Drive is certified as a production integration.
- GitHub is certified as a production integration.
- Shared connector SDK is documented and validated.
- Shared approval, queue, execution, audit, retry, health, observability, and test systems are documented and reused.
- Connector certification checklist is mandatory for every connector.
- Connector release process is repeatable.
- No connector execution is moved into Gamma OS core.
- Every certified connector has a freeze tag and handover.

## Decision Rules

Stop for architecture approval if any connector requires:

- New execution authority inside Gamma OS core.
- Production credential ownership by Gamma OS core.
- Connector writes without human approval.
- Undocumented persistence ownership.
- A bypass around queue, audit, retry, or certification.
- A different lifecycle than Plan -> Implement -> Validate -> Certify -> Freeze -> Handover -> Next Phase.

## Master Plan Statement

This document is the controlling blueprint for Phase XV - Production Integration Platform. Future connector work should extend this plan, not fork it. The platform should become faster because the connector lifecycle is consistent, not because certification is skipped.
