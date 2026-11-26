# EVDP Gate Decision — EVDP-004: Research Office Deployment

**Date:** 2026-07-20
**Authority:** Programme Director
**Decision:** APPROVED

## Scope

Deploy the Research Office as the second operational office on the shared AI Workforce Platform (EVDP-002). Four agents deployed:

| Agent | ID | Authority | Skills |
|---|---|---|---|
| Research Collection Agent | RES-COL-001 | Operational | 3 |
| Evidence Synthesizer Agent | RES-SYNTH-001 | Advisory | 4 |
| Research Reuse Agent | RES-REUSE-001 | Advisory | 3 |
| Research Quality Agent | RES-QUAL-001 | Advisory | 3 |

## Governance Policies Enforced

| Policy | Rule | Effect |
|---|---|---|
| RES-POL-001 | R-001 — Source verification required | Deny unverified entries |
| RES-POL-002 | R-002 — Reuse notifications advisory only | Deny auto-action |
| RES-POL-003 | R-003 — Outdated research needs review | Require approval |
| RES-POL-004 | R-004 — Low confidence excluded from synthesis | Deny < 0.5 confidence |

## Evidence

- 4 agent identities registered and onboarded
- 9 research skills registered and assigned
- 10 collaboration rules defining human involvement
- 4 workforce policies enforcing research governance
- 25 tests passing

## Baseline

- Gamma OS: 1209 tests, 45 files, 0 failures (unchanged)
- EVDP-001: 31 tests
- EVDP-002: 38 tests (WorkforcePlatform)
- EVDP-003: 25 tests (Executive Office)
- **Total: 1328 tests, 0 failures**

## Sign-off

This gate certifies that EVDP-004 is complete and the Research Office is fully operational on the AI Workforce Platform.
