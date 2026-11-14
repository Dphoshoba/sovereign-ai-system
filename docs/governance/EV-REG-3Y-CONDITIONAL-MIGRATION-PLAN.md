# Milestone 3Y conditional migration plan

Status: **not executed**. This file is not a Prisma migration and must not be copied into `prisma/migrations`.

## Why it is pending

A read-only inspection of the approved Preview database is recorded in `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`. `ArticleResearchAudit` and `ArticleReviewNote` exist and match the Prisma models. `specificationVersion` and `disputes` are absent. Tracked migrations still do not create either table. The additive change is confirmed as the proposal and remains unexecuted.

No `prisma db push`, `prisma migrate deploy`, or schema-changing SQL has been run for this milestone.

## Prerequisite

The Preview identity and metadata checks are complete. Before any migration artifact is written, a separate human approval is still required. Do not create the tables from this plan, and do not generate the change from the incomplete migration history.

## Intended change

The inspection confirmed that `ArticleResearchAudit` exists and both columns are absent. Add only:

- `specificationVersion` `TEXT NULL`
- `disputes` `JSONB NULL`

No default, backfill, index, unique constraint, or rewrite of existing rows. `NULL` `specificationVersion` remains a baseline audit. Do not add `contentFingerprint` to the audit table. Do not add either field to the review-note JSON. That note accepts exactly six keys.

## Rollback

Deploy the previous application revision first. Leave the nullable columns in place. Do not drop them as the first rollback.

## Code already covered without a database

`article-grounded-v14` remains the revision written by Prepare for Review. `article-grounded-ev-reg-1` is also accepted as current and is not yet written. Versioned dispute validation is a separate function. The publication guard does not call it.
