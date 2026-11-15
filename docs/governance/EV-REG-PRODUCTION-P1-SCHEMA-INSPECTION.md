# EV-REG Production P1 — schema inspection

Status: **BLOCKED — Production database credential unavailable for a verified connection.**  
No Production PostgreSQL session was opened. No schema writes, migrations, deployments, or flag changes occurred.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`. Does not supersede Preview inspection records.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at inspection attempt: `f3d883fed6218299a2e60cffc795f66d845725c0`  
Certified Preview tag: `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`  
Spec SHA-256: `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`

## Verdict

**EV-REG PRODUCTION P1 BLOCKED — IDENTITY OR SCHEMA VERIFICATION**

## What was verified without connecting

| Check | Result |
|---|---|
| Governance / plan / Preview inspection docs | Read |
| Spec hash | Matches expected digest |
| Certified Preview tag | Unchanged at `d8f59ace…` |
| Expected Production Supabase project | `kqptdgbttfuqkzxzbazw` |
| Excluded Preview project | `emmzoeeaznhpwevqprkn` |
| Local `.env.local` `DATABASE_URL` | Preview only (`postgres.emmzoeeaznhpwevqprkn`); **not used** |
| Process env Production DB URL | Absent |
| `vercel env pull --environment production` | `DATABASE_URL` written as `[SENSITIVE]` placeholder — **22 Production secrets cannot be pulled** |
| Production public `NEXT_PUBLIC_SUPABASE_URL` | Host ref `kqptdgbttfuqkzxzbazw` |
| Production anon JWT payload (decoded locally) | `ref=kqptdgbttfuqkzxzbazw`, `role=anon` |
| Production `DATABASE_URL` secret exists in Vercel | Yes (listed; value unread) |
| Preview `VERSIONED_EDITORIAL_VERIFIER_ENABLED` | Preview secret only |

Public Auth/API project identity for Production is consistent with `kqptdgbttfuqkzxzbazw`. That does **not** satisfy the P1 rule to verify the Production **PostgreSQL** credential (host, port, database name, username, SSL, privilege class) before connecting. Hostname/public URL alone is insufficient for the database session.

## What was not done

- No Production PostgreSQL connection
- No `BEGIN READ ONLY` session
- No `information_schema` inspection of `ArticleResearchAudit` / `ArticleReviewNote`
- No confirmation whether Production already has `specificationVersion` / `disputes`
- No migration SQL generated or executed

## Schema comparison (evidence status)

| Surface | Status |
|---|---|
| Preview live schema | Known from `EV-REG-3Y-SCHEMA-INSPECTION.md` / migration execution: columns **added** on Preview |
| Prisma model | Declares nullable `specificationVersion` and `disputes` on `ArticleResearchAudit` |
| Production live schema | **UNKNOWN** — blocked pending credential |

## Migration compatibility (provisional, pending live P1)

If a later authorised session confirms Production tables match the pre-migration Preview shape (tables exist; both columns absent):

- The same additive two-column Preview SQL remains the proposed P2 shape
- Do not use `prisma migrate diff` / `prisma db push` (tables are outside tracked migrations)
- Rollback: redeploy prior app revision first; leave nullable columns
- Flag stays unset through P2–P3

This provisional assessment is **not** a P2 approval.

## Blocker for human resolution

Supply an out-of-repo Production `DATABASE_URL` for this worktree (or another approved non-printing access path) such that identity checks can confirm:

- username / URL contains project ref `kqptdgbttfuqkzxzbazw`
- does **not** contain `emmzoeeaznhpwevqprkn`
- host, port, database name, SSL mode, and role privilege class can be recorded without printing the secret

Then re-run P1 connection + read-only metadata inspection only.

## Proposed P2 approval scope (after unblocked P1)

Only if live Production metadata shows both columns absent and tables match expectations:

- Explicit additive `ALTER TABLE` for nullable `specificationVersion` / `disputes` on Production `ArticleResearchAudit`
- Flag remains unset; no deploy; no article operations

## Remaining risks

- Production `DATABASE_URL` pooler host/port may differ from Preview (`aws-0` vs historical `aws-1` notes) — must be read from the credential, not assumed
- Public Supabase ref matching Production does not prove `DATABASE_URL` points at the same project until the secret is identity-checked
- Elevated `rolbypassrls` on pooler `postgres` role (Preview finding) may also apply on Production — read-only transaction discipline remains mandatory
