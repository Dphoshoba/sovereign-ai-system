# Calendar Stage 2 TODO

## Stage 2A
- [x] Commit deterministic mutation preview layer (`f14c6ed`)

## Stage 2B — Governance Layer
- [ ] Review existing Calendar mutation preview types and outputs
- [ ] Implement `mutation-risk-classifier.ts`
- [ ] Implement `mutation-policy-adapter.ts`
- [ ] Implement `mutation-governance.ts`
- [ ] Implement `mutation-approval.ts`
- [ ] Implement `mutation-preview-receipt.ts`
- [ ] Implement `mutation-preview-audit.ts`
- [ ] Wire exports in `lib/connectors/calendar/index.ts` (if required)
- [ ] Add focused Stage 2B tests
- [ ] Run focused Stage 2B tests and fix defects
- [ ] Run focused Stage 2B security scan and remediate findings
- [ ] Commit/push Stage 2B (`feat(calendar): add governed mutation approval preparation`)

## Stage 2C — Queue Preparation
- [ ] Implement `mutation-queue-types.ts`
- [ ] Implement `mutation-idempotency.ts`
- [ ] Implement `mutation-execution-intent.ts`
- [ ] Implement `mutation-retry-metadata.ts`
- [ ] Implement `mutation-audit.ts`
- [ ] Implement `mutation-receipt.ts`
- [ ] Implement `mutation-queue-preparer.ts`
- [ ] Wire exports in `lib/connectors/calendar/index.ts` (if required)
- [ ] Add focused Stage 2C tests
- [ ] Run focused Stage 2C tests and fix defects
- [ ] Run focused Stage 2C security scan and remediate findings
- [ ] Commit/push Stage 2C (`feat(calendar): add deterministic mutation queue preparation`)

## Docs & Certification
- [ ] Update `docs/phase-xv/CALENDAR_CERTIFICATION_PROGRESS.md`
- [ ] Create `docs/phase-xv/CALENDAR_STAGE2_CERTIFICATION_REPORT.md`
- [ ] Create `docs/phase-xv/CONNECTOR_CERTIFICATION_TEMPLATE.md` if missing
- [ ] Commit/push certification docs (`cert(calendar): certify governed mutation preparation`)

## Final Stage 2 Gates (single run)
- [ ] `npx tsc --noEmit --pretty false`
- [ ] `npm test -- tests/connectors/calendar`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run test:determinism`
- [ ] `npm run smoke:v1` (if routes changed)
- [ ] Governance scan
- [ ] Mutation scan
- [ ] Boundary scan
- [ ] No-live-execution scan
- [ ] Autonomous-approval scan
- [ ] Queue-execution scan
- [ ] Secret scan
- [ ] Public-interface review
- [ ] Connector-registration review
- [ ] Capability-registry review

## Release
- [ ] Create tag `gamma-calendar-stage2-governed-mutations` after all gates pass
