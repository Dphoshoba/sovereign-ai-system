# EV-REG-1.0.0 — Preview programme certification

**Verdict: PREVIEW CERTIFIED — NOT PRODUCTION AUTHORISED**

This record seals the Echoes & Visions research-governance Preview programme for EV-REG-SPEC-1.0.0. It does not authorise Production enablement, Production migration, real article Prepare for Review, editorial approval, scheduling, or publication.

## 1. Programme objectives and scope

Implement and activate the adopted versioned research verifier on the approved Preview environment only:

- Preserve baseline `article-grounded-v14` behaviour when the feature flag is unset.
- Activate versioned Prepare scoring when `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` on Preview.
- Keep publication thresholds unchanged (consensus 80, source quality 70).
- Keep human editorial approval separate from automated scoring.
- Isolate Production project `kqptdgbttfuqkzxzbazw` from all Preview schema and flag changes.

## 2. Adopted specification identity

| Field | Value |
|---|---|
| Specification | `docs/governance/EV-REG-SPEC-1.0.0.md` |
| SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |
| Worktree | `C:\Users\David\echoes-visions-preview-security` |
| Branch | `integrate/production-research-integrity` |
| Closure baseline HEAD (pre-seal) | `2b2348e86151079b8b2f87cb9bde9cc4918e88f3` |

Independently rechecked at closure: file SHA-256 matches the expected digest. Specification bytes were not modified by this closure milestone.

## 3. Milestone completion history

| Milestone | Commit(s) | Evidence |
|---|---|---|
| 3X characterisation / section 14 catalogue | catalogue under `tests/editorial/` | `EV-REG-SPEC-1.0.0-TEST-CATALOGUE.md` |
| Spec adoption | `2b79b94e` | `docs/governance/EV-REG-SPEC-1.0.0.md` |
| 3Y audit compatibility | `83bd39b4` | versioned audits remain compatible with v14 |
| 3Z identity + five evidence states | `72617c6b` | versioned evaluator |
| 4A dispute lifecycle | `080a9cfe` | dispute binding, checksums, expiry |
| 4B fail-closed publication metadata | `373ef405` | incomplete versioned audits block |
| 4C legacy publication isolation | `675bb830` | legacy JSON cannot authorise |
| 4D Preview validation package | `94357295` / `48651704` | `EV-REG-4D-PREVIEW-VALIDATION.md` |
| Preview public build | `221a09f9` | verified Preview Supabase public settings |
| 3Y schema inspection | `758addfe` | `EV-REG-3Y-SCHEMA-INSPECTION.md` |
| 3Y Preview additive migration | `5af9f287` / `1cc816a8` | `EV-REG-3Y-MIGRATION-EXECUTION.md` |
| Controlled Preview deploy (pre-activation) | `48651704` → deploy `dpl_AJuRTkkGfxQrSBTrr7bi3eqKMNiB` | `EV-REG-PREVIEW-DEPLOYMENT.md` |
| Versioned Prepare activation | `f6a648e8` → deploy `dpl_8nTq8rdqjYnqEV9onrAukGpKiDxN` | `EV-REG-PREVIEW-ACTIVATION.md` |
| Activation documentation | `2b2348e8` | release readiness + skill update |

Earlier milestone documents retain their contemporaneous status language. Later activation evidence supersedes statements that versioned scoring was still inactive.

## 4. Code and documentation commits

| Role | Commit |
|---|---|
| Activation implementation | `f6a648e8c565e86c26cff6f9308084b02626288c` |
| Activation documentation | `2b2348e86151079b8b2f87cb9bde9cc4918e88f3` |
| Programme closure (this record) | recorded by annotated tag `ev-reg-1.0.0-preview-certified` |

## 5. Preview deployment identity

| Field | Value |
|---|---|
| Vercel project | `sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`) |
| Activation deployment | `dpl_8nTq8rdqjYnqEV9onrAukGpKiDxN` |
| Environment | `preview` |
| Preview URL | `https://sovereign-ai-executive-leq0h8dn8-davidoshoba-3659s-projects.vercel.app` |
| Flag | `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` on Preview only |
| Runtime health (documented) | `versionedEditorialVerifierEnabled: true`, `researchAuditEngineRevision: article-grounded-ev-reg-1` |

Production aliases for `www.echoesandvisions.com` / `echoesandvisions.com` remained on prior Production deployment `cvw9iwkxn` at activation verification. This closure milestone did not redeploy.

## 6. Database schema changes

Executed on Preview Supabase project `emmzoeeaznhpwevqprkn` only:

```sql
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
```

Both columns are nullable with no defaults. No Prisma migration was added to tracked history. Production was not migrated. This closure milestone did not connect to or alter any database.

## 7. Verification and regression results

### Documented evidence (activation milestone)

- Editorial suite: 100 files / 1,127 tests passed
- `tsc --noEmit` exited 0
- Local `npm run build` exited 0 (656 static pages)
- Preview `/api/health` via `vercel curl` reported the versioned flag and revision
- Preview `/api/articles` returned 401 `AUTHENTICATION_REQUIRED`
- Production `/api/health` returned 200
- Flag listed only under Preview in `vercel env ls`
- No Prepare for Review, approval, schedule, or publish on the governing article

Earlier readiness records cite 99 files / 1,123 tests before the activation test additions. The activation suite count is authoritative for the certified Preview baseline.

### Independently rechecked at closure

- Working tree clean at `2b2348e8` before seal
- Spec SHA-256 matches expected digest
- No existing tag `ev-reg-1.0.0-preview-certified`
- Ignored `.env.local` contains Preview ref `emmzoeeaznhpwevqprkn`; Production ref absent
- Compile-time constant `VERSIONED_EDITORIAL_VERIFIER_ENABLED` remains `false`; runtime gate uses env `=== "true"`
- Targeted EV-REG editorial regressions: 7 files / 54 tests passed (`ev-reg-spec-1.0.0-*.test.ts`)
- Documentation paths limited to the certification record, skill handoff, and two governance status pointers; no specification, schema, or application-code edits in the seal commit

### Explicitly not claimed

Real article audits, Prepare for Review against live content, editorial approvals, scheduling, and publication were **not** executed under this programme. Certification covers deterministic tests, Preview runtime health/auth probes, and documented activation evidence only.

## 8. Security and publication safeguards

- Versioned path uses host-registry identity, same-organisation collapse, five evidence states, independent corroboration, single-source restriction, dispute precedence, zero-inclusive average, and fail-closed versioned metadata.
- Legacy research publication-gate JSON continues to set `articlePublicationAuthorised` to false and cannot authorise an article.
- Human editorial approval remains mandatory and separate.
- Runtime Preview DB guard rejects non-approved Preview database URLs.
- Production must keep the versioned flag unset.

## 9. Known limitations and residual risks

- Machine contradiction detection is absent; Prepare persists `disputes: []` until human-recorded disputes exist.
- Scripture, named-secondary-document, and ambiguous “according to” section 6.3 rows remain outside the versioned evaluator.
- Baseline identity helpers are intentionally unchanged and disagree with the versioned scorer on same-organisation hosts and title spoofing.
- CLI Preview deploys may lack GitHub commit metadata; local HEAD at deploy time is the source of truth.
- Editor-boundary test under full-suite load uses a measured 420-second cap; do not raise it without a new measurement.

## 10. Rollback procedure

1. Set Preview `VERSIONED_EDITORIAL_VERIFIER_ENABLED` away from `true` (or remove it).
2. Redeploy the previous verified Preview application revision if required.
3. Leave nullable `specificationVersion` and `disputes` columns in place.
4. Do not delete historical audits.
5. Do not alter Production aliases or Production env as part of Preview rollback.

## 11. Explicitly excluded Production activities

Not authorised by this certification:

- Enabling `VERSIONED_EDITORIAL_VERIFIER_ENABLED` on Production
- Deploying this programme to Production
- Migrating Production databases
- Pushing commits or tags to remote
- Re-auditing, approving, scheduling, or publishing any article, including the governing article
- Changing publication thresholds or amending the adopted specification

## 12. Final certification verdict

**PREVIEW CERTIFIED — NOT PRODUCTION AUTHORISED**

The EV-REG-1.0.0 Preview implementation programme is closed. Future work requires a separately scoped human-authorised programme.
