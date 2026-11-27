# Supabase security assessment

**Status:** Read-only assessment. No migration was executed. No application behaviour was changed. No production rows were modified.

**Assessment date:** 2026-10-30

**Continuation:** 2026-10-30. Sibling-project mapping, current Next.js auth gates, and regression tests were added. Production login JavaScript on `https://sovereign-ai-executive.vercel.app/login` inlines host `kqptdgbttfuqkzxzbazw.supabase.co`. Anonymous Data API probes were repeated (status and `Content-Range` only). Production SQL was still not executed.

**Scope:** Repository `echoes-visions-nextjs-cta`, plus read-only catalog queries and anonymous Data API status checks against the single database configured in the local `.env`. Local sibling applications were mapped by host class only.

**Additional evidence still required:** Vercel private env (`DATABASE_URL`) was not read. The production login bundle’s public Supabase host matches local `.env`. The Supabase Security Advisor dashboard was not available. See the closing section.

This document does not supersede an earlier assessment. `docs/security/` did not exist before this report. The proposed SQL files link to this path in their header comments. No application code imports it.

## Verified repository state

| Item | Verified value |
| --- | --- |
| Branch | `gamma` |
| HEAD | `fcb3a406cacb82aad6614c2f43a38ec6868cce56` |
| HEAD subject | `fix(publishing): show publish action for approved articles` |
| Working tree | Dirty. The security files read for this assessment were not in the dirty list, except `package.json`, which was not diffed. |

Dirty paths observed and left untouched:

- Modified: `.gitignore`, `OmniRoute`, `app/admin/autonomous-pipeline/page.tsx`, `app/sovereign-ai/page.tsx`, `content/blog/ai-tools/stop-building-ai-start-running-your-business-with-it.mdx`, `lib/platform/execution/provider-contracts/social-provider.ts`, `package.json`, `src/lib/executive/recommendations.ts`, `tests/executive-intelligence/executive-intelligence.test.ts`
- Untracked: `app/api/social/oauth/facebook/`, `app/api/social/oauth/threads/`, `app/api/social/publish/facebook/`, `app/api/social/publish/threads/`, `app/data-deletion/`, `app/focus/`, `app/privacy/`, `app/terms/`, `review-artifacts/`, `scripts/check-platform-deps.mjs`, `scripts/reinstall-platform-deps.mjs`, `src/lib/focus/`, `tests/focus/`, `types/`, `docs/security/`, `tests/security/supabase-rls-proposal.test.ts`

Nothing was committed, pushed, or deployed.

## Application-to-Supabase project mapping

Local environment files were inspected for names and non-secret connection metadata only. Secret values were not copied into this report.

| Source | Present | Database | Supabase URL project ref |
| --- | --- | --- | --- |
| `.env` | Yes | Supabase pooler, database `postgres`, login role `postgres`, port `6543`. Password is set. `sslmode` is absent from the URL. | `kqptdgbttfuqkzxzbazw` |
| `.env` `DIRECT_URL` | Yes | Same project ref, pooler port `5432`, same login role and database name. | `kqptdgbttfuqkzxzbazw` |
| `.env.local` | Yes | Does not define `DATABASE_URL`, `DIRECT_URL`, or Supabase variables. | Not set in this file |
| `.env.production`, `.env.development`, `.env.production.local` | No | — | — |
| Vercel project env | Not read | **UNKNOWN** (private `DATABASE_URL` unread) | **Confirmed public host** from production `/login` JS: `kqptdgbttfuqkzxzbazw` |

`NEXT_PUBLIC_SUPABASE_URL`, `DATABASE_URL`, and `DIRECT_URL` in `.env` all identify project `kqptdgbttfuqkzxzbazw`. Production `https://sovereign-ai-executive.vercel.app/login` inlines the same public host. That is not a read of Vercel `DATABASE_URL`.

The same ref appears in editorial test fixtures as a public storage URL. Those fixtures corroborate the ref. They are not a second database.

Relevant variable names in `.env`:

- `NEXT_PUBLIC_SUPABASE_URL` (set)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set)
- `SUPABASE_SERVICE_ROLE_KEY` (set, server-only name)
- `DATABASE_URL` (set)
- `DIRECT_URL` (set)
- `CRON_SECRET` (set)
- `CRON_JOB_KEY` (set). No TypeScript reference to `CRON_JOB_KEY` was found.

`prisma.config.ts` reads only `DATABASE_URL`. Application TypeScript does not read `DIRECT_URL` or `PRISMA_DATABASE_URL`.

There is no `supabase/config.toml` and no checked-in Supabase CLI project.

## Database access architecture

```text
Browser
  createBrowserClient(anon key)  -> Supabase Auth only
        login, forgot-password, reset-password

Middleware and server
  createServerClient(anon key)   -> supabase.auth.getUser / signOut
        /admin pages, editor route checks

Service role
  createClient(service role)     -> storage upload only
        lib/storage/article-images.ts
        bucket article-images

Prisma
  PrismaPg(DATABASE_URL)         -> all application tables
        src/lib/prisma.ts is the client selected by tsconfig path @/*
        login role on the verified database: postgres (BYPASSRLS)
```

Verified client locations:

- Browser auth: `app/login/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- Server auth: `src/lib/supabase/server.ts`, `middleware.ts` (matcher `/admin/:path*` only), `app/admin/layout.tsx`
- Service role: `lib/storage/article-images.ts` calls `storage.from(bucket).upload` and `getPublicUrl`. No service-role `.from(table)` query was found.
- No repository use of PostgREST `.from("Table")` or `.rpc(` for application tables was found.

Two Prisma modules exist:

- `src/lib/prisma.ts` is the runtime client (`@/*` maps to `./src/*`). It always enables Prisma query logging.
- `lib/prisma.ts` is a second client without query logging. The `@/` alias does not select it.

Prisma 7 keeps the datasource URL in `prisma.config.ts`, not in `prisma/schema.prisma`. The schema has no `@@schema` and no `@@map`, so model names are the public table names. There are 219 models and 66 SQL migrations. None of those migrations contain `ROW LEVEL SECURITY`, `CREATE POLICY`, `GRANT`, `REVOKE`, or `SECURITY DEFINER`.

### Authorisation boundaries

| Boundary | What it actually checks |
| --- | --- |
| `middleware.ts` | Any Supabase user may open `/admin`. No role lookup. `/api` is outside the matcher. |
| `requireEditorAuth()` | Any Supabase user. Actor becomes `user.email` or `user.id`. `UserRole` is not consulted. |
| `authorizeCronRequest()` | Bearer token compared with `CRON_SECRET` using a hash and `timingSafeEqual`. Empty secret fails closed. |
| `lib/security/operator-auth.ts` | Contract preview only. `providerIntegrated` is false. No API route calls `requireRole` or `requirePermission`. |
| Prisma | Connects as `postgres`, which bypasses RLS. Application routes are the only authorisation layer for table rows. |

`UserRole` is written from `prisma/seed.ts`. No API route reads it.

Public article pages are server-rendered through Prisma and filter `status: "published"` (`app/blog/[slug]/page.tsx`). That filter is not a database policy.

## Live database evidence

Read-only session against `.env` `DATABASE_URL`. `default_transaction_read_only` was set. No application table rows were selected. Anonymous HTTP checks used `select=id&limit=0` and discarded bodies.

Session role:

- `current_user`: `postgres`
- `rolsuper`: false
- `rolbypassrls`: true

| Schema | Tables | RLS on | RLS off | FORCE RLS | Views |
| --- | ---: | ---: | ---: | ---: | ---: |
| `public` | 212 | 0 | 212 | 0 | 0 |
| `storage` | 8 | 8 | 0 | 0 | 0 |
| `auth` | 27 | 16 | 11 | 0 | 0 |
| `realtime` | 2 | 0 | 2 | 0 | 0 |
| `vault` | 1 | 0 | 1 | 0 | 1 |

`pg_policy` count for the whole database: **0**. There are no `USING` or `WITH CHECK` expressions to review.

Public grants, each counted across all 212 tables:

| Grantee | Privileges |
| --- | --- |
| `anon` | `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER` |
| `authenticated` | same seven privileges |
| `service_role` | same seven privileges |

`PUBLIC` had no public-table grants in `information_schema.role_table_grants`. Sequence usage grants for `anon`, `authenticated`, and `service_role` in `public` were empty.

Default privileges still grant new `public` tables, sequences, and functions to `anon`, `authenticated`, and `service_role` for both `postgres` and `supabase_admin`. The next table created by either role inherits the same exposure unless those defaults change.

Other live facts:

- `public._prisma_migrations` is absent. This database has tables, and it does not have Prisma's migration history table.
- All 212 public tables match Prisma models. Seven Prisma models have no table: `Connector`, `ConnectorConnection`, `ConnectorAction`, `ConnectorExecution`, `ConnectorApproval`, `ConnectorAudit`, `ConnectorCredential`.
- No extra public tables exist outside the Prisma model list.
- No `SECURITY DEFINER` functions exist in `public` or `storage`.
- `storage.buckets` row `article-images` has `public = true`.
- Security Advisor: **UNKNOWN**. No advisor API or dashboard export was available.

Anonymous Data API, project `kqptdgbttfuqkzxzbazw`, bodies discarded:

| Request | Result |
| --- | --- |
| `GET /rest/v1/Article?select=id&limit=0` | HTTP 206, body 2 bytes, `Content-Range */135` |
| `GET /rest/v1/Subscriber?select=id&limit=0` | HTTP 206, body 2 bytes, `Content-Range */6` |
| `GET /rest/v1/ClientProfile?select=id&limit=0` | HTTP 206, body 2 bytes, `Content-Range */5` |
| `GET /rest/v1/OrganizationInvitation?select=id&limit=0` | HTTP 200, body 2 bytes, `Content-Range */0` |
| `GET /rest/v1/IdentitySession?select=id&limit=0` | HTTP 200, body 2 bytes, `Content-Range */0` |
| `GET /rest/v1/AuditEvent?select=id&limit=0` | HTTP 200, body 2 bytes, `Content-Range */0` |
| `GET /rest/v1/ConnectorCredential?select=id&limit=0` | HTTP 404, PostgREST `PGRST205` (table is not in the API because it is not in the database) |
| `GET /rest/v1/not_a_real_table_probe?select=id&limit=0` | HTTP 404, `PGRST205` |
| `POST /storage/v1/object/list/article-images` with prefix `""` and limit 1 | HTTP 200, empty array. This does not prove that objects can or cannot be listed. |
| `GET` of a non-existent public object path | HTTP 400 |
| `HEAD` of one production public object under `article-images/` | HTTP 200, `Content-Length` 1305847. Body not downloaded. Path recorded without query string. |

Auth tables with RLS disabled, left unchanged because they are platform tables: `custom_oauth_providers`, `mfa_recovery_code_sets`, `mfa_recovery_codes`, `oauth_authorizations`, `oauth_client_states`, `oauth_clients`, `oauth_consents`, `scim_tokens`, `scim_users`, `webauthn_challenges`, `webauthn_credentials`. Whether the Data API exposes schema `auth` was **not** tested.

## Confirmed findings

1. **Anonymous Data API access to every existing public table is open.** RLS is off, and `anon` has full DML including `TRUNCATE`. The anonymous key is a `NEXT_PUBLIC` value, so it is available to every browser. Probes confirmed `Article` (`*/135`), `Subscriber` (`*/6`), and `ClientProfile` (`*/5`) respond to the anon key with HTTP 206. Row contents were not stored.
2. **`authenticated` and `service_role` have the same table privileges.** `service_role` also bypasses RLS on Supabase even after RLS is enabled, so a leaked service-role key remains a full-table credential unless its grants are revoked. The application uses that key for storage uploads only.
3. **There is no row owner on `Article`.** `approvedBy` is an actor string. Cross-user and cross-tenant database policies cannot be expressed for articles until a real owner column exists. Enabling a permissive policy would be weaker than denying API roles.
4. **Several Next.js routes still read or write the database with no session check.** Middleware does not cover `/api`. Re-read on continuation:
   - `GET /api/articles`, `GET /api/subscribers/export`, and `POST /api/publishing/update-status` now call `requireEditorAuth` before Prisma. Tests in `tests/editorial/api-authorisation.test.ts` cover that gate.
   - `GET /api/clients` still returns client profiles, including email and phone, with no session check.
   - `GET /api/ai/memory` and `POST /api/ai/memory` still read and write memory rows with no session check.
   - `POST /api/newsletter/subscribe` still inserts or updates `Subscriber` and returns the row.
   - `POST /api/newsletter/send` still loads a newsletter with no auth call before the query.
   - `POST /api/discovery/scheduled-run` and `POST /api/discovery/run-autonomous` remain unauthenticated. `GET /api/cron/run-pipeline` checks `CRON_SECRET`, then calls discovery without forwarding that secret.
   These Prisma routes stay reachable after the proposed SQL, because Prisma uses `postgres` (`BYPASSRLS`). They are application defects, not a reason to skip the Data API revoke.
5. **Editor authentication is not role-based.** Any Supabase user passes `requireEditorAuth` and the admin middleware.
6. **The runtime Prisma client logs every query** (`src/lib/prisma.ts`), including in production, because the log option is unconditional.
7. **Default privileges will recreate the exposure** for tables created later by `postgres` or `supabase_admin`.
8. **Storage bucket `article-images` is public.** That matches `getPublicUrl` for featured images. Storage RLS is enabled and there are zero storage policies, which is a default deny for roles that do not bypass RLS. A production object URL on `/blog` returned `HEAD` HTTP 200. That is the justified public-read exception, not a table grant.

A static scan found 267 `app/api/**/route.ts` files that reference Prisma and do not contain `requireEditorAuth`, `getUser(`, or the cron authoriser. That count is a file-level heuristic. Routes whose auth lives only on some HTTP methods are mis-classified by it. `app/api/articles/route.ts` now authenticates `GET` with `requireEditorAuth` and `POST` with `getUser`. Finding 4 lists the handlers that were re-read. The other heuristic routes were not each executed.

## Unverified items

| Item | State |
| --- | --- |
| Vercel production `DATABASE_URL` | **UNKNOWN**. Private env was not read. |
| Vercel production public Supabase host | **Confirmed** `kqptdgbttfuqkzxzbazw.supabase.co` from `/login` JS on `https://sovereign-ai-executive.vercel.app` |
| Any second Supabase project | **Found locally:** `clientflow` → `smzkjbrpglgstjevlfuw` (15 Prisma models). Not catalog-queried. Not assumed to share Echoes data. |
| Supabase Security Advisor findings | **UNKNOWN** |
| Wire encryption for the pooler session | **UNKNOWN**. The URL has no `sslmode`. The driver connected. TLS was not independently recorded. |
| Data API exposure of `auth`, `vault`, and `realtime` | **UNKNOWN** |
| Whether anon can read an existing `article-images` object | **Confirmed** `HEAD` HTTP 200 on one production public object. Body not downloaded. |
| Whether every heuristic API route is reachable without a session | **UNKNOWN** except the handlers read above |
| Live behaviour of editorial governance | `tests/editorial/publication-guard.test.ts` and `tests/editorial/api-authorisation.test.ts` passed on continuation (16 tests in those two files, plus 7 security-proposal tests). Concurrent live requests were not executed. |

## Table-by-table exposure matrix

Uniform live posture for every public table that exists:

| Column | Value for all 212 live tables |
| --- | --- |
| Schema | `public` |
| Prisma access | Server, via `DATABASE_URL` as `postgres` (bypasses RLS) |
| Browser Supabase table access | None found |
| Server Supabase table access | None found |
| Service-role table access | No `.from(table)` usage found. Key exists and is used for storage. |
| RLS | Disabled. `relforcerowsecurity` false. |
| Policies | None |
| Grants | `anon`, `authenticated`, and `service_role` have full table privileges |
| Security Advisor | **UNKNOWN** |

The matrix below repeats that posture per model. "Not in connected database" means the model is in `schema.prisma` and the table was absent on 2026-10-30. Those seven connector models are the only place `accessToken`, `refreshToken`, and `ConnectorCredential.value` appear. They are not live yet. Creating them under the current default privileges would expose them the same way.

Ownership columns come from the Prisma schema. They are not enforced by RLS. `email` is listed as an ownership field only where the column exists; it is not `auth.uid()`.

`EmailExecution` has no column named `email`. Its recipient column is `to`, and the automated sensitive-column scan missed it. Treat `to` and the message body as sensitive.

| Model | Schema | Live table | Ownership columns | Sensitive columns | Prisma | Browser Supabase | Server Supabase tables | Service role | RLS | Grants | Advisor | Risk | Remediation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Role` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `Permission` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RolePermission` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `UserRole` | `public` | `Present` | `userId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `Article` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ArticleReviewNote` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ResearchSource` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ResearchFact` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ArticleEmbedding` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AuditEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiMemory` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiJob` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ClientProfile` | `public` | `Present` | `email` | `email, phone` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ClientProject` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ClientProjectTask` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ClientInvoice` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveBriefing` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiWorkflow` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiDepartment` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiAgent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiScheduledOperation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiPermissionRule` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiApprovalRequest` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RevenueRecord` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RevenueInsight` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `KnowledgeNode` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `KnowledgeEdge` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiAutonomousAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorLead` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorNurtureEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorLeadInsight` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorAuditRequest` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorAutomationAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorProposal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorInvoice` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorRevenueEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorLearningMemory` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CreatorLearningRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveAgent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveAgentRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AgentDelegation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AgentCollaborationSession` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AutonomousMissionCycle` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AutonomousMissionTask` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `OperationalEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PredictiveForecast` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicSimulation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `OptimizationRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `OptimizationAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ToolExecutionAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveCopilotConversation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveCopilotMessage` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExternalIntegration` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExternalOperationLog` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EmailExecution` | `public` | `Present` | `—` | `to, message body` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowAutomationRule` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowAutomationRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowAutomationStep` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowDefinition` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowExecution` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `OrchestrationKernelRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `OrchestrationDecision` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RuntimeObjective` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RuntimeHeartbeat` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RuntimeMemorySnapshot` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RuntimeRetryQueue` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EvolutionRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EvolutionInsight` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EvolutionPolicyRecommendation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicPlan` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicInitiative` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `QuarterlyGoal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PlanningCycle` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveBoardroomSession` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveDecision` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveLesson` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveKnowledgeNode` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveKnowledgeEdge` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicScenario` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveQuarterlyReview` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategyAdjustment` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicDecisionLog` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernancePolicy` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernanceArbitration` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernanceApproval` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernanceRiskSignal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExternalSignalSource` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExternalIntelligenceSignal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExternalWorldScan` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CognitiveEntity` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CognitiveRelation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CognitiveSynthesisRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CognitiveInsight` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveOperationCampaign` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveOperationTask` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveCommandDecision` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutiveOperationalPulse` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EconomicIntelligenceRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RevenueOpportunity` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EconomicCampaign` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EconomicDecision` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `TemporalSimulationRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FutureScenario` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicTimelineEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `TemporalRecommendation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederatedNode` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationSignal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationCouncilSession` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationAgreement` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RecursiveEvolutionCycle` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ArchitectureObservation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SelfOptimizationProposal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `InstitutionalMutation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EvolutionMemory` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorldModelRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PlanetarySignal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CivilizationScenario` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorldModelRecommendation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SovereignRuntimeSnapshot` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SovereignRuntimePriority` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SovereignRuntimeAction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SovereignIntelligenceRoute` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernanceRole` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernanceActor` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ConstitutionalPolicy` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ExecutionAuthorizationRequest` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `GovernanceAuditTrail` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `InfrastructureHealthCheck` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ResilienceIncident` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ResiliencePolicy` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ResilienceRetryJob` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `InfrastructureEventTrace` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SovereignOrganization` | `public` | `Present` | `ownerEmail` | `ownerEmail` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `OrganizationWorkspace` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `OrganizationMember` | `public` | `Present` | `organizationId, email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `TenantIntelligenceRecord` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `TenantGovernancePolicy` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `TenantRuntimeSnapshot` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `IdentityUser` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `IdentitySession` | `public` | `Present` | `userId, email, organizationId` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `OrganizationInvitation` | `public` | `Present` | `organizationId, email` | `email, token` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `AccessDecisionLog` | `public` | `Present` | `userId, email, organizationId` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `TenantAccessPolicy` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RealtimeEventStream` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RealtimeEventMessage` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `DistributedWorkerNode` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `DistributedExecutionJob` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `RealtimeFabricRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `BillingPlan` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `TenantSubscription` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `UsageMeterEvent` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `TenantQuotaState` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `BillingInvoiceRecord` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `BillingIntelligenceRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SemanticKnowledgeRecord` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SemanticEmbeddingIndex` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `KnowledgeGraphNode` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `KnowledgeGraphEdge` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SemanticMemoryQuery` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `KnowledgeGraphSynthesisRun` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ReasoningSimulationRun` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicDecisionOption` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `DecisionConsequenceModel` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ReasoningRecommendation` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ActionMission` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ActionExecutionStep` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AgentExecutionAssignment` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ActionCoordinationRun` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ActionOutcomeRecord` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EvolutionOptimizationRun` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `EvolutionImprovementProposal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AgentPerformanceProfile` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorkflowEvolutionPattern` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `InstitutionalEvolutionMemory` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederatedMeshNode` | `public` | `Present` | `organizationId` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederatedIntelligencePacket` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationCoordinationSession` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationAllianceProtocol` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `MeshAgentSociety` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `FederationMeshRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `WorldModelV2Run` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PlanetaryDomainSignal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PlanetaryScenarioV2` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicPostureModel` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PlanetaryStressTest` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `StrategicShockModel` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PlanetaryRecommendationV2` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `NewsletterSubscriber` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `ContentOperatingItem` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PublishingCadenceGoal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `YouTubePublishingAsset` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `YouTubeIntelligenceRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PublishingWorkflowEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AudienceProfile` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `AudienceInteraction` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AudienceTopicSignal` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `CommunityInsightRun` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AiActivityEvent` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `NewsletterDraft` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `Newsletter` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `SocialPost` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `YouTubePost` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `PublishingQueue` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `AgentMemory` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `VideoPerformanceMemory` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `Subscriber` | `public` | `Present` | `email` | `email` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `Critical` | `Include in the proposed public revoke and ENABLE RLS` |
| `LeadMagnet` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `MonthlySnapshot` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `ArticleResearchAudit` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `DiscoveredTopic` | `public` | `Present` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `Off` | `anon, authenticated, service_role: full DML` | `UNKNOWN` | `High` | `Include in the proposed public revoke and ENABLE RLS` |
| `Connector` | `public` | `Absent` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |
| `ConnectorConnection` | `public` | `Absent` | `userId, email` | `email, accessToken, refreshToken` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |
| `ConnectorAction` | `public` | `Absent` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |
| `ConnectorExecution` | `public` | `Absent` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |
| `ConnectorApproval` | `public` | `Absent` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |
| `ConnectorAudit` | `public` | `Absent` | `—` | `—` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |
| `ConnectorCredential` | `public` | `Absent` | `—` | `key, value` | `Yes, server` | `No` | `No` | `Storage only; no table query found` | `UNKNOWN (no table)` | `UNKNOWN (no table)` | `UNKNOWN` | `Not in connected database` | `Do not create until public default privileges no longer grant anon` |

### Critical tables, called out

| Table | Why it is critical | Live anon read probe |
| --- | --- | --- |
| `Article` | Drafts, review notes, and unpublished content. No owner column. `GET /api/articles` also returns every row. | HTTP 206, non-empty |
| `Subscriber` | Email addresses. Export route has no auth. Subscribe route returns the row. | HTTP 206, non-empty |
| `NewsletterSubscriber` | Email addresses. | Not separately probed. Same grants and RLS posture. |
| `ClientProfile` | `email` and `phone`. `GET /api/clients` has no auth. | Not separately probed. Same posture. |
| `OrganizationInvitation` | `token` and `email`. | HTTP 200, empty table |
| `IdentityUser`, `IdentitySession`, `OrganizationMember` | Identity and membership data. `IdentitySession` is not the Supabase Auth session store. | Not separately probed. Same posture. |
| `ConnectorConnection`, `ConnectorCredential` | OAuth tokens and credential values in the schema. | Table absent. API returned `PGRST205` for `ConnectorCredential`. |
| `AuditEvent` | Intended audit metadata. No `prisma.auditEvent` writer was found. Editorial history is `ArticleReviewNote`, written by `transitionArticleLifecycle`. | Not separately probed. Same posture. |

Tenant columns (`organizationId`) exist on the sovereign-organization family (`OrganizationWorkspace`, `OrganizationMember`, `TenantIntelligenceRecord`, `TenantGovernancePolicy`, `TenantRuntimeSnapshot`, billing and identity models, and others in the matrix). Nothing in RLS or in `requireEditorAuth` uses them. Expected tenant isolation is therefore **not enforced**.

## Proposed remediation

SQL is in:

- `docs/security/proposed/20261030_deny_public_api_roles.sql`
- `docs/security/proposed/20261030_deny_public_api_roles_rollback.sql`

Neither file was executed. They are not under `prisma/migrations`, so `prisma migrate` will not pick them up.

What the forward file does:

- Revokes all privileges on existing `public` tables, sequences, and functions from `PUBLIC`, `anon`, `authenticated`, and `service_role`.
- Revokes the same default privileges for role `postgres` in schema `public`.
- Enables RLS on every existing public table.
- Does **not** `FORCE` RLS. Forcing it would block the table owner. Prisma uses `postgres`, which already has `rolbypassrls`.
- Adds **no** policies. Deny is the default for roles that do not bypass RLS. `USING (true)` is not used. There is no `WITH CHECK` expression because there is no permissive policy to check.
- Leaves `storage`, `auth`, `vault`, and `realtime` alone, so featured-image upload and Supabase Auth are outside this change.
- Does not add `userId` or `organizationId` to `Article`. That would be a schema and product change, and it is not required to close the Data API hole.

An optional commented statement revokes `supabase_admin` default privileges in `public`. It is separate because it can fail when the executing role cannot alter another role's defaults. If it is skipped, tables created later by `supabase_admin` in the dashboard can become world-granted again.

Why `service_role` loses public-table grants: that role bypasses RLS, and the application does not query public tables with it. Storage grants are not revoked, so image upload can keep using the storage API. This must be regression-tested. If a human later finds a server path that needs `service_role` SQL, grant that one table back. Do not restore `anon`.

This SQL does **not** fix unauthenticated Next.js routes. Those handlers use Prisma as `postgres` and will keep working after RLS is enabled. Closing them is an application change and was intentionally not made.

No anonymous Data API access is justified. The public blog is rendered by the Next.js server through Prisma, with `status = "published"` in the query. The justified public exception is storage read of featured images, and this proposal does not change the bucket's `public` flag.

## Regression test plan

Run these after a human applies the SQL to a chosen database. Do not treat this assessment's pre-change probes as post-change results.

1. **Anonymous access to private tables.** Repeat `GET /rest/v1/Article?select=id&limit=0` and `GET /rest/v1/Subscriber?select=id&limit=0` with the anon key. Expected after the change: HTTP 401 or 403, not 200 or 206. Repeat for `OrganizationInvitation`, `ClientProfile`, `IdentitySession`, and `AuditEvent`.
2. **Authenticated access to owned records.** Sign in as a normal Supabase user and call PostgREST with that user's JWT. Expected: still denied on public tables, because no ownership policy exists and grants are revoked. The admin UI should still load articles through the Next.js server.
3. **Cross-user denial.** Two Supabase users. User A must not read user B's rows through PostgREST. Also confirm the application still lets any signed-in user through `requireEditorAuth`. That application gap is expected to remain until a separate change.
4. **Cross-tenant denial.** With two `organizationId` values present, PostgREST must not return either tenant. Application routes that ignore `organizationId` will still return both. Record that as a remaining application defect, not a SQL regression.
5. **Unauthorised inserts and updates.** Anon `POST` and `PATCH` against `Subscriber` and `Article` must fail. `POST /api/newsletter/subscribe` will still succeed until that route is changed, because it uses Prisma.
6. **Sensitive columns.** Anon `select=email` on `Subscriber` and `select=token` on `OrganizationInvitation` must fail. Confirm `GET /api/subscribers/export` is still an application exposure if it has not been patched.
7. **Service-role isolation.** A request with the service-role key against `/rest/v1/Article` must fail after the grant revoke. A featured-image upload through the admin route must still succeed. The service-role key must not appear in the JSON body (existing editorial tests already assert a canary).
8. **Prisma server workflows.** Load `/blog/[published-slug]`, `/admin/articles` while signed in, and `POST /api/articles` while signed in. Published pages stay filtered to `published`. Draft creation still requires a session.
9. **Existing admin permissions.** Confirm a signed-in user still reaches `/admin`, and a signed-out user is still redirected to `/login`. Confirm `UserRole` is still not enforced. Do not describe that as a new success condition.
10. **Article review and publishing governance.** As a signed-in editor, approve, schedule, and reject through the governed routes. Direct `PATCH` of `publishedAt` or a governed status on `/api/articles/[id]` must still return 409. `publicationGuard` must still refuse publish from `draft`, `review-required`, and `rejected`.
11. **Scheduled publishing.** `GET /api/cron/publish-scheduled` without `CRON_SECRET` returns 401. With the secret, only due scheduled articles publish. `GET /api/cron/run-pipeline` must still be unauthorised without the secret. Record, separately, that its discovery subcall does not forward the secret.
12. **Audit logging.** Approving an article still writes `ArticleReviewNote`. `AuditEvent` remains unused by application code unless a writer is found later. No audit row should be deleted by the SQL.

Also confirm:

- `relrowsecurity = true` and `relforcerowsecurity = false` on public tables.
- Zero remaining `anon` / `authenticated` / `service_role` grants on `public`.
- `storage.buckets.public` for `article-images` is still true.
- Login, logout, and password recovery still use Supabase Auth.

## Expected functionality impact

| Surface | Expected impact of the SQL alone |
| --- | --- |
| Public blog | None. Prisma reads published articles as `postgres`. |
| Admin UI and governed article routes | None, while `DATABASE_URL` stays on the bypass role. |
| Login and password recovery | None. Auth schema is not modified. |
| Featured-image upload | None expected. Storage grants and the public bucket flag stay. Must be retested. |
| Direct table access with the anon key, a user JWT, or the service-role key | Denied for `public` tables. |
| Unauthenticated Next.js data routes | Still open. |
| New public tables created by `postgres` | Not granted to API roles, if the default-privilege statements succeed. |
| New public tables created by `supabase_admin` | Still granted to API roles unless the optional default-privilege statements are applied. |
| Connector tables | Absent today. If created later by `postgres` after the default-privilege change, they will not be granted to `anon`. |

If Prisma is ever switched to a role without `BYPASSRLS` and without table ownership, every query will return no rows or fail privilege checks. Do not make that switch as part of this change.

## Rollback and recovery

1. Stop if the forward script was applied to a different project than `kqptdgbttfuqkzxzbazw`, or if Vercel is later shown to use another database. Roll back only the database that was changed.
2. Run `docs/security/proposed/20261030_deny_public_api_roles_rollback.sql` in the Supabase SQL editor for that project. It disables public RLS and restores the grants observed on 2026-10-30.
3. Re-check anon `GET /rest/v1/Article?select=id&limit=0`. A 200 or 206 means the old exposure is back.
4. The rollback does not restore row data, because the forward script does not update, delete, or truncate rows.
5. If a statement fails mid-rollback, stop and read `pg_class.relrowsecurity` and `role_table_grants` before retrying. Do not grant privileges to `anon` one table at a time as an ad hoc fix.
6. Application recovery is a redeploy only if an application patch was made separately. This assessment did not change application code.

## Sibling applications inspected on continuation

Local directories on this machine were inspected for database hosts and Prisma models. Secret values were not copied.

| Application | Prisma models | Database host class | Supabase project ref | Browser / service-role table access |
| --- | ---: | --- | --- | --- |
| `echoes-visions-nextjs-cta` | 219 | Supabase pooler `aws-1-ap-southeast-2.pooler.supabase.com:6543` | `kqptdgbttfuqkzxzbazw` | Auth and storage only. No PostgREST table queries. |
| `clientflow` | 15 | Supabase pooler `aws-0-ap-southeast-2.pooler.supabase.com:5432` | `smzkjbrpglgstjevlfuw` | None found. Prisma only. |
| `documenthub` | 15 | `localhost:3306` | Not Supabase | — |
| `Business website` | 41 | Neon `us-east-1` | Not Supabase | — |
| `server`, `servo` | 3 each | No Supabase host in `.env` | Not identified | — |

The operator-reported “32 additional affected tables across other projects” is **not** explained by Echoes & Visions application tables. The only other Supabase project found locally is `clientflow` with 15 Prisma models. Those 15 plus advisor extras on that project may be part of the 32. They were not catalog-queried in this continuation. They need their own signed SQL after a read-only catalog pass.

Regression tests added (do not connect to Production):

- `tests/security/supabase-rls-proposal.test.ts`

Continuation run: `npx vitest run tests/security/supabase-rls-proposal.test.ts tests/editorial/publication-guard.test.ts tests/editorial/api-authorisation.test.ts` — 23 passed. The tests read local SQL and source files only.

## Approval gate

Do not execute the proposed SQL until a named human records all of the following:

- [ ] The target project ref is `kqptdgbttfuqkzxzbazw`, or a newly verified ref has been written here.
- [ ] Vercel production `NEXT_PUBLIC_SUPABASE_URL` and the host of `DATABASE_URL` were compared, without copying secrets into git, and any second project has its own assessment. *(Public host confirmed from production `/login` JS as `kqptdgbttfuqkzxzbazw.supabase.co`. Vercel `DATABASE_URL` still unread.)*
- [ ] The operator accepts that unauthenticated Next.js routes stay open after this SQL.
- [ ] A backup or Supabase point-in-time recovery window is available.
- [ ] The forward script, not the rollback script, is the one to run.
- [ ] Post-checks in the regression plan are assigned to a person and a date.
- [ ] Featured-image upload is on that test list.

**Approver:**

**Date:**

**Project ref confirmed:**

**Decision:** approve / reject

## Evidence gaps

This report is complete for the database behind the local `.env` and for the repository paths that were read. It is not complete for every deployed environment.

Still required before calling the production estate closed:

1. Vercel production `DATABASE_URL` host class, compared with the confirmed public ref `kqptdgbttfuqkzxzbazw`.
2. A Security Advisor export for that project, if the dashboard has one.
3. Line-by-line review or tests for the API routes that the static scan flagged but this assessment did not open.

Closed on continuation: production `/login` public host; one `article-images` `HEAD` 200; `ClientProfile` anon probe HTTP 206 (`*/5`).

**SECURITY ASSESSMENT PARTIAL — ADDITIONAL EVIDENCE REQUIRED**

**STOP. Do not apply `docs/security/proposed/20261030_deny_public_api_roles.sql` until the approval gate above is signed by a named human for project `kqptdgbttfuqkzxzbazw`.**
