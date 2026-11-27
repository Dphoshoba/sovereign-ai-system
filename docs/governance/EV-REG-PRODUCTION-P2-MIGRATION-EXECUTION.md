# EV-REG Production P2 — migration execution

Status: **EXECUTED on Production project `kqptdgbttfuqkzxzbazw` only.**  
This file records the authorised additive DDL. It does **not** authorise Production deploy, verifier enablement, or article operations. Next gate: **P3**.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.  
Supersedes the “not executed” status in `EV-REG-PRODUCTION-P2-MIGRATION-PREPARATION.md` for execution outcome only (preparation package remains the reviewed plan/SQL source).  
User: “Update the P2 migration evidence” / “Execute only the previously reviewed two-column Production schema migration after explicit human approval.”

Preparation package: `docs/governance/EV-REG-PRODUCTION-P2-MIGRATION-PREPARATION.md`.  
SQL source: `docs/governance/sql/ev-reg-production-p2-article-research-audit.sql`.

## Identity

| Field | Value |
|---|---|
| Worktree | `C:\Users\David\echoes-visions-preview-security` |
| Branch | `integrate/production-research-integrity` |
| Prepared commit (pre-execution) | `9063442cc9f5d02ae759429351de93710baa89b3` |
| Certified Preview tag | `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d` |
| Spec SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |
| Credential source | `C:\Users\David\.config\echoes-visions\production-db.env` (not printed) |
| Username | `postgres.kqptdgbttfuqkzxzbazw` |
| Host | `aws-1-ap-southeast-2.pooler.supabase.com` |
| Port | `5432` (Session pooler) |
| Database | `postgres` |
| TLS | pinned `certs/supabase-root-2021.crt`, `rejectUnauthorized: true` |
| Preview ref present | no |
| Server | PostgreSQL 17.6 |
| `current_user` / `session_user` | `postgres` |

## Preflight (passed)

- Repository HEAD matched prepared commit; working tree clean; spec hash unchanged
- Production health `200` `{"ok":true}`; `/api/articles` → `401`
- `VERSIONED_EDITORIAL_VERIFIER_ENABLED` absent from Production (Preview only)
- SQL file scoped to the two `ADD COLUMN` statements with `lock_timeout=5s` / `statement_timeout=30s`
- `BEGIN READ ONLY` confirmed `transaction_read_only=on`
- Target columns **absent** before DDL
- `ArticleReviewNote` columns: `id`, `articleId`, `action`, `note`, `reviewer`, `createdAt`
- RLS enabled on both audit tables; `pg_policies` count **0**

## SQL executed

Explicit transaction (not Prisma migrate / db push):

```sql
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';
-- in-transaction absence + table presence guards
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
-- in-transaction shape verification
COMMIT;
```

No defaults, indexes, backfill, or other table changes. No article or audit row bodies were read or updated.

## Post-migration verification

| Check | Result |
|---|---|
| `specificationVersion` | present — `text`, nullable `YES`, default `null` |
| `disputes` | present — `jsonb`, nullable `YES`, default `null` |
| `ArticleReviewNote` | unchanged |
| RLS | still enabled on both tables |
| Policies | still **0** |
| Health (after) | `GET /api/health` → `200` `{"ok":true}` |
| Auth (after) | `GET /api/articles` → `401` |
| Verifier flag | still absent from Production |
| Production deploy | unchanged (`dpl_DnQpxYFhBihvAuhmGRqxoLrP6XXE` @ `3ade3125…`) — no deploy performed |

## Out of scope (not done)

- Application deployment (P3)
- `VERSIONED_EDITORIAL_VERIFIER_ENABLED` on Production (P4)
- Article Prepare / approve / schedule / publish
- Environment variable changes
- Remote push / retagging

## Rollback note

If a later app revision regresses: redeploy the prior application revision first; **leave these nullable columns in place**. Do not drop columns or delete historical audits as the first recovery step.

## Verdict

**EV-REG PRODUCTION P2 MIGRATION COMPLETE — P3 APPROVAL REQUIRED**
