# EVDP Gate Decision — EVDP-006: Operations Office Deployment

**Date:** 2026-07-20
**Authority:** Programme Director
**Decision:** APPROVED

## Scope

Deploy the Operations Office as the fourth operational office on the shared AI Workforce Platform (EVDP-002). Five agents deployed:

| Agent | ID | Authority | Skills |
|---|---|---|---|
| Review Coordinator Agent | OPS-REV-001 | Operational | 3 |
| Project Tracker Agent | OPS-PROJ-001 | Operational | 3 |
| Documentation Agent | OPS-DOC-001 | Advisory | 2 |
| Deployment Readiness Agent | OPS-DEPLOY-001 | Advisory | 3 |
| Compliance Monitor Agent | OPS-COMP-001 | Advisory | 3 |

## Governance Policies Enforced

| Policy | Rule | Effect |
|---|---|---|
| OPS-POL-001 | O-001 — Reviews require defined cadence | Deny no cadence |
| OPS-POL-002 | O-002 — At-risk projects auto-escalate | Require approval for 2+ weeks behind |
| OPS-POL-003 | O-003 — Deployment requires all gates passed | Deny incomplete gates |
| OPS-POL-004 | O-004 — Violations acknowledged within 7 days | Require approval if overdue |
| OPS-POL-005 | O-005 — Documentation refreshed within 90 days | Deny stale content |

## Integration with Existing Offices

- **Executive Office** — operational metrics feed back into executive decision-making
- **Research Office** — procedures informed by research evidence
- **Product Office** — deployment readiness gates align with product release planning
- **Gamma OS** — Workflow Orchestration, Federated Observability, Governance Gate, Policy Engine

## Evidence

- 5 agent identities registered and onboarded
- 11 operations skills registered and assigned
- 12 collaboration rules defining human involvement
- 5 workforce policies enforcing operations governance
- 38 tests passing

## Baseline

- Gamma OS: 1209 tests, 45 files, 0 failures (unchanged)
- EVDP-001: 31 tests
- EVDP-002: 38 tests (WorkforcePlatform)
- EVDP-003: 25 tests (Executive Office)
- EVDP-004: 32 tests (Research Office)
- EVDP-005: 36 tests (Product Office)
- **Total: 1409 tests, 0 failures**

## Sign-off

This gate certifies that EVDP-006 is complete and the Operations Office is fully operational on the AI Workforce Platform.
