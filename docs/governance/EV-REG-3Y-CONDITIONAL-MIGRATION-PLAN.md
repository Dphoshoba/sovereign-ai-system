# Milestone 3Y conditional migration plan

Status: **executed on the verified Preview database.** The record is `docs/governance/EV-REG-3Y-MIGRATION-EXECUTION.md`. This file is not a Prisma migration and must not be copied into `prisma/migrations`.

## Scope

A read-only inspection of the approved Preview database is recorded in `docs/governance/EV-REG-3Y-SCHEMA-INSPECTION.md`. `ArticleResearchAudit` and `ArticleReviewNote` exist. Tracked migrations still do not create either table. The additive change was executed on that Preview database only. It remains unexecuted everywhere else.

No `prisma db push` or `prisma migrate deploy` has been run. The only schema change is the explicit Preview statement in the execution record.

## Prerequisite

The Preview identity and metadata checks are complete, and the approved SQL has been executed there. Do not create the tables from this plan, do not generate the change from the incomplete migration history, and do not run it against Production.

## Intended change

The inspection confirmed that `ArticleResearchAudit` existed and both columns were absent. The executed change added only:

- `specificationVersion` `TEXT NULL`
- `disputes` `JSONB NULL`

No default, backfill, index, unique constraint, or rewrite of existing rows. `NULL` `specificationVersion` remains a baseline audit. Do not add `contentFingerprint` to the audit table. Do not add either field to the review-note JSON. That note accepts exactly six keys.

## Rollback

Deploy the previous application revision first. Leave the nullable columns in place. Do not drop them as the first rollback.

## Code already covered without a database

`article-grounded-v14` remains the revision written by Prepare for Review. `article-grounded-ev-reg-1` is also accepted as current and is not yet written. Versioned dispute validation is a separate function. The publication guard does not call it.
