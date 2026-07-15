# Phase XV.B Milestone 0 — Calendar Preparation and Connector Reuse Analysis

## 1) Existing Gmail Reference Architecture (Authoritative Baseline)

The Gmail connector is the certified reference connector and remains the canonical implementation baseline for Calendar.

### Core Gmail architecture observed
- **Manifest and action contract**
  - `lib/connectors/gmail/manifest.ts`
  - Declares connector metadata, OAuth config, action schemas, risk and approval flags.
- **Connector entry points**
  - `lib/connectors/gmail/index.ts`
  - Exposes manifest, authenticator, executor, and types.
- **OAuth/auth**
  - `lib/connectors/gmail/authenticator.ts`
  - OAuth URL generation, code exchange, refresh, validate, revoke.
- **Execution surface**
  - `lib/connectors/gmail/executor.ts`
  - `generatePreview` and `execute` flows, action dispatch, parameter validation.
- **Preview**
  - `lib/connectors/gmail/preview-engine.ts`
  - Safe preview generation, HTML sanitization, warnings, expiration, audit summary.
- **Approval**
  - `lib/connectors/gmail/approval-engine.ts`
  - Approval decision workflow and queue eligibility.
- **Queue**
  - `lib/connectors/gmail/queue-engine.ts`
  - Queue lifecycle, scheduling, retry transition, metrics and health.
- **Retry resilience**
  - `lib/connectors/gmail/retry-orchestrator.ts`
  - Retryability classification and deterministic retry scheduling.
- **Dead-letter handling**
  - `lib/connectors/gmail/dead-letter-queue.ts`
  - DLQ storage, retriable/permanent separation, cleanup, health.
- **Idempotency**
  - `lib/connectors/gmail/idempotency.ts`
  - Key lifecycle and duplicate execution prevention.
- **Health hardening**
  - `lib/connectors/gmail/health-checker.ts`
  - Aggregated health from token/quota/scope/rate-limit and readiness signals.

### Governance boundary alignment
Gmail reflects required flow alignment:
**Preview → Validation → Human Approval → Queue → Execution → Receipt → Audit**  
No second connector architecture should be introduced for Calendar.

---

## 2) Reusable Shared Components for Calendar

Calendar must reuse the existing connector platform/governance path and only add domain-specific behavior where unavoidable.

### Reusable unchanged (candidate)
- Connector manifest schema model usage pattern.
- Connector entrypoint/barrel pattern (`index.ts` export style).
- OAuth abstraction shape (`BaseAuthenticator` extension pattern).
- Preview generation structure and safety checks pattern.
- Approval decision model and queue gating pattern.
- Queue lifecycle state model pattern.
- Retry policy orchestration pattern.
- Dead-letter queue lifecycle pattern.
- Idempotency key lifecycle.
- Aggregate health scoring model.

### Reuse through adapter
- Gmail action nomenclature and payload structures should not be copied directly; adapt to Calendar action domain.
- Existing preview/sanitization primitives can be wrapped for Calendar event summaries and attendee-safe rendering.
- Retry classification can be reused with Calendar API-specific mappings.

### Extend shared SDK
- Shared connector abstractions should be extended only where generally reusable across connectors:
  - canonical event mutation preview contracts (not Gmail-specific),
  - calendar-like scheduling risk metadata interfaces if reusable beyond Calendar.

### Wrap existing implementation
- Wrap existing queue/approval/retry/health utilities where needed to preserve governance pipeline without changing public interfaces.

### Calendar-specific
- Free/busy semantics, availability engine, conflict detection, recurring event interpretation, attendee policy logic, timezone normalization.

### Not applicable
- Gmail mailbox parsing and MIME-specific composition/reading internals.

---

## 3) Calendar-Specific Components (Required New Domain Logic)

- Calendar discovery (list calendars)
- Event read/list/search
- Free/busy lookup
- Availability engine
- Conflict detection
- Recurring event handling semantics
- Timezone handling/normalization
- Attendee management semantics
- Mutation previews:
  - create-event preview
  - update-event preview
  - delete/cancel preview

---

## 4) Connector Reuse Matrix

| Gmail Component Area | Classification | Calendar Plan |
|---|---|---|
| Manifest pattern (`manifest.ts`) | Reuse through adapter | Keep contract style; define Calendar actions/scopes/schema |
| Connector barrel (`index.ts`) | Reuse unchanged | Mirror export structure |
| OAuth authenticator (`authenticator.ts`) | Reuse through adapter | Same OAuth flow shape, Calendar scopes/endpoints |
| Executor dispatch (`executor.ts`) | Reuse through adapter | Preserve preview/execute split; map Calendar actions |
| Preview engine (`preview-engine.ts`) | Extend shared SDK | Generalize preview primitives for event operations |
| Approval engine (`approval-engine.ts`) | Reuse unchanged | Same approval gating behavior for mutating actions |
| Queue engine (`queue-engine.ts`) | Reuse unchanged | Same queue state machine and metrics/health |
| Retry orchestrator (`retry-orchestrator.ts`) | Reuse through adapter | Reuse deterministic scheduling; map Calendar failure classes |
| Dead-letter queue (`dead-letter-queue.ts`) | Reuse unchanged | Reuse DLQ handling and retention behavior |
| Idempotency manager (`idempotency.ts`) | Reuse unchanged | Reuse duplicate protection for event mutations |
| Health checker (`health-checker.ts`) | Reuse through adapter | Keep aggregate model, plug Calendar health signals |
| Gmail mailbox parsing | Calendar-specific | Not reused; replaced with Calendar event model |
| Gmail MIME/message composition | Calendar-specific | Not applicable to Calendar event model |

---

## 5) Gap Analysis (Calendar beyond Gmail)

### OAuth differences
- Gmail scopes differ from Calendar scopes; Calendar least-privilege scope set required.
- Scope validation logic needs Calendar scope catalog and risk tiers.

### Calendar API differences
- Resource model shifts from messages/drafts to calendars/events/freebusy.
- Pagination/query patterns differ; adapters required.

### Free/busy and availability
- New free/busy read action.
- Availability engine required (time-window computation across calendars).

### Conflict detection
- New deterministic overlap/conflict detection logic for event windows.

### Recurring events
- Must model recurrence rules and expansion strategy for preview/read/search.
- Must avoid non-deterministic expansion behavior.

### Timezone handling
- Normalize event datetime across TZ inputs and DST boundaries.

### Attendee management
- Validate attendee fields and policy/risk impacts (external attendees, domains).

### Permissions model
- Calendar-specific permission checks (read-only vs write scopes and action gating).

### Mutation previews
- Create/update/delete/cancel must generate explicit human-reviewable previews with side effects clearly stated.

### Controlled execution and receipts
- Use existing execution path but generate Calendar operation receipts and audit events.

### Retries/quota/health
- Calendar API failure classes and quota units differ; map into existing retry/quota/health frameworks.

---

## 6) Required Shared Refactors (Milestone-0 Proposed, No Public Interface Changes)

1. **Extract connector-agnostic preview primitives**
   - From Gmail preview engine into shared SDK module(s) where domain-neutral.
2. **Standardize mutation preview contract**
   - Shared contract for create/update/delete-like operations.
3. **Generalize error-classification mapping**
   - Keep retry orchestrator stable; add connector-specific mapping adapters.
4. **Generalize health aggregation inputs**
   - Keep health checker model stable; allow connector-specific signal adapters.

All refactors must preserve:
- governance path,
- public interfaces,
- deterministic behavior,
- no duplicate architecture.

---

## 7) Calendar Implementation Sequence (Post-Milestone 0)

1. Calendar manifest + action contracts + scopes
2. OAuth adapter (Calendar)
3. Read/discovery actions (calendars/events/search/freebusy)
4. Preview engine for create/update/delete/cancel
5. Approval gating integration for all mutating actions
6. Queue execution adapter for Calendar mutations
7. Receipt and audit event mapping
8. Retry and DLQ mapping for Calendar failure classes
9. Health/quota/scope/token integration
10. Certification evidence generation and reports

---

## 8) Governance Requirements (Non-Negotiable)

- All mutating operations must require explicit human approval.
- Simulation mode is default.
- Live execution requires operator approval and credentials.
- No bypass of governance policy engine.
- No autonomous publishing path.
- No second connector architecture.

---

## 9) Security Requirements

- Least-privilege scopes per action.
- Scope validation before execution.
- Token lifecycle health checks.
- No secret leakage in preview/audit/docs.
- Idempotency enforced for mutation operations.
- Explicit validation and sanitization of event payloads.

---

## 10) Testing Strategy (Milestone 0 + Later Implementation)

### Milestone 0 (planning-only validation)
- Architecture consistency review
- Connector dependency review
- Source-of-truth review
- Duplication scan
- Governance-path review
- Public-interface impact review

### Calendar implementation phases
- TypeScript and build checks
- Connector unit tests (read/mutation preview/approval/queue/execution/audit/retry/health)
- Integration tests (end-to-end governed flow)
- Determinism tests (retry, recurrence handling, conflict detection)
- Governance and boundary checks
- Smoke tests

---

## 11) Calendar Certification Checklist

- OAuth
- Read operations
- Mutation preview
- Approval
- Queue
- Execution
- Receipts
- Audit
- Retry
- Health
- Security
- Performance
- Documentation
- Operations
- Production readiness

---

## 12) Operational Readiness Checklist

- Operator runbook for Calendar connector
- Escalation playbook for token/scope/quota failures
- Retry/DLQ operational procedures
- Audit export and compliance review flow
- Health dashboard and alert thresholds
- Credential onboarding and rotation guidance
- Incident and rollback guidance

---

## 13) Risks and Mitigations

1. **Risk: Gmail code duplication**
   - Mitigation: extract only connector-agnostic behavior into shared modules.
2. **Risk: Governance bypass in mutation path**
   - Mitigation: enforce preview/approval/queue contracts at action routing layer.
3. **Risk: Recurrence/timezone non-determinism**
   - Mitigation: deterministic normalization rules and fixed test vectors.
4. **Risk: Public interface drift**
   - Mitigation: adapter-based extension without interface break.
5. **Risk: Scope over-provisioning**
   - Mitigation: strict scope validation and least-privilege matrix.

---

## 14) Known External Credential Requirements

- Google OAuth client credentials for Calendar scopes will be required for live execution stages.
- No credentials are required for Milestone 0 planning and analysis.
- No live external calls in Milestone 0.

---

## 15) Definition of Done (Milestone 0)

Milestone 0 is complete when:
1. Gmail reuse analysis is documented.
2. Connector reuse matrix is complete.
3. Calendar implementation plan is complete.
4. Gap analysis is complete.
5. Certification checklist is defined.
6. Architecture/dependency/source-of-truth/duplication/governance/interface reviews are completed.
7. No Calendar code implementation is performed in this milestone.
8. No public API changes, DB migrations, or new architecture introduced.

---

## Validation Summary (Milestone 0)

- **Architecture consistency review:** Pass (planned reuse of existing governed connector model).
- **Dependency review:** Pass (reuse existing connector framework; no new architecture dependency planned).
- **Source-of-truth review:** Pass (Gmail retained as canonical reference connector).
- **Duplication scan:** Pass with caution (risk identified; mitigation via selective generalization).
- **Governance-path review:** Pass (required chain preserved for mutating operations).
- **Public-interface impact review:** Pass (no required public interface changes identified at Milestone 0).
