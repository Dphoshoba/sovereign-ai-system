# TODO - Gamma 2.0 Phase XV Production Connectors

## Phase XV Readiness Gate
- [x] Add Gamma 2.0 master roadmap: `docs/platform/GAMMA_2_MASTER_ROADMAP.md`
- [x] Add Stage 5 Runtime State Machine
- [x] Add Phase XV production connector contract
- [x] Verify Gmail connector Build 138-140 tests
- [x] Harden Calendar against the Phase XV production connector contract
- [x] Harden Drive against the Phase XV production connector contract
- [x] Harden GitHub against the Phase XV production connector contract
- [x] Harden Slack against the Phase XV production connector contract
- [x] Harden Notion against the Phase XV production connector contract
- [x] Harden Microsoft 365 against the Phase XV production connector contract
- [ ] Harden Discord against the Phase XV production connector contract
- [ ] Harden Stripe against the Phase XV production connector contract
- [ ] Harden Salesforce against the Phase XV production connector contract
- [ ] Harden HubSpot against the Phase XV production connector contract
- [ ] Harden Dropbox against the Phase XV production connector contract
- [ ] Harden OneDrive against the Phase XV production connector contract
- [ ] Harden SharePoint against the Phase XV production connector contract

## Build 138 - Gmail Compliance Audit Framework
- [x] Inspect existing connector runtime/audit infrastructure (Build 137) for integration points.
- [x] Implement connector-agnostic compliance model types + mock data.
- [x] Implement Gmail compliance mapper + integrity checks.
- [x] Implement audit exporter for safe/secret-free export.
- [x] Implement gamma reader for compliance dashboard.
- [x] Add Next.js pages:
  - [x] `app/gmail-compliance/page.tsx`
  - [x] `app/gmail-compliance/[id]/page.tsx`
- [x] Add unit tests: `tests/connectors/gmail-compliance.test.ts`
- [x] Write docs: `docs/phase-xv/BUILD138.md`

## Build 139 - Gmail Connector Hardening
- [x] Implement connector-agnostic hardening types + mock data.
- [x] Implement Gmail hardening modules: rate limit, quota, token health, scope validation, outage health-checker.
- [x] Implement gamma reader + Next.js pages:
  - [x] `app/gmail-hardening/page.tsx`
  - [x] `app/gmail-hardening/[id]/page.tsx`
- [x] Add unit tests: `tests/connectors/gmail-hardening.test.ts`
- [x] Write docs: `docs/phase-xv/BUILD139.md`

## Build 140 - Gmail Connector v1.0 Certification
- [x] Implement certification types + mock data.
- [x] Implement certification runner, reference connector report, and checklist.
- [x] Implement gamma reader + Next.js pages:
  - [x] `app/gmail-certification/page.tsx`
  - [x] `app/gmail-certification/[id]/page.tsx`
- [x] Add unit tests: `tests/connectors/gmail-certification.test.ts`
- [x] Write docs:
  - [x] `docs/phase-xv/BUILD140.md`
  - [x] `docs/phase-xv/GMAIL_CONNECTOR_V1.md`
  - [x] `docs/phase-xv/CONNECTOR_REFERENCE_ARCHITECTURE.md`

## Phase XVIII - Gamma Studio
- [ ] Milestone 1 - Visual Workflow Canvas
  - [ ] Create `app/gamma-studio/page.tsx`
  - [ ] Create components:
    - [ ] `app/gamma-studio/components/Canvas.tsx`
    - [ ] `app/gamma-studio/components/Toolbox.tsx`
    - [ ] `app/gamma-studio/components/Inspector.tsx`
    - [ ] `app/gamma-studio/components/NodeCard.tsx`
    - [ ] `app/gamma-studio/components/EdgeRenderer.tsx`
  - [ ] Support drag/drop node placement (Gmail, Slack, Calendar, Approval)
  - [ ] Support node connections and save action
- [ ] Milestone 2 - Connector Palette (dynamic registration)
- [ ] Milestone 3 - Workflow Inspector details
- [ ] Milestone 4 - Live Validation rules and save-blocking
- [ ] Milestone 5 - Visual Simulator (preview-only run)
- [ ] Milestone 6 - Execution Timeline visualization
- [ ] Milestone 7 - Marketplace templates install UI
- [ ] Milestone 8 - AI Builder prompt-to-workflow generation (mock)
- [ ] Milestone 9 - Multi-user collaboration UI (placeholder)
- [ ] Milestone 10 - Gamma Studio v1.0 shell navigation sections

## Final Verification
- [ ] Run: `npm run build`
- [ ] Run: `npm test`
- [ ] Run: `npm run test:determinism`
- [ ] Run: `npm run smoke:v1`
- [ ] Create tag + push frozen branch
- [ ] Provide final metrics + commit hashes + test counts + smoke results + hydration warnings.
