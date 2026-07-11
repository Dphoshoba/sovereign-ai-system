# Gamma 2.0 Phase XV - Production Connectors

## Objective
Phase XV safely connects Gamma to real-world systems without allowing connectors to bypass governance.

This phase begins after:

- Gamma OS Foundation v1.1
- Stage 5 Runtime State Machine
- Gmail Connector v1.0 certification

Strategic source:

- `docs/platform/GAMMA_2_MASTER_ROADMAP.md`

## Production Connector Contract
Every production connector must support:

1. OAuth
2. Capabilities
3. Preview
4. Approval
5. Queue
6. Audit
7. Retry
8. Certification
9. Health
10. Metrics

Canonical code contract:

- `src/lib/gamma-2/production-connectors.ts`

Validation:

- `tests/gamma-2/production-connectors.test.ts`

## Priority Queue
Phase XV connector priority order:

1. Gmail
2. Calendar
3. Drive
4. GitHub
5. Slack
6. Notion
7. Microsoft 365
8. Discord
9. Stripe
10. Salesforce
11. HubSpot
12. Dropbox
13. OneDrive
14. SharePoint

## Current Position
Gmail is the certified reference connector.

Batch 1 production readiness coverage is complete for:

- Gmail
- Calendar
- Drive
- GitHub
- Slack

Notion is the next connector in the Phase XV priority queue.

## Gamma Factory Rule
Every connector after Gmail should be generated through Gamma Factory by default.

Manual implementation is allowed only as an explicit exception with a documented reason.

## Governance Rule
No connector owns the workflow.

Gamma owns the mission, governance, orchestration plan, runtime projection, approval checkpoints, and audit route. Connectors provide capabilities behind governed boundaries.
