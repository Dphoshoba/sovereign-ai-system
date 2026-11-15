# EV-REG Production P1 — schema inspection

Status: **BLOCKED — Production database authentication failed again after credential recovery attempt.**  
One short-timeout Session-pooler connection was attempted. It failed. No further password retries were made. No schema writes, migrations, deployments, or flag changes occurred. No article or audit row data was read.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at recovery attempt: `de6fa45a258339c96d04e984f55a6ea741776d29`  
Certified Preview tag: `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`

## Verdict

**EV-REG PRODUCTION P1 BLOCKED**

## Credential source

`C:\Users\David\.config\echoes-visions\production-db.env` (raw PostgreSQL URL). Value never printed or committed. Repository Preview `.env.local` was not used.

## Identity structure (still valid)

| Field | Result |
|---|---|
| Username | `postgres.kqptdgbttfuqkzxzbazw` |
| Host | `aws-1-ap-southeast-2.pooler.supabase.com` |
| Port | `5432` (Session pooler) |
| Database | `postgres` |
| `sslmode` | absent in URL; TLS used with pinned Supabase root CA |
| Production ref present | yes |
| Preview ref present | no |
| Observed password length | 12 (unchanged vs prior blocked attempt) |
| File length | 110 characters (unchanged vs prior blocked attempt) |

## Connection attempt (recovery run)

- Single attempt only
- Explicit user/host/port/database from the credential
- `connectionTimeoutMillis: 8000`
- TLS `rejectUnauthorized: true` + `certs/supabase-root-2021.crt`
- Result: PostgreSQL `28P01` — password authentication failed for user `postgres` (pooler-mapped role)

No `BEGIN READ ONLY` session was established. Ports were not re-swept; credentials were not auto-reset.

## Schema inspection

**Not completed.** Production presence of `specificationVersion` / `disputes` remains **UNKNOWN**.

| Surface | Status |
|---|---|
| Preview | Columns added (prior Preview evidence) |
| Prisma | Declares nullable `specificationVersion`, `disputes` |
| Production live | Unknown — auth blocked |

## Human resolution required

Replace the database password in the out-of-repo file with the **current** Supabase/Vercel Production database password for project `kqptdgbttfuqkzxzbazw` (likely longer than 12 characters if using a freshly generated Supabase secret). Confirm the URL still uses Session pooler host/port `5432` and username `postgres.kqptdgbttfuqkzxzbazw`. Do not paste the secret into chat or git. Then re-authorise a single P1 resume.

## P2 status

**Not opened.** Additive migration approval requires a successful read-only metadata session first.
