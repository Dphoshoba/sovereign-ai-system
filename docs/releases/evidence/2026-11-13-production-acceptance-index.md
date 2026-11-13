# Production acceptance evidence — 13 November 2026

Evidence for the accepted release `3ade3125afda7399bb23874d840e03abb5ff0b11`, deployment `dpl_6qCU5AbXmVu2izXbT2BJSnvauNbe`. This index records observed checks and operator-confirmed results. It does not contain credentials, connection strings, customer records, or environment values.

## Production deployment identity

Direct Vercel deployment read on 13 November 2026:

- Deployment: `dpl_6qCU5AbXmVu2izXbT2BJSnvauNbe`
- Project: `prj_ogfO2yCJl7motADB98mCobU2Aviq` (`sovereign-ai-executive`)
- State: `READY`
- Promotion substate: `PROMOTED`
- Target: production
- Source: CLI
- Recorded commit: `3ade3125afda7399bb23874d840e03abb5ff0b11`
- Recorded branch: `integrate/production-research-integrity`
- Recorded message: `fix(security): harden capture, invitations, and claim selection`
- Dirty flag: absent from deployment metadata
- Created: 13 November 2026, 10:59:35 ACST
- Deployment host: `sovereign-ai-executive-cvw9iwkxn-davidoshoba-3659s-projects.vercel.app`
- Inspection URL: https://vercel.com/davidoshoba-3659s-projects/sovereign-ai-executive/6qCU5AbXmVu2izXbT2BJSnvauNbe
- Assigned aliases: `www.echoesandvisions.com`, `echoesandvisions.com`, `sovereign-ai-executive.vercel.app`, `sovereign-ai-executive-davidoshoba-3659s-projects.vercel.app`
- Deployment cron: `GET /api/cron/run-pipeline`, schedule `0 0 * * *`

The local checkout used for this record was clean at the same commit and branch before the documentation commit. The deployment metadata is CLI-recorded Git metadata. It is not a Git-provider clone record and it does not include a content-addressed upload hash.

## Diagnostic endpoint

The approved commit contains no `app/api/preview-identity` route. A direct unauthenticated `GET https://www.echoesandvisions.com/api/preview-identity` returned HTTP 404, `text/html`, 9090 bytes, and did not return the temporary diagnostic result values.

## Operator-confirmed database security

Confirmed by the operator for Production Supabase project `kqptdgbttfuqkzxzbazw`:

- 212 ordinary public tables
- RLS enabled on 212
- RLS disabled on 0
- FORCE RLS on 0
- Public RLS policies: 0
- `anon` and `authenticated` have no effective SELECT, INSERT, UPDATE, or DELETE on those tables
- `service_role` privileges preserved
- Scheduled physical backups available
- Production `DATABASE_URL` target matched the intended project on operator dashboard inspection

These database results were not re-queried for this index. Database restore was not tested. The complete verification script's ownership and bypass checks were not independently confirmed.

## Authentication and authorization probes

Unauthenticated requests to `https://www.echoesandvisions.com` on 13 November 2026, with no request body retained:

| Request | Result |
| --- | --- |
| `GET /api/articles` | HTTP 401, `AUTHENTICATION_REQUIRED`, 104 bytes |
| `GET /api/subscribers/export` | HTTP 401, `AUTHENTICATION_REQUIRED`, 104 bytes |
| `GET /api/clients` | HTTP 401, `AUTHENTICATION_REQUIRED`, 104 bytes |
| `POST /api/articles/approve` | HTTP 401, `AUTHENTICATION_REQUIRED`, `articleUnchanged: true` |
| `POST /api/articles/publish-package` | HTTP 401, `AUTHENTICATION_REQUIRED`, `articleUnchanged: true` |
| `POST /api/articles/schedule` | HTTP 401, `AUTHENTICATION_REQUIRED`, `articleUnchanged: true` |

Each JSON response had the keys `ok`, `code`, `error`, and `articleUnchanged`. No article, client, subscriber, or export payload was present. Production request logs for this deployment from 00:29:00Z through 00:43:10Z show these six responses as the only requests at HTTP 400 or above. Their request times are 00:42:06Z through 00:42:08Z.

## Publishing governance tests

Run locally on the approved commit on 13 November 2026 at 11:11:32 ACST, Vitest 4.1.10, duration 5.66 seconds:

- 7 test files passed
- 90 tests passed

Files:

- `tests/editorial/api-authorisation.test.ts`
- `tests/editorial/clients-route-auth.test.ts`
- `tests/editorial/publication-guard.test.ts`
- `tests/editorial/article-lifecycle-service.test.ts`
- `tests/editorial/article-lifecycle-route-coverage.test.ts`
- `tests/editorial/article-terminal-lifecycle-routes.test.ts`
- `tests/editorial/research-audit-publication-gate-route.test.ts`

The release source requires editor authorization before article approval, package publication, and scheduling. Scheduling and publication require a current audit with consensus of at least 80, source quality of at least 70, and recommendation `publish-ready`. No article was published or changed.

## Runtime acceptance window

Runtime logs for `dpl_6qCU5AbXmVu2izXbT2BJSnvauNbe` from 2026-11-13T00:29:00Z through 2026-11-13T00:42:26Z contained zero error, warning, or fatal entries. Operator-confirmed page checks in the same release acceptance were homepage PASS, administrator login PASS, admin dashboard PASS, and Clients page PASS.

## Known limitations

- `REDIS_URL` is absent. Public capture rate limiting uses per-process memory.
- The database restore procedure was not tested.
- Preview environment variable `PREVIEW_IDENTITY_DIAGNOSTIC_SECRET` remained configured at acceptance and was not removed.
- The log review covers only the initial acceptance window.
- Row-level-security evidence comes from operator SQL checks. The full verification script was not independently executed for this index.
- No screenshot, customer record, credential, or connection string is stored with this evidence.
