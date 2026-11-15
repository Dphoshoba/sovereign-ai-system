# EV-REG-1.0.0 — Production rollout plan

Status: **P0–P3 complete; P4 verifier activation approval required.**  
Preview certification remains **PREVIEW CERTIFIED — NOT PRODUCTION AUTHORISED** until P4 completes under separate approval.  
P1 evidence: `docs/governance/EV-REG-PRODUCTION-P1-SCHEMA-INSPECTION.md`.  
P2 execution: `docs/governance/EV-REG-PRODUCTION-P2-MIGRATION-EXECUTION.md`.  
P3 execution: `docs/governance/EV-REG-PRODUCTION-P3-DEPLOYMENT-EXECUTION.md` (`dpl_69y1DZGtH3X74UsVB4i91QLAp85L` @ `8be3605f…`; verifier disabled).

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` section K. Does not supersede `docs/releases/EV-REG-1.0.0-PREVIEW-CERTIFIED.md`.

## 1. Candidate identity

| Field | Value |
|---|---|
| Proposed Production candidate (pending certification) | `8be3605f93da8df77d5cb54db9d69f71ef3f5761` |
| Branch | `integrate/production-research-integrity` |
| Certified Preview tag (immutable) | `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d` |
| Spec SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |
| Activation implementation (already in certified tag) | `f6a648e8` |

**Delta certified Preview → candidate:** connector CI workflow placeholders + `workflow_dispatch`, Calendar `ApiClient.read()` + tests, and governance docs only. The versioned verifier implementation is already inside the certified Preview tag. This candidate is **not** automatically Production-certified.

## 2. Production environment identifiers

| Field | Verified in P0 | Value / note |
|---|---|---|
| Vercel project | Yes | `sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`) |
| Current Production deployment | Yes (P3) | `dpl_69y1DZGtH3X74UsVB4i91QLAp85L` (`a9547ntdn`) @ `8be3605f…` — Ready; aliases include `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app` |
| Production health | Yes (P3) | `200` `{"ok":true,"versionedEditorialVerifierEnabled":false,"researchAuditEngineRevision":"article-grounded-v14"}` |
| Rollback deployment | Yes | `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125…` |
| Protected API | Yes | `GET /api/articles` → `401` |
| Expected Production Supabase project | P1 verified | `kqptdgbttfuqkzxzbazw` — Session pooler `aws-1-ap-southeast-2.pooler.supabase.com:5432` |
| Preview Supabase project (contrast) | Yes | `emmzoeeaznhpwevqprkn` |
| `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | Yes | Present as **Preview** secret only; **not** listed under Production |
| Production `DATABASE_URL` / `DIRECT_URL` | Credential cleanup verified | `DATABASE_URL` updated `2026-11-15T11:11:43Z`; `DIRECT_URL` updated `2026-11-15T11:56:46Z`; values not printed |

## 3. Required schema changes (Production)

Additive only, matching Preview:

```sql
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
```

Constraints:

- Nullable, no defaults, no backfill, no historical audit rewrite
- Not a Prisma migration file under `prisma/migrations`
- Execute only after P1 identity confirmation and explicit P2 approval
- Prisma model already declares these fields — deploying candidate code against a DB missing the columns is a stop condition

## 4. P0 readiness findings (non-mutating)

| Area | Finding |
|---|---|
| Production deploy identity | Current aliases point at `cvw9iwkxn` Production deployment |
| Verifier configuration | Flag unset on Production; health payload lacks activation fields → older app revision |
| Production DB columns | **Not migrated** (Preview-only evidence). Live Production SQL not opened in P0 |
| Auth / private API | Anonymous `/api/articles` denied (`401`) |
| Publication governance | Thresholds remain 80/70; human approval separate; legacy gate non-authoritative in candidate code |
| Env requirements for activation | Production will need `VERSIONED_EDITORIAL_VERIFIER_ENABLED` set only at P4; public Supabase pair already present |
| CI/CD | GitHub connector workflows validate on path/dispatch; Vercel Git Preview projects may fire on branch activity — not Production aliases |
| Preview vs Production | Preview has columns + flag true + health keys; Production has neither columns nor flag |
| Integration-branch risk | Candidate includes Calendar client behaviour change and CI workflow edits beyond certified Preview tag |
| Rollback | Disable flag → redeploy prior Production revision → leave columns |

### Blockers / residual unknowns for later phases

1. ~~Production column absence / P2 DDL~~ — **cleared by P2 execution** (nullable columns present; see execution evidence).
2. ~~Production DB credential rotation / `DIRECT_URL`~~ — **cleared** (cleanup verified; secrets not printed).
3. ~~P3 application deploy~~ — **cleared** (`8be3605f…` live; verifier still disabled).
4. **P4 flag enablement** still required before versioned Prepare scoring is active on Production.

## 5. Preflight checks (before each phase)

- Clean worktree; expected branch/HEAD; certified Preview tag untouched
- Spec SHA-256 unchanged
- Production aliases still on the intended deployment before and after each step
- No Production flag present before P4
- No article Prepare / approve / schedule / publish as part of EV-REG gates
- Governing article untouched

## 6. Deployment sequencing

1. Complete P1 inspection evidence.
2. Execute P2 additive migration; verify columns; flag remains unset.
3. Deploy approved candidate to Production (**P3**) with flag unset; verify health exposes `versionedEditorialVerifierEnabled: false` and revision `article-grounded-v14`.
4. Complete activation readiness (**P4A**); evidence `EV-REG-PRODUCTION-P4-ACTIVATION-READINESS.md` — **complete**.
5. Enable Production flag and redeploy approved pin (**P4B**); verify health shows `true` / `article-grounded-ev-reg-1` — **complete**; evidence `EV-REG-PRODUCTION-P4B-ACTIVATION-EXECUTION.md`.
6. Certification review / programme closure (separate approval).
7. Only then consider separately approved editorial Prepare actions.

## 7. Feature-flag strategy

| Environment | Flag | Expected Prepare revision |
|---|---|---|
| Preview (current) | `true` | `article-grounded-ev-reg-1` |
| Production before P4B | unset / not `true` | `article-grounded-v14` |
| Production after P4B | `true` | `article-grounded-ev-reg-1` |
| Compile-time constant | always `false` | N/A — runtime env gate only |

## 8. Verification procedures

- Public: `/api/health`, `/api/articles` (401), Production aliases
- Non-secret health keys after P3/P4 deploys
- Targeted EV-REG + connector tests before each phase commit/deploy
- No secret values in logs or docs

## 9. Rollback procedures

1. Set Production `VERSIONED_EDITORIAL_VERIFIER_ENABLED` away from `true` (or remove).
2. Redeploy the previous Production deployment (`cvw9iwkxn` or the last known-good) if application behaviour regresses.
3. Leave nullable columns in place.
4. Do not delete historical audits.
5. Do not drop columns as the first rollback action.

## 10. Explicit stop conditions

- Production project ref ≠ `kqptdgbttfuqkzxzbazw` (or newly approved documented ref)
- Prisma fields present in deploy without DB columns
- Flag enabled before migration and baseline deploy verification
- Production alias unexpectedly moves during a Preview-only operation
- Any request to Prepare/approve/publish without editorial approval
- Specification or threshold edits proposed inside this programme

## 11. Approval gates (P1–P4)

| Gate | Authorises | Does not authorise |
|---|---|---|
| **P1** | Read-only Production identity + schema inspection | Migration, deploy, flag |
| **P2** | Additive Production column migration | Deploy, flag, article ops |
| **P3** | Production deploy of approved candidate with flag unset | Flag enablement, article ops |
| **P4A** | Readiness assessment for Production flag enablement (no config change) | Flag enablement, redeploy, article ops |
| **P4B** | Production flag enablement + redeploy of approved pin + post-activation probes | Article Prepare/approve/schedule/publish (separate editorial approvals) |

**Next approval required:** **Certification review / programme closure** after P4B activation. P4B evidence: `docs/governance/EV-REG-PRODUCTION-P4B-ACTIVATION-EXECUTION.md`. Article Prepare/approve/schedule/publish still require separate editorial approvals.
