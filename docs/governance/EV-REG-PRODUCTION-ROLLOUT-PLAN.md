# EV-REG-1.0.0 — Production rollout plan

Status: **P0 complete; P1 verified — P2 migration approval required.**  
Preview certification remains **PREVIEW CERTIFIED — NOT PRODUCTION AUTHORISED** until P2–P4 complete under separate approvals.  
P1 evidence: `docs/governance/EV-REG-PRODUCTION-P1-SCHEMA-INSPECTION.md` (Production `ArticleResearchAudit` lacks `specificationVersion` / `disputes`; matches pre-migration Preview shape).

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
| Current Production deployment | Yes | `sovereign-ai-executive-cvw9iwkxn-…` (Ready; aliases include `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app`) |
| Production health | Yes | `GET https://www.echoesandvisions.com/api/health` → `200` `{"ok":true}` (no verifier keys — pre-activation binary) |
| Protected API | Yes | `GET /api/articles` → `401` |
| Expected Production Supabase project | Documented + historical public host | `kqptdgbttfuqkzxzbazw` (security assessment from Production `/login` JS). **P0 did not re-read Production `DATABASE_URL` secret.** |
| Preview Supabase project (contrast) | Yes | `emmzoeeaznhpwevqprkn` |
| `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | Yes (env listing) | Present as **Preview** secret only; **not** listed under Production |
| Production `DATABASE_URL` / `NEXT_PUBLIC_SUPABASE_*` | Names present | Values not pulled; secrets must not be printed |

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

1. **Production `DATABASE_URL` host class** not reconfirmed from the secret in P0 (must match `kqptdgbttfuqkzxzbazw` before migration).
2. **Production column absence** must be confirmed by authorised read-only inspection (P1) before migration (P2).
3. Integration HEAD is a **proposed** candidate only — requires Production certification gates, not Preview tag equivalence.

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
4. Enable Production flag (**P4**); verify health shows `true` / `article-grounded-ev-reg-1`.
5. Only then consider separately approved editorial Prepare actions.

## 7. Feature-flag strategy

| Environment | Flag | Expected Prepare revision |
|---|---|---|
| Preview (current) | `true` | `article-grounded-ev-reg-1` |
| Production before P4 | unset / not `true` | `article-grounded-v14` |
| Production after P4 | `true` | `article-grounded-ev-reg-1` |
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
| **P4** | Production flag enablement + post-activation probes | Article Prepare/approve/schedule/publish (separate editorial approvals) |

**Next approval required after P0:** **P1 — Production identity and read-only schema inspection.**
