# EV-REG Production P4A — Verifier Activation Readiness Assessment

Status: **VERIFIED — ACTIVATION APPROVAL REQUIRED**  
Does **not** authorise enabling the Production flag, redeploy for activation, article Prepare, scheduling, publication, DDL, push, or retagging.  
Next gate after this document: **P4B — Production flag enablement** (separate human approval).

**Supersedes:** nothing prior under this exact filename; continues after `EV-REG-PRODUCTION-P3-DEPLOYMENT-EXECUTION.md` (P3 complete, flag still unset).  
**Linked from:** `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.  
**User instruction (verbatim):** “Create: docs/governance/EV-REG-PRODUCTION-P4-ACTIVATION-READINESS.md” / “Do not activate the verifier during P4A” / “Commit documentation locally only. Do not push.” / “Stop after P4A.”

## 1. Current Production state (reconfirmed)

| Check | Result |
|---|---|
| Vercel project | `sovereign-ai-executive` |
| Production deployment | `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` |
| Deployment URL | `sovereign-ai-executive-a9547ntdn-davidoshoba-3659s-projects.vercel.app` |
| Ready state | **READY** |
| Application SHA | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` (Vercel API `meta.gitCommitSha`) |
| Target | `production` |
| Production aliases on this deployment | `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app`, `sovereign-ai-executive-davidoshoba-3659s-projects.vercel.app` |
| `GET /api/health` (www + vercel.app) | `200` `{"ok":true,"versionedEditorialVerifierEnabled":false,"researchAuditEngineRevision":"article-grounded-v14"}` |
| `GET /api/articles` | `401` |
| `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | **Absent from Production** (Preview only; Production env list has no `VERSIONED*` entry) |
| Current verifier in use | `article-grounded-v14` |
| Expected post-activation verifier | `article-grounded-ev-reg-1` |
| Production Supabase project | `kqptdgbttfuqkzxzbazw` |
| P2 columns | Present — `specificationVersion` (`text`, nullable), `disputes` (`jsonb`, nullable) |
| Unexpected DB change | **None observed** — `BEGIN READ ONLY` / `transaction_read_only=on`; 107 audit rows; **0** rows with non-null `specificationVersion` or `disputes` |
| Prior rollback deployment (unused) | `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125afda7399bb23874d840e03abb5ff0b11` |

P4A performed **no** Production env changes, deployments, DDL, or article operations.

## 2. Activation impact analysis

### Call sites of `VERSIONED_EDITORIAL_VERIFIER_ENABLED`

| Location | Role when flag becomes `true` |
|---|---|
| `lib/research/versioned-publication.ts` | `isVersionedEditorialVerifierEnabled()` is true only when env `=== "true"`; `revisionWrittenByEditorialPrepare()` returns `article-grounded-ev-reg-1` |
| `lib/research/prepare-article-for-review.ts` | On an authorised Prepare run: switches claim verification to `versionedFactVerification`, writes `engineRevision` from the helper, and optionally persists `specificationVersion` / `disputes` on the **new** audit row |
| `app/api/health/route.ts` | Reports non-secret boolean + Prepare revision string only (no writes) |
| Tests under `tests/editorial/ev-reg-spec-1.0.0-*.test.ts` | Characterisation only |

Compile-time constant `VERSIONED_EDITORIAL_VERIFIER_ENABLED` remains `false`. Runtime gate is env-only.

### Can enabling the flag alone…?

| Risk | Assessment |
|---|---|
| Trigger background processing | **No.** Cron (`/api/cron/run-pipeline`, publish-scheduled) does not call Prepare or read the flag. |
| Change existing article records automatically | **No.** Article/audit writes occur only inside `prepareArticleForReview`, invoked by `POST /api/articles/prepare-for-review` after `requireEditorAuth`. |
| Trigger scheduled publishing | **No.** Scheduler eligibility is unchanged by the flag; versioned guard only tightens audits that already carry `specificationVersion`. |
| Bypass editorial review | **No.** Prepare still sets `status: "review-required"`. `publicationGuard` still blocks `review-required` from publish. Human approval remains required. |
| Modify existing audit records | **No.** Prepare creates a new audit association; historical rows are not rewritten by the flag flip. Observed Production: 0 versioned audit rows today. |
| Alter public content without approval | **No.** Flag does not publish, schedule, or mutate published body text. |
| Change authentication or authorisation | **No.** Prepare remains editor-auth gated; protected APIs still return `401` anonymously. |

### Behaviour after activation (when Prepare is later authorised)

1. Editor-authenticated Prepare uses versioned verification and writes `article-grounded-ev-reg-1` with `specificationVersion` + `disputes` when present on the verification result.
2. Publication guard (`versionedPublicationMetadataProblem`) **fail-closes** for audits with non-null `specificationVersion` that lack complete versioned metadata / thresholds / dispute clearance.
3. Audits with `specificationVersion == null` keep the legacy publication path (historical compatibility).

**Activation itself requires no article operation.** Enabling the flag only changes health reporting and the Prepare path for future authorised runs.

## 3. Governance confirmation

| Control | Status |
|---|---|
| EV-REG publication guard fail-closed for incomplete versioned audits | Confirmed in `versionedPublicationMetadataProblem` + `researchPublicationBlockReason` |
| `review-required` remains unpublishable | Confirmed in `publicationGuard` |
| No real Prepare required for activation | Confirmed — health/env redeploy path only |
| Historical audit compatibility | Confirmed — null `specificationVersion` skips versioned metadata gate; Production has 0 versioned rows |
| Versioned verifier execution path | Confirmed — Prepare + health reporting only; not cron, not auth |

P4A did **not** run Prepare for Review on any real article.

## 4. Exact activation procedure (P4B — not executed)

Requires separate human approval. Do **not** treat this section as authorisation.

1. Reconfirm aliases still on `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` and health still `false` / `article-grounded-v14`.
2. Add Production environment variable only:
   - Name: `VERSIONED_EDITORIAL_VERIFIER_ENABLED`
   - Value: `true`
   - Target: **Production** only (do not change Preview)
   - Example (after approval): `npx vercel env add VERSIONED_EDITORIAL_VERIFIER_ENABLED production` then enter `true`
3. **Redeploy the same approved SHA** so serverless instances pick up the new env (Vercel env changes require a new deployment). Prefer a clean worktree at `8be3605f93da8df77d5cb54db9d69f71ef3f5761` → Production deploy without code changes, or an equivalent promote/redeploy of that pin. Do not introduce a different application SHA without a new architecture gate.
4. Post-activation probes (read-only):
   - Health → `versionedEditorialVerifierEnabled: true`, `researchAuditEngineRevision: "article-grounded-ev-reg-1"`
   - `/api/articles` still `401`
   - Aliases still on the activation deployment
5. **Do not** Prepare, approve, schedule, or publish any article from the activation gate.

## 5. Rollback procedure

| Step | Action |
|---|---|
| Flag restore | Set Production `VERSIONED_EDITORIAL_VERIFIER_ENABLED` away from `true`, or remove the variable |
| Redeploy for env | Redeploy the intended Production revision so runtime sees the restored env |
| Application rollback (if needed) | Promote/restore `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125…` **or** the last Ready deployment that reported `false` / `v14`, only with explicit approval |
| Verify legacy verifier | Health must report `versionedEditorialVerifierEnabled: false` and `researchAuditEngineRevision: "article-grounded-v14"` |
| Audit data | **Leave** nullable P2 columns in place. **Do not** delete historical audits. **Do not** drop `specificationVersion` / `disputes` as the first recovery step. Any versioned audits created after activation remain as historical rows; legacy path continues for null `specificationVersion` |

Rollback does not reverse article content changes made by separately authorised Prepare runs; it only restores the Prepare revision selection and health signalling.

## 6. Validation (safe local / non-Production)

| Check | Result |
|---|---|
| EV-REG editorial suite (`tests/editorial/ev-reg-spec-1.0.0-*.test.ts`, 7 files) | **54 passed** |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` with CI Supabase placeholders; flag unset | **exit 0** (compiled; static generation completed) |
| Production configuration | **unchanged** |

Build-generated `gamma/research/index.json` was restored after the local build and is not part of the evidence commit.

## 7. Remaining risks

1. After P4B, a separately authorised Production Prepare will write versioned audits; incomplete versioned metadata will fail closed at publish — operators must understand the stricter gate.
2. Midnight UTC cron continues; it does not Prepare, but it can publish already-approved/scheduled articles that pass the (legacy or versioned) guard.
3. Env enablement without redeploy may leave some instances on the old reading until a redeploy completes — treat redeploy as mandatory for activation and rollback.
4. Application rollback to `3ade3125…` retains P2 columns (correct); do not attempt column drops during recovery.

## 8. Required human approval

**P4B — enable Production `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` and redeploy the approved pin, then run post-activation probes.**  
Does **not** include article Prepare, approval, scheduling, or publication.

## Verdict

**EV-REG PRODUCTION P4A VERIFIED — ACTIVATION APPROVAL REQUIRED**
