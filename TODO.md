# TODO - Gmail Connector Completion Sprint (Build 138-140)

## Build 138 — Gmail Compliance Audit Framework
- [ ] Inspect existing connector runtime/audit infrastructure (Build 137) for integration points.
- [ ] Implement connector-agnostic compliance model types + mock data.
- [ ] Implement Gmail compliance mapper + integrity checks.
- [ ] Implement audit exporter for safe/secret-free export.
- [ ] Implement gamma reader for compliance dashboard.
- [ ] Add Next.js pages:
  - [x] app/gmail-compliance/page.tsx
  - [x] app/gmail-compliance/[id]/page.tsx
- [x] Add unit tests (40+): tests/connectors/gmail-compliance.test.ts
- [ ] Write docs: docs/phase-xv/BUILD138.md


## Build 139 — Gmail Connector Hardening
- [ ] Implement connector-agnostic hardening types + mock data.
- [ ] Implement Gmail hardening modules: rate limit, quota, token health, scope validation, outage health-checker.
- [ ] Implement gamma reader + Next.js pages:
  - [ ] app/gmail-hardening/page.tsx
  - [ ] app/gmail-hardening/[id]/page.tsx
- [ ] Add unit tests (40+): tests/connectors/gmail-hardening.test.ts
- [ ] Write docs: docs/phase-xv/BUILD139.md

## Build 140 — Gmail Connector v1.0 Certification
- [ ] Implement certification types + mock data.
- [ ] Implement certification runner, reference connector report, and checklist.
- [ ] Implement gamma reader + Next.js pages:
  - [ ] app/gmail-certification/page.tsx
  - [ ] app/gmail-certification/[id]/page.tsx
- [ ] Add unit tests (40+): tests/connectors/gmail-certification.test.ts
- [ ] Write docs:
  - [ ] docs/phase-xv/BUILD140.md
  - [ ] docs/phase-xv/GMAIL_CONNECTOR_V1.md
  - [ ] docs/phase-xv/CONNECTOR_REFERENCE_ARCHITECTURE.md

## Final Verification
- [ ] Run: npm run build
- [ ] Run: npm test
- [ ] Run: npm run test:determinism
- [ ] Run: npm run smoke:v1
- [ ] Create tag + push frozen branch
- [ ] Provide final metrics + commit hashes + test counts + smoke results + hydration warnings.

