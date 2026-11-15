# EV-REG Production P1 — schema inspection

Status: **VERIFIED — read-only Production schema inspection complete.**  
No schema writes, migrations, deployments, or flag changes occurred. No article or audit row data was read. Session ended with `ROLLBACK`.

Linked from `.agents/skills/echoes-visions-autonomous-engineering/SKILL.md` and `docs/governance/EV-REG-PRODUCTION-ROLLOUT-PLAN.md`.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at verification: `3bd33be2a3359434b5117291af4c5fc368ee8429`  
Certified Preview tag: `ev-reg-1.0.0-preview-certified` → `d8f59aceac3bdc775760a8bc4d076eb1e1d9074d`

## Verdict

**EV-REG PRODUCTION P1 VERIFIED — P2 APPROVAL REQUIRED**

## Credential and identity

Source: `C:\Users\David\.config\echoes-visions\production-db.env` (never printed or committed). Preview `.env.local` was not used.

| Field | Result |
|---|---|
| Username (URL) | `postgres.kqptdgbttfuqkzxzbazw` |
| Host | `aws-1-ap-southeast-2.pooler.supabase.com` |
| Port | `5432` (Session pooler) |
| Database | `postgres` |
| TLS | pinned `certs/supabase-root-2021.crt`, `rejectUnauthorized: true` |
| Preview ref present | no |
| `transaction_read_only` | `on` |
| `current_user` / `session_user` | `postgres` (normal pooler-mapped role) |
| Server | PostgreSQL 17.6 |
| `rolsuper` | false |
| `rolbypassrls` | true |
| `rolcanlogin` | true |

## Live Production schema

Both tables exist in `public` as ordinary tables. Row security is enabled on both. `pg_policies` returned **no** policies.

### `ArticleResearchAudit`

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | text | no | none |
| articleId | text | no | none |
| sourceCount | integer | no | 0 |
| averageAuthorityScore | integer | no | 0 |
| averageTrustScore | integer | no | 0 |
| researchConfidence | integer | no | 0 |
| evidenceCount | integer | no | 0 |
| factCount | integer | no | 0 |
| verifiedCount | integer | no | 0 |
| partiallyVerifiedCount | integer | no | 0 |
| unverifiedCount | integer | no | 0 |
| averageVerificationScore | integer | no | 0 |
| consensusScore | integer | no | 0 |
| sourceQualityScore | integer | no | 0 |
| publicationRecommendation | text | yes | none |
| sources | jsonb | yes | none |
| evidence | jsonb | yes | none |
| facts | jsonb | yes | none |
| consensus | jsonb | yes | none |
| createdAt | timestamp without time zone | no | CURRENT_TIMESTAMP |

**`specificationVersion` is absent. `disputes` is absent.**

Primary key: `id`. Foreign key: `articleId` → `public."Article"("id")` ON DELETE CASCADE ON UPDATE CASCADE. Indexes: PK + `ArticleResearchAudit_articleId_idx`.

### `ArticleReviewNote`

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | text | no | none |
| articleId | text | no | none |
| action | text | no | none |
| note | text | yes | none |
| reviewer | text | no | `'system'::text` |
| createdAt | timestamp without time zone | no | CURRENT_TIMESTAMP |

Primary key: `id`. Foreign key: `articleId` → `public."Article"("id")` ON DELETE CASCADE ON UPDATE CASCADE. Indexes: PK + `ArticleReviewNote_articleId_idx` + `ArticleReviewNote_action_idx`.

## Comparison

| Surface | `specificationVersion` / `disputes` | Notes |
|---|---|---|
| Production (this session) | **Absent** | Matches pre-migration Preview shape |
| Preview (after 3Y migration) | Present, nullable, no defaults | See `EV-REG-3Y-MIGRATION-EXECUTION.md` |
| Prisma `ArticleResearchAudit` | Declared nullable | Deploying candidate code without Production columns is unsafe |
| `ArticleReviewNote` | Unchanged everywhere | Do not alter in P2 |

Tracked Prisma migrations still do not create these tables.

## Migration compatibility (P2 proposal)

Safe to propose the same additive Preview SQL on Production only:

```sql
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
```

Constraints for P2 approval:

- Nullable, no defaults, no backfill, no indexes, no historical rewrite
- Not via `prisma migrate diff` / `prisma db push`
- Flag remains unset; no Production deploy in P2
- Rollback: redeploy prior app revision first; leave columns in place
- Inspection role can write and bypasses RLS — P2 must use its own bounded write transaction with rechecks

## Remaining risks

- `rolbypassrls=true` on the pooler `postgres` role — never rely on RLS alone; keep explicit read-only / bounded write discipline
- Production pooler host is `aws-1-…` (Preview used `aws-0-…`) — keep project-ref username checks
- P2 still requires separate human approval before any DDL
