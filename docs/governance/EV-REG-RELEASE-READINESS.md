# Release readiness — EV-REG-SPEC-1.0.0

Status: **Preview activation blocked**. This report does not authorise deployment, a database connection, or a migration.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at verification: `95d7635a84b961a303d5b83ff09e25758f262403`  
Specification SHA-256: `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`

## Verification

Docker daemon 29.9.2 responded before the editorial suite. `npx vitest run tests/editorial` finished with 98 files passed and 1 failed: `api-editor-boundary.test.ts` exceeded its existing 300-second limit while the suite was loaded. The same file then passed 6 tests in isolation in 341.01 seconds. The suite result was 1,122 passed and 1 timed out, of 1,123. The timeout was not raised.

`npx tsc --noEmit --pretty false --incremental false` exited 0.

`npm run build` compiled and finished its own TypeScript pass. Static generation then stopped on `/forgot-password` because the public Supabase URL and API key are unset in this worktree. No Production credential was added. The build rewrote the tracked `gamma/research/index.json` timestamp; that generated change was restored and is not part of the release commit.

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

These items are not activated:

- Prepare for Review does not call `evaluateVersionedClaim`.
- `revisionWrittenByEditorialPrepare` always returns `article-grounded-v14`.
- Baseline `evidenceCorroborationKey`, `qualifyingPublicationSourceIdentity`, `independentDocumentKey`, and `factVerificationEngine` keep their current behaviour.
- The versioned evaluator does not yet implement the scripture, named-secondary-document, or ambiguous “according to” rows in section 6.3. Those rows are outside the seven section 14 fixtures.
- A machine contradiction detector is not implemented. Human-recorded disputes are. The specification allows the detector to come later.
- The Prisma model has `averageVerificationScore` as a required integer with default 0. It has no `specificationVersion` or `disputes` field. The versioned average, including zero scores, exists only in memory.

## Database identity

This worktree has no `.env` file. `DATABASE_URL`, `DIRECT_URL`, `PRISMA_DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `SUPABASE_URL` are unset. No connection was opened.

The code names an approved Preview pooler host, port 5432, database `postgres`, and username `postgres.emmzoeeaznhpwevqprkn`. A name in source is not a configured database. Vercel Preview variables were not read. Any URL containing Supabase project `kqptdgbttfuqkzxzbazw` is rejected.

Tracked migrations do not create `ArticleResearchAudit` or `ArticleReviewNote`. The conditional plan remains `docs/governance/EV-REG-3Y-CONDITIONAL-MIGRATION-PLAN.md`. No migration file was generated.

## Operator setup required before any connection

1. Supply a database URL only through an untracked local environment or a confirmed Vercel Preview setting. Do not paste it into chat or commit it.
2. The URL must match the approved Preview host, port, database, and username above, and must not contain `kqptdgbttfuqkzxzbazw`.
3. The first authorised use is metadata only: whether `ArticleResearchAudit` exists and which columns it has.
4. If the table is absent, stop. Do not create it from the Prisma model or from historical migrations.
5. If the table exists and `specificationVersion` and `disputes` are absent, a separate approval is required before adding those two nullable columns with no default, backfill, or rewrite.
6. Also supply the public Supabase URL and publishable key if a complete local production build is required. Those values were absent, and the build stopped before finishing static pages.

## Activation sequence, after those approvals

1. Add the two nullable columns only on the verified non-Production table.
2. Keep existing rows untouched. A null `specificationVersion` remains a baseline audit.
3. Deploy the application revision that still writes `article-grounded-v14` before any later scoring change.
4. Switch Prepare for Review to `evaluateVersionedClaim` only in a later change that also writes `EV-REG-SPEC-1.0.0`, an explicit `disputes` array, the zero-inclusive average, and `article-grounded-ev-reg-1`.
5. The publication guard already fails closed when a versioned audit omits that metadata. Leave baseline audits on the baseline gate.
6. Keep dispute resolution bound to its own id, checksums, and source-set fingerprint.
7. Keep `articlePublicationAuthorised` false on the legacy research response.
8. Keep approval, scheduling, and publication as separate human actions.
9. Do not re-audit, approve, schedule, or publish article `cmw0ln6wb000078ungn5f9lqk`.

## Rollback

Redeploy the previous application revision. No database rollback is required while the columns are absent. If the nullable columns are later added, leave them in place and roll the code back first.

## Remaining risks

- The versioned scorer and the baseline scorer disagree on same-organisation hosts and title spoofing. Only the versioned scorer is safe to activate, and it is not on the Prepare for Review path.
- The editor-boundary test sits close to its 300-second limit and can fail when the suite is under load.
- A local production build cannot finish prerender without the public Supabase settings.
- The live audit table is still unverified.

## Human approvals required

- Provide and confirm the non-Production database identity.
- Authorise the additive migration after metadata inspection.
- Authorise Preview deployment.
- Authorise a later change that turns on versioned scoring inside Prepare for Review.
- Any article audit, approval, scheduling, or publication remains a separate decision.
