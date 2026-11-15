# EV-REG Production P1 — schema inspection

Status: **BLOCKED — Production database authentication failed after identity structure verification.**  
No successful Production PostgreSQL session was established. No schema writes, migrations, deployments, or flag changes occurred. No article or audit row data was read.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`. Does not supersede Preview inspection records.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at resume: `f0fb622a6b06f8c5d9a83f1e3cf301c16ba656b5`  
Certified Preview tag: `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`  
Spec SHA-256: `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`

## Verdict

**EV-REG PRODUCTION P1 BLOCKED**

## Credential source

Out-of-repo file: `C:\Users\David\.config\echoes-visions\production-db.env`  
Format observed: raw PostgreSQL URL (not `KEY=value`). Value never printed or committed.

Repository Preview `.env.local` `DATABASE_URL` was **not** used.

## Identity structure (verified without printing the secret)

| Field | Result |
|---|---|
| Protocol | `postgres` / `postgresql` |
| Username | `postgres.kqptdgbttfuqkzxzbazw` |
| Host | `aws-1-ap-southeast-2.pooler.supabase.com` |
| Port in URL | `5432` |
| Database | `postgres` |
| `sslmode` query param | absent |
| Contains Production ref `kqptdgbttfuqkzxzbazw` | yes |
| Contains Preview ref `emmzoeeaznhpwevqprkn` | no |
| CA used for attempt | pinned `certs/supabase-root-2021.crt` (fingerprint match) |

Public Production Auth identity (from earlier P0/P1 work) remains `kqptdgbttfuqkzxzbazw`. Pooler host class for this credential is **aws-1** (Preview inspection used **aws-0**).

## Connection attempt

After identity checks passed, connection was attempted with:

- explicit user / host / database from the credential
- TLS `rejectUnauthorized: true` + pinned Supabase root CA
- ports `5432` and `6543`

Both attempts failed with PostgreSQL `28P01` password authentication failure (server reported role `postgres`, the normal pooler-mapped login role). No `BEGIN READ ONLY` session was established.

## Schema inspection

**Not completed.** Live Production column presence for `specificationVersion` / `disputes` remains **UNKNOWN**.

| Surface | Status |
|---|---|
| Preview live schema | Columns added (Preview evidence) |
| Prisma model | Declares nullable `specificationVersion`, `disputes` |
| Production live schema | Unknown — auth blocked session |

## Migration compatibility

Still provisional only. P2 must not proceed until a successful read-only session confirms table shape.

## Human resolution required

Refresh or replace the Production database password in `C:\Users\David\.config\echoes-visions\production-db.env` so it matches the live Vercel Production `DATABASE_URL` / Supabase database password for project `kqptdgbttfuqkzxzbazw`, then re-run P1. Do not paste the secret into chat or the repository.

## Remaining risks

- Stale or truncated out-of-repo password (observed password length is short relative to typical Supabase secrets)
- Host/port class differences between Preview (`aws-0`) and this Production credential (`aws-1`) must be respected once auth succeeds
- Pooler role may still `rolbypassrls` after connect — read-only transaction discipline remains mandatory
