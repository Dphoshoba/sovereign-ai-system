# Gmail Operational Certification Remediation

Last updated: 2026-07-12

## Status

Gmail is the Phase XV reference connector for simulation, preview, approval, queue, audit, retry, health, and hardening patterns.

Gmail is not yet certified for live production sends.

Current classification: `IMPLEMENTED_SIMULATION_ONLY`

## Remediation Objective

Move Gmail from simulation-certified reference connector to operationally certified production integration while preserving the Stage 5 Constitution, boundaries, governance model, and explicit operator authority over real-world actions.

This remediation does not authorize live email sends.

## Boundary

Codex may continue to build, test, document, and validate Gmail connector capabilities. Codex must stop before:

- Sending a real email.
- Creating a real Gmail draft in a live account.
- Using Gmail credentials not explicitly supplied for that action.
- Enabling real execution in a shared or production environment.
- Changing Google Cloud OAuth configuration.
- Publishing or distributing production credentials.

## Current Evidence

| Surface | Evidence | Status |
| --- | --- | --- |
| Connector implementation | `lib/connectors/gmail/*` | Strong simulation and hardening implementation |
| Execution engine | `lib/connectors/gmail/execution-engine.ts` | Live execution path explicitly not implemented |
| Action set | `lib/connectors/gmail/action-set.ts` | Live execution path explicitly not implemented |
| API facade | `lib/connectors/gmail/gmail-api.ts` | Simulation/real mode boundary exists |
| OAuth | `lib/connectors/gmail/oauth-adapter.ts`, `lib/connectors/gmail/oauth-refresh.ts` | Implemented patterns, requires credential-backed verification |
| Routes | `app/api/connectors/gmail/*` | Status, OAuth, connections, hardening surfaces exist |
| Tests | `tests/connectors/gmail*.test.ts` | Broad connector tests exist |
| Truth audit | `docs/platform/GAMMA_2_ROADMAP_TRUTH_AUDIT.md` | Gmail classified as simulation-only |

## Required Remediation Work

| Work item | Acceptance criteria | Live action required? |
| --- | --- | --- |
| Correct certification language | Master plan and connector spec distinguish simulation certification from live production certification | NO |
| Operator runbook | Approve, reject, retry, revoke, rollback, incident, and evidence workflows documented | NO |
| Live execution gap inventory | All `not yet implemented` live execution paths are listed and tracked | NO |
| Credential readiness checklist | OAuth client, scopes, redirect URI, secret storage, revocation, and rotation checks documented | NO |
| Production smoke plan | Health, scopes, quota, rate limit, approval, queue, and audit routes defined for future credential-backed validation | NO |
| Certification guard test | Tests prevent future docs from claiming live production readiness prematurely | NO |
| Live execution implementation | Real Gmail draft/send execution implemented behind approval, queue, audit, idempotency, quota, and feature flag gates | YES, before verification only |
| Live verification | Operator-approved credential-backed validation with test account only | YES |
| Final Gmail certificate | Immutable release certificate and tag after live verification | NO, after approved evidence |

## Live Execution Gaps

| File | Current behavior | Required before live certification |
| --- | --- | --- |
| `lib/connectors/gmail/execution-engine.ts` | Real mode returns `Real Gmail execution not yet implemented (Build 136)` | Implement adapter-controlled execution or draft creation with audit receipt |
| `lib/connectors/gmail/action-set.ts` | Real mode throws `GmailActionSet.execute: real execution not yet implemented (Build 141)` | Route approved actions to the controlled executor |
| `lib/connectors/gmail/executor.ts` | Legacy mock ids are still used in simulated send/draft paths | Normalize deterministic id generation where production determinism requires it |
| `docs/phase-xv/GMAIL_CONNECTOR_V1.md` | Historical language overstated production readiness | Corrected to simulation-certified and operational activation pending |
| `docs/platform/PHASE_XV_PRODUCTION_CONNECTORS_MASTER_PLAN.md` | Historical language overstated Gmail certification position | Corrected to simulation-certified and operational certification pending |

## Production Activation Checklist

| Check | Required status before live send |
| --- | --- |
| Operator explicitly approves live Gmail validation | Required |
| Dedicated test Gmail account supplied | Required |
| OAuth client id and secret supplied through approved secret channel | Required |
| Redirect URI verified against deployment origin | Required |
| `ENABLE_REAL_EXECUTION` remains disabled by default | Required |
| Real execution can only occur after approval receipt | Required |
| Queue id and idempotency key are recorded | Required |
| Quota and rate-limit checks pass | Required |
| Audit receipt is generated and exportable | Required |
| Token revocation and connector disablement are documented | Required |
| No production user mailbox is used for certification | Required |

## Production Smoke Plan

Future credential-backed smoke must cover:

- `GET /api/connectors/gmail/status`
- `GET /api/connectors/gmail/hardening/status`
- `GET /api/connectors/gmail/hardening/health`
- `GET /api/connectors/gmail/hardening/scopes`
- `GET /api/connectors/gmail/hardening/quota`
- `GET /api/connectors/gmail/hardening/rate-limit`
- OAuth authorize and callback dry-run where possible.
- Connection list and revoke flow using a dedicated test account.
- Preview-only draft package with no send.
- Approved test-account-only live draft/send only after explicit operator approval.

## Remediation Decision

No architecture decision is required for documentation, tests, and simulation-safe implementation work.

Explicit operator approval and supplied credentials are required before any live Gmail action.
