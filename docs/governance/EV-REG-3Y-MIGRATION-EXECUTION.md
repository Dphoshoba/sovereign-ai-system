# Preview additive migration execution

Status: **executed on the verified Preview database only.** This file is not a Prisma migration and must not be copied into `prisma/migrations`. It does not authorise Production, deployment, or versioned scoring.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD before execution: `758addfe65ee3236d144b34baeb7f21a27dc4565`  
Specification SHA-256: `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419`

## Database identity

The ignored `DATABASE_URL` matched the approved Preview target and did not contain Production project `kqptdgbttfuqkzxzbazw`:

- host `aws-0-ap-southeast-2.pooler.supabase.com`
- port `5432`
- database `postgres`
- username `postgres.emmzoeeaznhpwevqprkn`

`sslmode` was absent. The session verified the pinned Supabase root CA. Inside the database, `current_database()` was `postgres` and `current_user` was `postgres`. `transaction_read_only` was `off` only for this approved transaction. `lock_timeout` was `5s`.

## SQL

The transaction rechecked the inspection metadata, applied only this statement, verified the result, and then committed:

```sql
ALTER TABLE public."ArticleResearchAudit"
  ADD COLUMN "specificationVersion" TEXT,
  ADD COLUMN "disputes" JSONB;
```

No default, index, constraint, backfill, or row rewrite was added. Row security stayed enabled. `ArticleReviewNote` was unchanged. No article rows or audit JSON were read. Prisma did not generate or execute the change.

## Outcome

Both columns were absent before the statement. After it, and again in a later read-only session, the only public-column difference was:

| Column | Type | Nullable | Default |
|---|---|---|---|
| specificationVersion | text | yes | none |
| disputes | jsonb | yes | none |

The preceding audit columns, both tables' indexes, and both tables' constraints were unchanged. Row security remained enabled and `pg_policies` still returned no policies. The transaction committed.

## Application alignment

`ArticleResearchAudit` in `prisma/schema.prisma` now has nullable `specificationVersion` and `disputes`. The Prisma client was regenerated. `VERSIONED_EDITORIAL_VERIFIER_ENABLED` remains false. Prepare for Review still writes `article-grounded-v14`. A null `specificationVersion` remains a baseline audit.

## Verification

- `npx tsc --noEmit --pretty false --incremental false` exited 0.
- The versioned-audit regression files passed 63 tests. The disposable PostgreSQL fixture and the two historical schema-diff guards were then aligned to the same two nullable columns. Those four files passed 66 tests.
- `npx vitest run tests/editorial` passed 99 files and 1,123 tests. Docker 29.9.2 was responding.
- `npm run build` compiled, finished its TypeScript pass, and generated 656 static pages. The generated `gamma/research/index.json` timestamp was restored.

## Rollback

Deploy the previous application revision first. Leave the nullable columns in place. Do not drop them as the first rollback.
