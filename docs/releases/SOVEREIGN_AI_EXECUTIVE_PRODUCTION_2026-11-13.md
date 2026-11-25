# Echoes & Visions Sovereign AI Executive — Production release

**Tag:** `v1.0.0-sovereign-production`  
**Release date:** 13 November 2026  
**Status:** Accepted with documented risks

The annotated tag points at the approved release commit. This document is a later documentation commit and is not part of that tag.

## Release identity

- Application: Echoes & Visions Sovereign AI Executive
- Release date: 13 November 2026
- Approved commit: `3ade3125afda7399bb23874d840e03abb5ff0b11`
- Branch: `integrate/production-research-integrity`
- Deployment: `dpl_6qCU5AbXmVu2izXbT2BJSnvauNbe`
- Vercel project: `prj_ogfO2yCJl7motADB98mCobU2Aviq`
- Production domain: [www.echoesandvisions.com](https://www.echoesandvisions.com)
- Previous deployment: `dpl_EqWTZ7pWo8eAQpVdJ9jwYjtotPiK`

## Database security

- Production Supabase project: `kqptdgbttfuqkzxzbazw`
- Ordinary public tables: 212
- RLS enabled: 212
- RLS disabled: 0
- FORCE RLS: 0
- Public RLS policies: 0
- `anon` and `authenticated`: no effective SELECT, INSERT, UPDATE, or DELETE privileges on those tables
- `service_role`: existing privileges preserved
- Scheduled physical backups available
- Database restore not tested
- Production `DATABASE_URL` target confirmed by operator dashboard inspection

The row-level-security counts, privilege posture, backup availability, and connection-target match are operator-confirmed. The complete verification script's ownership and bypass checks were not independently confirmed.

## Production acceptance

- Deployment Ready
- Homepage PASS
- Administrator login PASS
- Admin dashboard PASS
- Clients page PASS
- Release identity PASS
- Unauthenticated article, subscriber export, and client APIs return 401 `AUTHENTICATION_REQUIRED`
- Publishing approval, package, and scheduling endpoints reject unauthenticated POST requests
- Publishing governance regression tests: 90 PASS
- Runtime log review: no unexpected errors during the recorded acceptance window
- Cron configured at `0 0 * * *` for `GET /api/cron/run-pipeline`

Homepage, administrator login, admin dashboard, and Clients page results are operator-confirmed. The deployment identity, API responses, regression tests, log review, and cron configuration were checked directly. Evidence references are in [the acceptance index](evidence/2026-11-13-production-acceptance-index.md).

## Outstanding risks

1. `REDIS_URL` absent; public capture rate limiting uses per-process memory rather than distributed Redis.
2. Database restore procedure not tested.
3. Temporary Preview diagnostic secret `PREVIEW_IDENTITY_DIAGNOSTIC_SECRET` remains configured and requires separate cleanup.
4. Production runtime monitoring must continue beyond the initial acceptance window.
5. Production RLS verification was established through individual operator SQL checks; the complete verification script's ownership and bypass checks were not independently confirmed.

## Governance

- This release is accepted with documented risks.
- No additional features or speculative changes are included.
- The approved commit must remain unchanged.
- Future development must use a separate branch or subsequent commit.
- Production changes require separate approval.
- Database security changes require independent review and authorisation.
