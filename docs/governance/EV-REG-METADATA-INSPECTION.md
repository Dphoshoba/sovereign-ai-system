# Metadata-only inspection of the audit tables

This procedure does not authorise a connection, a migration, or a data change. Run it only after the database identity checks below succeed.

## Identity checks

1. The URL is supplied outside the repository. Do not print it, commit it, or paste it into chat.
2. Reject the URL when it contains Supabase project `kqptdgbttfuqkzxzbazw`.
3. Accept it only when all of these match `src/lib/preview-postgres.ts`:
   - host `aws-0-ap-southeast-2.pooler.supabase.com`
   - port `5432`
   - database `postgres`
   - username `postgres.emmzoeeaznhpwevqprkn`
4. Reject `sslmode=disable` and `sslmode=no-verify`.
5. Stop if any check fails. Do not connect.

## Session

Open one session and make it incapable of writing:

```sql
BEGIN READ ONLY;
SET LOCAL default_transaction_read_only = on;
```

The role needs `CONNECT` on the database and permission to read `information_schema.columns`. It does not need table-owner rights, `INSERT`, `UPDATE`, `DELETE`, or `ALTER`.

## Query

Record only table presence, column name, data type, and nullability. Do not select article rows, audit JSON, or review-note text.

```sql
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('ArticleResearchAudit', 'ArticleReviewNote')
ORDER BY table_name, ordinal_position;
```

Then:

```sql
ROLLBACK;
```

## How to read the result

- No rows for a table: the table is absent. Stop. Do not create it from Prisma or from the tracked migration history.
- The table exists and `specificationVersion` or `disputes` is absent: that is the precondition for a later, separately approved nullable addition. Do not add the columns in this session.
- Any other shape: stop and report the column names only.

A `READ ONLY` transaction that is rolled back cannot update, delete, or alter rows. Do not follow this procedure with `prisma db push`, `prisma migrate deploy`, or an unqualified `SELECT *`.
