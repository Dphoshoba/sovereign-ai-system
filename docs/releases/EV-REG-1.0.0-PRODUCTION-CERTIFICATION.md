# EV-REG-1.0.0 — Production programme certification

**Verdict: EV-REG-1.0.0 PRODUCTION CERTIFIED — PROGRAMME CLOSED**

**Certification scope (precise):** EV-REG-1.0.0 Production deployment, schema compatibility and versioned verifier activation.

This record does **not** certify real article Prepare for Review, editorial approval, scheduling, publication, end-to-end editorial operations, live Calendar Google API behaviour, or RLS hardening beyond the observed baseline.

**Supersedes:** the open “certification review required” next-gate language in `docs/governance/EV-REG-PRODUCTION-P4B-ACTIVATION-EXECUTION.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md` for programme-closure status only. Prior phase evidence remains authoritative for what each phase executed.  
**Linked from:** `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `.agents/skills/echoes-visions-editorial-operations/SKILL.md`.  
**User instruction (verbatim):** “Conduct the final Production certification review for EV-REG-1.0.0 and formally close the Production rollout programme if all certification requirements pass.” / “Create: docs/releases/EV-REG-1.0.0-PRODUCTION-CERTIFICATION.md” / “Commit the Production certification record and skill updates locally only. Do not push.” / “Stop after the final report.”

P5 performed **no** Production deployment, environment change, database mutation, article operation, cron change, push, or release retagging.

## 1. Programme objectives

Roll EV-REG-SPEC-1.0.0 onto Production under gated phases (P0–P4B):

- Preserve baseline `article-grounded-v14` until Production flag enablement.
- Add nullable `specificationVersion` / `disputes` on Production `ArticleResearchAudit` only.
- Deploy approved application pin with flag unset, then activate `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` and redeploy the same pin.
- Keep human editorial approval, scheduling, and publication outside the engineering rollout authority.
- Leave Preview certification tag `ev-reg-1.0.0-preview-certified` immutable.

## 2. Adopted specification

| Field | Value |
|---|---|
| Specification | `docs/governance/EV-REG-SPEC-1.0.0.md` |
| SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |
| Recheck at P5 | **match** (unchanged) |

## 3. Preview certification reference (preserved)

| Field | Value |
|---|---|
| Annotated tag | `ev-reg-1.0.0-preview-certified` |
| Commit | `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d` |
| Record | `docs/releases/EV-REG-1.0.0-PREVIEW-CERTIFIED.md` |
| Verdict | PREVIEW CERTIFIED — NOT PRODUCTION AUTHORISED (historical Preview seal; Production now separately certified under this document’s scope) |

## 4. Production application and deployment identity

| Field | Value |
|---|---|
| Worktree | `C:\Users\David\echoes-visions-preview-security` |
| Branch | `integrate/production-research-integrity` |
| Approved application SHA | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Vercel project | `sovereign-ai-executive` |
| Production deployment | `dpl_7Kdm6gQxWDnFGpyRVpzmXhqzwpb7` |
| Ready state (P5 recheck) | **READY** |
| Project `targets.production` | `dpl_7Kdm6gQxWDnFGpyRVpzmXhqzwpb7` @ SHA `8be3605f…` |
| Domains | `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app` (verified on project) |
| Active verifier | `article-grounded-ev-reg-1` |
| Feature flag | Production `VERSIONED_EDITORIAL_VERIFIER_ENABLED=true` (Preview also `true`; unchanged by P5) |

## 5. Phase evidence chain

| Phase | Status | Evidence |
|---|---|---|
| P0 | complete | `EV-REG-PRODUCTION-ROLLOUT-PLAN.md` |
| P1 | VERIFIED | `EV-REG-PRODUCTION-P1-SCHEMA-INSPECTION.md` |
| P2 | COMPLETE | `EV-REG-PRODUCTION-P2-MIGRATION-EXECUTION.md` |
| P3 | COMPLETE | `EV-REG-PRODUCTION-P3-DEPLOYMENT-EXECUTION.md` |
| P4A | VERIFIED | `EV-REG-PRODUCTION-P4-ACTIVATION-READINESS.md` |
| P4B | COMPLETE | `EV-REG-PRODUCTION-P4B-ACTIVATION-EXECUTION.md` |
| P5 | THIS RECORD | Production certification + programme closure |

## 6. Database migration evidence

Production Supabase project `kqptdgbttfuqkzxzbazw` only (P2):

- Added nullable `specificationVersion` (`text`, default null) and `disputes` (`jsonb`, default null) on `ArticleResearchAudit`.
- P5 metadata recheck: both columns present, nullable, no defaults; `ArticleReviewNote` columns unchanged (`id`, `articleId`, `action`, `note`, `reviewer`, `createdAt`).
- RLS: enabled on both audit tables; `pg_policies` count **0** (unchanged programme observation).
- Audit integrity: **107** rows; **0** with non-null `specificationVersion` or `disputes` (no Prepare during rollout).
- Inspection used `BEGIN READ ONLY` / `transaction_read_only=on`. No P5 DDL or mutation.

## 7. Feature-flag activation evidence

Documented in P4B and reconfirmed at P5:

- Production env lists `VERSIONED_EDITORIAL_VERIFIER_ENABLED` (Secret).
- Public health: `versionedEditorialVerifierEnabled: true`, `researchAuditEngineRevision: "article-grounded-ev-reg-1"`.
- Runtime gate remains `env === "true"`; compile-time constant stays `false`.

## 8. Security verification (P5 read-only)

| Check | Result |
|---|---|
| Health HTTP | `200` on www and `sovereign-ai-executive.vercel.app` |
| Protected API | `/api/articles` → `401` |
| Auth bypass introduced by rollout | **Not observed** — Prepare remains `requireEditorAuth`; cron does not call Prepare |
| Production DB identity | URL contains `kqptdgbttfuqkzxzbazw`; not Preview `emmzoeeaznhpwevqprkn` |
| Cron | `vercel.json` still `/api/cron/run-pipeline` @ `0 0 * * *` |
| Article ops during rollout / P5 | **none** |

## 9. Research integrity governance (code + tests vs live workflow)

**Code / test level (verified):**

- Adopted specification remains authoritative; SHA-256 unchanged.
- When flag enabled, Prepare writes `article-grounded-ev-reg-1` and may persist `specificationVersion` / `disputes` (`lib/research/prepare-article-for-review.ts`, `versioned-publication.ts`).
- Null `specificationVersion` keeps legacy publication path; incomplete versioned metadata fail-closes (`versionedPublicationMetadataProblem` / `researchPublicationBlockReason`).
- `publicationGuard` still blocks `review-required`; human approval remains separate.
- Flag activation alone does not publish (P4A impact analysis; cron does not read the flag).

**Live Production workflow:**

- Verifier activation and health signalling verified on Production.
- **No** real Production Prepare / approve / schedule / publish was executed under this programme.

## 10. Final regression verification (local, non-Production credentials)

| Suite | Result |
|---|---|
| EV-REG editorial (`tests/editorial/ev-reg-spec-1.0.0-*.test.ts`, 7 files) | **54 passed** |
| Calendar + Slack connector tests (4 files) | **72 passed** |
| `npm run connector:validate -- --name=calendar` | **100/100** |
| `npm run connector:validate -- --name=slack` | **100/100** |
| `npx tsc --noEmit` | **exit 0** |
| `npm run build` (CI Supabase placeholders; flag unset locally) | **exit 0** |

Deployed Production revision was **not** modified during these checks.

## 11. Remaining limitations (not passed tests)

1. No real Production Prepare for Review has been tested.
2. No real article approval or publication has been authorised by this programme.
3. Production PostgreSQL inspection role is elevated (`postgres` via pooler); not least-privilege certification.
4. Existing RLS policy limitations remain outside this programme (RLS on, zero policies).
5. Midnight publishing cron continues `0 0 * * *` and can publish already-eligible approved/scheduled articles.
6. Calendar live Google API behaviour has not been independently certified (mocked/unit + structural validate only).
7. Unrelated Preview project failures remain separate from this Production certification.
8. Certification does **not** cover end-to-end editorial operations or publishing outcomes.

## 12. Rollback baseline

| Item | Reference |
|---|---|
| Disable verifier | Set Production `VERSIONED_EDITORIAL_VERIFIER_ENABLED` away from `true` (or remove) and redeploy so runtime picks up env |
| Application restore | Prior Ready pin `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` @ `8be3605f…` (flag-off era) and/or older `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125…` with explicit approval |
| Schema | Leave nullable P2 columns; do not delete historical audits; do not drop columns as first recovery |

## 13. Final certification decision

Under the precise scope **“EV-REG-1.0.0 Production deployment, schema compatibility and versioned verifier activation,”** all P5 certification requirements passed on available evidence.

**EV-REG-1.0.0 PRODUCTION CERTIFIED — PROGRAMME CLOSED**

Future agents must not repeat completed P0–P5 rollout work. Live editorial Prepare, approval, scheduling, and publication remain separate human-authority gates outside this closed programme.
