# Release readiness — EV-REG-SPEC-1.0.0

Status: **Preview programme certified — not Production authorised**. Seal record: `docs/releases/EV-REG-1.0.0-PREVIEW-CERTIFIED.md`. Activation evidence remains `docs/governance/EV-REG-PREVIEW-ACTIVATION.md`. This report does not authorise Production enablement.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
Activation commit: `f6a648e8c565e86c26cff6f9308084b02626288c`  
Preview deployment: `dpl_8nTq8rdqjYnqEV9onrAukGpKiDxN`  
Specification SHA-256: `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`

## Verification

Docker daemon 29.9.2 responded before the editorial suite. `npx vitest run tests/editorial` passed 99 files and 1,123 tests. The editor-gate test uses a measured 420-second cap for the editor-pass case only.

`npx tsc --noEmit --pretty false --incremental false` exited 0.

`npm run build` completed with the verified Preview public Supabase settings in ignored `.env.local`. Next finished its TypeScript pass and generated 656 static pages. The generated `gamma/research/index.json` timestamp was restored.

## Section 14 fixtures

| Fixture | Result |
|---|---|
| T-SAME-ORG | Pass. One `publisher:microsoft`, partially supported, not publish-ready. |
| T-NARROW | Pass. The Gmail sentence is not counted. |
| T-RESOLVED | Pass. The resolved dispute stays visible and the claim is primary-source supported. |
| T-NEW-SPAN | Pass. The new span stays unresolved, score 0, method `disputed`. |
| T-JOINT | Pass. One `cisa.gov` identity. |
| T-JOINT-PLUS-SECOND-WORK | Pass. `cisa.gov` and `publisher:nist`. |
| T-TWO-WORKS | Pass. `business.gov.au` and `publisher:nist`. |

Baseline publication behaviour for an audit with no `specificationVersion` is unchanged. Thresholds remain consensus 80 and source quality 70. Prepare for Review writes `article-grounded-v14`.

## Implemented contract and remaining gaps

The versioned evaluator covers canonical registry identity, same-organisation collapse, the Power Platform alias, joint-document identity, actor agreement, the five evidence states, dispute binding, and fail-closed versioned metadata. Legacy publication JSON sets `articlePublicationAuthorised` to false, and the article guard rejects it.

Preview activation is live. These items remain incomplete or Production-blocked:

- Production must keep the versioned flag unset.
- Baseline `evidenceCorroborationKey`, `qualifyingPublicationSourceIdentity`, `independentDocumentKey`, and `factVerificationEngine` keep their current behaviour.
- The versioned evaluator does not yet implement the scripture, named-secondary-document, or ambiguous “according to” rows in section 6.3.
- A machine contradiction detector is not implemented. Human-recorded disputes are.

## Database identity

The ignored `.env.local` holds the Preview public Supabase pair and `DATABASE_URL`. Identity matches host `aws-0-ap-southeast-2.pooler.supabase.com`, port `5432`, database `postgres`, and username `postgres.emmzoeeaznhpwevqprkn`. Production project `kqptdgbttfuqkzxzbazw` is rejected.

Preview `ArticleResearchAudit` now has nullable `specificationVersion` text and `disputes` jsonb with no defaults. `ArticleReviewNote` is unchanged. Evidence:

- `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`
- `docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md`

Tracked migrations do not create either table. No Prisma migration was generated.

## Activation sequence, after approval

See `docs/governance/EV-REG-4D-PREVIEW-VALIDATION.md`. The Preview schema gate is closed. The remaining gate is explicit approval to deploy Preview and, separately, to turn on versioned scoring inside Prepare for Review.

## Rollback

Redeploy the previous application revision first. Leave the nullable Preview columns in place.

## Remaining risks

- The versioned scorer and the baseline scorer disagree on same-organisation hosts and title spoofing. Only the versioned scorer is safe to activate, and it is not on the Prepare for Review path.
- The editor-boundary test remains expensive under full-suite load. The measured editor-pass cap is 420 seconds.
- Production has not received the additive columns and must not be migrated from this worktree without a separate approval.

## Human approvals required

- Any article audit, approval, scheduling, or publication remains a separate decision.
- Production enablement remains out of scope.
