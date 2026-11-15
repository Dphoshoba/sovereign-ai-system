# EV-REG Production P2 — migration preparation

Status: **PREPARED — not executed.**  
This package does **not** authorise Production PostgreSQL connection, DDL execution, deployment, flag enablement, or article operations. Execution requires a separate human **P2 execution approval**.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.  
Supersedes: nothing — new P2 preparation package; does not replace P1 evidence or Preview `EV-REG-3Y-MIGRATION-EXECUTION.md`.

## 1. Preparation identity

| Field | Value |
|---|---|
| Worktree | `C:\Users\David\echoes-visions-preview-security` |
| Branch | `integrate/production-research-integrity` |
| HEAD before this docs commit | `d8db99aabd2732efe9c4734037163410349abd3e` |
| Certified Preview tag (immutable) | `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d` |
| Spec SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |
| Preview migration evidence | `docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md` |
| Production P1 evidence | `docs/governance/EV-REG-PRODUCTION-P1-SCHEMA-INSPECTION.md` |
| SQL script (not executed) | `docs/governance/sql/ev-reg-production-p2-article-research-audit.sql` |

## 2. Production database identity (from P1 — not reconnected)

Reconfirmed from `EV-REG-PRODUCTION-P1-SCHEMA-INSPECTION.md` only. No Production PostgreSQL session was opened during P2 preparation.

| Field | P1 result |
|---|---|
| Project ref | `kqptdgbttfuqkzxzbazw` |
| Username | `postgres.kqptdgbttfuqkzxzbazw` |
| Host | `aws-1-ap-southeast-2.pooler.supabase.com` |
| Port | `5432` (Session pooler) |
| Database | `postgres` |
| Server | PostgreSQL 17.6 |
| `ArticleResearchAudit.specificationVersion` | **absent** |
| `ArticleResearchAudit.disputes` | **absent** |
| `ArticleReviewNote` | present; do not alter |
| Role | `rolsuper=false`, `rolbypassrls=true`, `rolcanlogin=true` |

Credential source for a future authorised execution: `C:\Users\David\.config\echoes-visions\production-db.env` (never print or commit). Preview `.env.local` must not be used.

## 3. Production deployment and credential-cleanup status (non-SQL)

Verified at preparation time via Vercel metadata and public probes (no secret values retrieved):

| Check | Result |
|---|---|
| Vercel project | `sovereign-ai-executive` |
| Latest Production deployment | `dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` (`5b2doqdfl`) — Ready |
| Deploy commit | `3ade3125afda7399bb23874d840e03abb5ff0b11` (not the unapproved EV-REG candidate) |
| `DATABASE_URL` Production | last updated `2026-11-15T11:11:43Z` |
| `DIRECT_URL` Production | last updated `2026-11-15T11:56:46Z` (credential cleanup verified) |
| `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | Preview only — **absent from Production** |
| Health | `GET /api/health` → `200` `{"ok":true}` |

## 4. Preview migration review

Preview execution (`EV-REG-3Y-MIGRATION-EXECUTION.md`) applied exactly:

```sql
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
```

Verified on Preview after commit:

- Both columns present, nullable, no defaults
- No indexes/constraints added for these columns
- Row security remained enabled; no policies
- `ArticleReviewNote` unchanged
- No article/audit row bodies read
- Not via Prisma migrate / db push
- Application: null `specificationVersion` remains baseline; flag stayed unset during that migration phase

Production P2 must use the **same SQL scope** against project `kqptdgbttfuqkzxzbazw` only.

## 5. Exact migration scope (Production)

```sql
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
```

| Constraint | Required |
|---|---|
| Nullable | yes |
| Defaults | none |
| Indexes | none |
| Backfill / `UPDATE` of existing rows | none |
| Touch `ArticleReviewNote` | no |
| Create tables | no |
| `prisma migrate` / `prisma db push` / `migrate diff` | **forbidden** |
| Flag / deploy / article ops | **out of scope for P2** |

### Existing audit records

`ADD COLUMN … NULL` without `DEFAULT` does not rewrite existing row payloads. Existing audits remain baseline (`specificationVersion` / `disputes` read as SQL `NULL`). No `UPDATE`, no JSON mutation, no fingerprint change from this DDL alone.

## 6. Prisma compatibility

| Surface | State |
|---|---|
| `prisma/schema.prisma` `ArticleResearchAudit` | Already declares `specificationVersion String?` and `disputes Json?` |
| `prisma.config.ts` | `datasource.url` ← `DATABASE_URL` only |
| Runtime | `@prisma/adapter-pg` uses `DATABASE_URL` only; does not read `DIRECT_URL` |
| Tracked `prisma/migrations` | Still do **not** create these tables or columns — do not generate a Prisma migration for P2 |

After P2 succeeds, deploying application code that selects these fields is safe. Until P2, deploying Prisma-aware candidate code against Production remains a stop condition (rollout plan §10).

## 7. Elevated role privileges and safeguards

P1 observed the Session-pooler mapped role `postgres` with:

- `rolsuper = false`
- `rolbypassrls = true`
- ability to run DDL when not in `READ ONLY`

**Safeguards for authorised P2 execution:**

1. Confirm project ref `kqptdgbttfuqkzxzbazw` in the connection username before any write.
2. Reject Preview ref `emmzoeeaznhpwevqprkn`.
3. Use pinned TLS CA; do not disable certificate verification.
4. Prefer a short `lock_timeout` (Preview used `5s`).
5. Wrap DDL in an explicit transaction; recheck column absence inside the transaction before `ALTER`.
6. Do not `SELECT` article bodies, audit JSON, or review-note text.
7. Do not rely on RLS — there are no policies; the role bypasses RLS.
8. On any unexpected shape, `ROLLBACK` and stop.
9. Leave `VERSIONED_EDITORIAL_VERIFIER_ENABLED` unset.

## 8. Locking considerations

- `ALTER TABLE … ADD COLUMN` (nullable, no default) on PostgreSQL 11+ is typically a brief metadata lock (`ACCESS EXCLUSIVE` for catalog update; duration usually short when no rewrite).
- Concurrent Prisma traffic on Production may wait briefly for the lock.
- Set `SET LOCAL lock_timeout = '5s'` (or approved equivalent). If the lock cannot be acquired, abort and retry only with fresh approval if the first attempt left no partial change (`ROLLBACK`).
- Prefer a low-traffic window; cron `0 0 * * *` on `/api/cron/run-pipeline` is documented — avoid overlapping midnight UTC if practical.
- Session pooler (`5432`) was used successfully for Preview DDL and for Production P1 inspection; Prisma runtime also uses `DATABASE_URL` (Session pooler class). Do not invent a different host for P2 without a new identity check.

## 9. Preflight checks (execution time — not run in preparation)

Before DDL, in a **new** authorised session:

1. Identity: username contains `kqptdgbttfuqkzxzbazw`; host is the approved Production Session pooler; Preview ref absent.
2. `SHOW transaction_read_only;` must be `off` only inside the approved write transaction (do not leave the session globally writable longer than needed).
3. Confirm table exists and both target columns are **absent** (see SQL script).
4. Confirm `ArticleReviewNote` column list will not be altered (no DDL against it).
5. Confirm Production flag still absent; health still `200`.
6. Confirm deployment SHA still the intended Production baseline (or newly approved pin).

## 10. Post-migration verification (execution time — not run in preparation)

After successful `COMMIT`:

1. Read-only session: both columns present, `text`/`jsonb`, `is_nullable = YES`, no column default.
2. Preceding audit columns, indexes, and FK on `ArticleResearchAudit` unchanged.
3. `ArticleReviewNote` unchanged.
4. RLS still enabled; policy count still zero (or report if changed).
5. No row-body queries.
6. Public health still `200`; `/api/articles` still `401`.
7. Flag still unset on Production.
8. Record outcomes in a new execution evidence file (do not reuse this preparation file as proof of execution).

## 11. Rollback and recovery

| Situation | Action |
|---|---|
| Preflight fails / unexpected schema | `ROLLBACK`; do not retry inventively; report blocker |
| Lock timeout before DDL | `ROLLBACK`; reschedule with approval |
| DDL errors mid-transaction | `ROLLBACK`; columns should remain absent |
| DDL committed, app regression later | Redeploy prior app revision first; **leave columns in place**; do not drop as first rollback |
| Flag accidentally enabled | Remove/unset Production flag immediately (separate from P2) |
| Wrong project connected | Stop; do not run compensating DDL without architecture review |

Do **not** delete historical audits. Do **not** drop columns to “undo” P2 unless a separate, explicit schema-rollback approval is given after app rollback.

## 12. P2 execution checklist (human-gated)

- [ ] Human grants **P2 execution approval** (this preparation is insufficient alone)
- [ ] Worktree clean; certified Preview tag untouched; spec SHA-256 unchanged
- [ ] Production identity reconfirmed from credential file (ref `kqptdgbttfuqkzxzbazw` only)
- [ ] Production health `200`; `/api/articles` `401`; flag absent
- [ ] Preflight SQL confirms columns absent
- [ ] Execute `docs/governance/sql/ev-reg-production-p2-article-research-audit.sql` in one controlled session
- [ ] Post-migration verification queries pass
- [ ] Write `docs/governance/EV-REG-PRODUCTION-P2-MIGRATION-EXECUTION.md`
- [ ] Update skill + rollout plan to **P2 complete — P3 approval required**
- [ ] Stop — **no deploy, no flag, no article ops**

## 13. Approval gate

| Gate | Authorises | Does not authorise |
|---|---|---|
| **P2 preparation** (this document) | Documentation + SQL package only | Any Production DDL |
| **P2 execution** (required next) | Additive Production columns only | Deploy, flag, article Prepare/approve/schedule/publish |
| **P3** | Production deploy with flag unset | Flag enablement |
| **P4** | Flag enablement | Editorial article operations |

**Required human approval to proceed:** **P2 — execute Production additive migration.**

## 14. Stop conditions (do not execute if any apply)

- Project ref ≠ `kqptdgbttfuqkzxzbazw`
- Columns already present (partial prior run)
- Table `ArticleResearchAudit` missing
- Unable to set / honour `lock_timeout`
- Production flag unexpectedly `true`
- Pressure to use `prisma db push` / `migrate deploy` / generated diff
- Request to backfill, index, or rewrite historical audits
- Request to combine P2 with deploy or verifier activation

## Verdict

**EV-REG PRODUCTION P2 PREPARED — EXECUTION APPROVAL REQUIRED**
