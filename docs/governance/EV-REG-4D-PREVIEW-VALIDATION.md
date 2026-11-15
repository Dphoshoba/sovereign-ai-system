# Milestone 4D Preview validation package

Status: **Preview deployed; versioned activation approval required**. Deployment evidence is `docs/governance/EV-REG-PREVIEW-DEPLOYMENT.md`. This package does not authorise Production access or versioned scoring.

## Verified local state

Repository: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at deploy: `4865170405e178b4594f2090f0ff77911745e343`

| Milestone | Commit | Result |
|---|---|---|
| 3Y compatibility | `83bd39b4` | Versioned audits stay compatible with v14. |
| 3Z | `72617c6b` | Versioned identity and five evidence states. |
| 4A | `080a9cfe` | Dispute identity, checksums, and expiry. |
| 4B | `373ef405` | Versioned publication checks fail closed. |
| 4C | `675bb830` | Legacy publication JSON cannot authorise an article. |
| Preview build | `221a09f9` | Public Preview Supabase settings verified; local build finished. |
| Schema inspection | `758addfe` | Preview tables match Prisma; versioned columns were absent. |
| 3Y Preview migration | `5af9f287` / `1cc816a8` | Nullable `specificationVersion` and `disputes` added on Preview only. |

Adopted specification SHA-256 remains `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`.

Local verification already recorded for this HEAD:

- `tsc --noEmit` exited 0
- editorial suite: 99 files / 1,123 tests passed
- `npm run build` finished TypeScript and 656 static pages
- live Preview metadata rechecked after migration: both columns nullable, no defaults, RLS still enabled

## What stays inactive

`VERSIONED_EDITORIAL_VERIFIER_ENABLED` is false. `revisionWrittenByEditorialPrepare` always writes `article-grounded-v14`. Turning the flag on does not by itself switch scoring or the stored revision. Prepare for Review does not call `evaluateVersionedClaim` and does not persist `specificationVersion` or `disputes`.

## Preview database

Identity matches `src/lib/preview-postgres.ts` and project `emmzoeeaznhpwevqprkn`. Production project `kqptdgbttfuqkzxzbazw` is rejected. Evidence:

- `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`
- `docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md`

Tracked migrations still do not create `ArticleResearchAudit` or `ArticleReviewNote`. Do not run `prisma db push` or `prisma migrate deploy`.

## Activation sequence, after explicit approval

1. Deploy this branch to Preview only. Confirm the database URL remains the approved Preview target.
2. Keep existing audit rows untouched. A null `specificationVersion` remains a baseline audit.
3. In a separately approved change, switch Prepare for Review to `evaluateVersionedClaim` and write `EV-REG-SPEC-1.0.0`, an explicit `disputes` array, the zero-inclusive average, and `article-grounded-ev-reg-1`.
4. Leave baseline audits on the baseline gate. Fail closed when versioned metadata is incomplete.
5. Keep dispute resolution bound to its own id, checksums, and source-set fingerprint.
6. Keep `articlePublicationAuthorised` false on the legacy research response.
7. Keep approval, scheduling, and publication as separate human actions.
8. Do not re-audit, approve, schedule, or publish article `cmw0ln6wb000078ungn5f9lqk`.

## Rollback

Redeploy the previous application revision first. Leave the nullable Preview columns in place. Do not drop them as the first rollback.

## Human approvals still required

- Authorise the later change that turns on versioned scoring inside Prepare for Review.
- Any article audit, approval, scheduling, or publication remains a separate decision.
- Production remains out of scope.
