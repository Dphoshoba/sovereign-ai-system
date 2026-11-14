# Milestone 3Y conditional migration plan

Status: **not executed**. This file is not a Prisma migration and must not be copied into `prisma/migrations`.

## Why it is pending

The release worktree has no `DATABASE_URL` or `DIRECT_URL`. The live `ArticleResearchAudit` table has not been inspected. Tracked migrations do not create `ArticleResearchAudit` or `ArticleReviewNote`. A migration that assumed those tables already exist, or that created them from the Prisma model, would be unsafe.

No `prisma db push`, `prisma migrate deploy`, or schema-changing SQL has been run for this milestone.

## Prerequisite

Before any migration artifact is written:

1. Independently verify a non-Production database. A variable name is not proof.
2. Reject any URL whose identity includes the Production Supabase project `kqptdgbttfuqkzxzbazw`.
3. Inspect metadata only: whether `ArticleResearchAudit` exists and which columns it already has.
4. Stop if the table is absent. Do not create it from this plan.

## Intended change, after that inspection

If the table exists and both columns are absent, add only:

- `specificationVersion` `TEXT NULL`
- `disputes` `JSONB NULL`

No default, backfill, index, unique constraint, or rewrite of existing rows. `NULL` `specificationVersion` remains a baseline audit. Do not add `contentFingerprint` to the audit table. Do not add either field to the review-note JSON. That note accepts exactly six keys.

## Rollback

Deploy the previous application revision first. Leave the nullable columns in place. Do not drop them as the first rollback.

## Code already covered without a database

`article-grounded-v14` remains the revision written by Prepare for Review. `article-grounded-ev-reg-1` is also accepted as current and is not yet written. Versioned dispute validation is a separate function. The publication guard does not call it.
