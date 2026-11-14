# Preview audit schema inspection

Status: **read-only inspection complete. Migration not approved.** This file is not a Prisma migration and must not be copied into `prisma/migrations`.

Worktree: `C:\Users\David\echoes-visions-preview-security`  
Branch: `integrate/production-research-integrity`  
HEAD at inspection: `221a09f9b534983d543ab8925b8099a3b1f316c5`

## Identity

The ignored `.env.local` contains `DATABASE_URL`. The parsed URL matched the approved Preview target and did not contain Production project `kqptdgbttfuqkzxzbazw`:

- host `aws-0-ap-southeast-2.pooler.supabase.com`
- port `5432`
- database `postgres`
- username `postgres.emmzoeeaznhpwevqprkn`

`sslmode` was absent. `disable` and `no-verify` were not set. The session used the pinned Supabase root CA with certificate verification. The CA fingerprint matched `src/lib/preview-postgres.ts`.

The pooler accepted that project username. Inside the database, `current_user` is `postgres`, `current_database()` is `postgres`, and the server version is PostgreSQL 17.11. The role is not a superuser and has `rolbypassrls`. That database role name is the normal result of the Supabase pooler login. It is not the Production project ref.

## Connection

One session ran `BEGIN READ ONLY`, then `SET LOCAL default_transaction_read_only = on`. `transaction_read_only` was `on`. The session ended with `ROLLBACK`. No article rows, audit JSON, review-note text, or personal data were selected. Prisma was not used.

## Live schema

Both tables exist in `public` as ordinary tables. Metadata was visible. Row security is enabled on both, and `pg_policies` returned no policies for either table.

`ArticleResearchAudit` columns, in order:

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

`specificationVersion` is absent. `disputes` is absent.

Primary key: `id`. Foreign key: `articleId` references `public."Article"("id")` on delete cascade and on update cascade. Indexes: the primary key and `ArticleResearchAudit_articleId_idx` on `articleId`. The other constraints are PostgreSQL 17 not-null checks.

`ArticleReviewNote` columns, in order:

| Column | Type | Nullable | Default |
|---|---|---|---|
| id | text | no | none |
| articleId | text | no | none |
| action | text | no | none |
| note | text | yes | none |
| reviewer | text | no | `'system'::text` |
| createdAt | timestamp without time zone | no | CURRENT_TIMESTAMP |

Primary key: `id`. Foreign key: `articleId` references `public."Article"("id")` on delete cascade and on update cascade. Indexes: the primary key, `ArticleReviewNote_articleId_idx`, and `ArticleReviewNote_action_idx`.

These columns, nullability, defaults, keys, and indexes match `prisma/schema.prisma`. The Prisma models also omit `specificationVersion` and `disputes`. Tracked migrations do not create either table.

## Migration assessment

The two nullable columns can be proposed. They cannot be executed under this inspection.

The safe shape, after a separate approval, is one additive change on the existing `ArticleResearchAudit` table:

- `specificationVersion` `TEXT NULL`
- `disputes` `JSONB NULL`

No default, backfill, index, unique constraint, or rewrite. A null `specificationVersion` remains a baseline audit. Do not add either field to `ArticleReviewNote`. Do not create the tables from Prisma. Do not derive the change with `prisma migrate diff` or `prisma db push`: the migration history does not create these tables, so a generated diff can emit unrelated DDL.

Deploy the previous application revision first if the columns later need to be rolled back, and leave the columns in place. Adding the columns does not authorise versioned scoring. Prepare for Review still writes `article-grounded-v14`.

The inspection role can write and bypasses row security. The read-only transaction is what kept this session from changing data. A later migration needs its own approval and must not disable row security.
