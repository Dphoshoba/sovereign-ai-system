# Google Drive Stage 1 TODO

## Stage 1 — Governed Read-Only Foundation
- [ ] Implement OAuth `exchangeCode` and `refreshToken` logic
- [ ] Implement `drive_read` action logic (list/search/metadata)
- [ ] Expand `ResourceParser` to include versions, permissions, and quota
- [ ] Implement Drive discovery and folder browsing
- [ ] Implement a deterministic `DriveReader` implementation
- [ ] Add comprehensive read-only test suite
- [ ] Run production-readiness scanning
- [ ] Run boundary and security scans
- [ ] Commit Stage 1 (`feat(drive): add governed read-only foundation`)
- [ ] Certify Stage 1 (`gamma-drive-stage1-read-only`)

## Stage 2 — Governed Mutation Preparation
- [ ] **Stage 2A: Deterministic Mutation Previews**
  - [ ] Implement `mutation-preview.ts`
  - [ ] Implement previews for upload, create-folder, rename, move, trash, restore, permissions
  - [ ] Verify determinism and `previewOnly: true`
- [ ] **Stage 2B: Governance and Approval Preparation**
  - [ ] Implement `mutation-governance.ts`
  - [ ] Implement `mutation-approval.ts`
  - [ ] Implement `mutation-preview-receipt.ts` and `mutation-preview-audit.ts`
- [ ] **Stage 2C: Queue Preparation**
  - [ ] Implement `mutation-queue-prep.ts`
  - [ ] Implement deterministic idempotency and priority mapping
  - [ ] Verify zero-execution guardrails
- [ ] **Stage 2 Final Gates**
  - [ ] `npx tsc --noEmit --pretty false`
  - [ ] `npm test -- tests/connectors/drive`
  - [ ] `npm test`
  - [ ] `npm run build`
  - [ ] `npm run test:determinism`
  - [ ] All security and governance scans
  - [ ] Commit and tag `gamma-drive-stage2-governed-mutations`

## Stage 3 — Controlled Execution
- [ ] **BLOCKED PENDING EXPLICIT APPROVAL**
