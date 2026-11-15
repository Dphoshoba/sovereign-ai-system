# CI connector validation — Supabase build env fix

Status: **local CI-only fix verified; push approval required.** Does not modify tag `ev-reg-1.0.0-preview-certified` or Production configuration.

## Cause

Calendar and Slack connector workflows run `npm run build` with no `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

`/forgot-password` is a client page that calls `createBrowserClient(...)` during static prerender. `@supabase/ssr` then fails when those env names are empty.

Evidence:

- Calendar run `43683346765` — failed at `Run npm run build`
- Slack run `43683346755` — identical failure
- Same error on earlier tag `v1.0.0-sovereign-production` (2026-11-13) — predates EV-REG-1.0.0
- Connector tests never ran (skipped after build failure)

GitHub Actions repo secrets and variables listed none for these keys. Path filters do not suppress tag pushes, so the certified release tag re-triggered the workflows.

## Fix

On maintenance branch `fix/ci-connector-supabase-build-env`, both workflows set CI-only placeholder public env values on the build step only:

- `NEXT_PUBLIC_SUPABASE_URL=https://ci-build-placeholder.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=ci-build-placeholder-anon-key-not-a-secret`

These are not Preview (`emmzoeeaznhpwevqprkn`) or Production (`kqptdgbttfuqkzxzbazw`) credentials. No application code, Production config, or certified tag was changed.

## Verification (local, maintenance branch)

| Check | Result |
|---|---|
| `npm run build` with CI placeholders | exit 0; `/forgot-password` static; no Supabase init error |
| Build log secret scan | only placeholder host/key strings; no Production/Preview project refs |
| `tests/connectors/calendar.test.ts` + `slack.test.ts` | 2 files / 52 passed |
| `connector:validate --name=slack` | VALID 100/100 |
| `connector:validate --name=calendar` | pre-existing INCOMPLETE 95/100 (`Client: read()` missing) — unrelated to this env fix |

Certified tag `ev-reg-1.0.0-preview-certified` and branch `integrate/production-research-integrity` were not moved.

## Optional follow-up (not in this fix)

- Add real non-Production Actions variables later if CI must talk to a live Supabase project.
- Narrow `on.push` with `branches:` so release tags do not run connector workflows.
- Drop the full app build from connector jobs if only connector tests are required.
- Separate ticket for calendar `api-client.ts` missing `read()` (pre-existing connector score gap).
