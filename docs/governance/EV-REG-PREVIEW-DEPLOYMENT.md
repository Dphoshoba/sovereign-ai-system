# Controlled Preview deployment

Status: **Preview deployment verified. Versioned scoring remains off.** This record does not authorise Production promotion or verifier activation.

## Deployment identity

| Field | Value |
|---|---|
| Local HEAD | `4865170405e178b4594f2090f0ff77911745e343` |
| Branch | `integrate/production-research-integrity` |
| Project | `sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`) |
| Team | `davidoshoba-3659s-projects` |
| Deployment | `dpl_AJuRTkkGfxQrSBTrr7bi3eqKMNiB` |
| Environment | `preview` |
| Target | `preview` |
| Ready state | `READY` |
| Preview URL | `https://sovereign-ai-executive-9m7hew4i8-davidoshoba-3659s-projects.vercel.app` |
| Inspector | `https://vercel.com/davidoshoba-3659s-projects/sovereign-ai-executive/AJuRTkkGfxQrSBTrr7bi3eqKMNiB` |
| Production URL on this deployment | `null` |
| Spec SHA-256 | `9D3C34F1689BBC0DB673A5E0A3B79A11B343C2792D4F9179BFA8E29E5ECC2419` |

Deployed with `npx vercel deploy --yes` after linking the existing project. `--prod` was not used. No new Vercel project was created. GitHub push was not required for this CLI Preview deploy, so the remote branch was left unpushed.

## Pre-deploy verification

- Working tree clean at the authorised commit.
- `VERSIONED_EDITORIAL_VERIFIER_ENABLED` is `false`.
- Local `.env.local` Preview URL host `emmzoeeaznhpwevqprkn.supabase.co`; anon JWT `ref` `emmzoeeaznhpwevqprkn`, `role` `anon`; `DATABASE_URL` username `postgres.emmzoeeaznhpwevqprkn` on the approved pooler host. Production ref `kqptdgbttfuqkzxzbazw` absent.
- Vercel Preview public settings: `NEXT_PUBLIC_SUPABASE_URL` and anon key match project `emmzoeeaznhpwevqprkn`. `DATABASE_URL` is a Preview Secret and cannot be pulled; the runtime uses `databaseUrlForRuntime`, which rejects a non-approved Preview URL when `VERCEL_ENV=preview`. No Production ref appeared in the pulled Preview env file.
- `npx tsc --noEmit --pretty false --incremental false` exited 0 (`NODE_OPTIONS=--max-old-space-size=8192`).
- Docker 29.9.2 responded. Full editorial suite: 99 files / 1,123 tests passed.
- `npm run build` exited 0; 656 static pages. Generated `gamma/research/index.json` restored.

## Post-deploy verification

| Check | Result |
|---|---|
| Deployment ready | Ready, target preview |
| Production aliases | Still on prior Production deploy `cvw9iwkxn` for `www.echoesandvisions.com` and `echoesandvisions.com` |
| `GET /api/health` via `vercel curl` | 200 |
| `GET /login` via `vercel curl` | 200 |
| `GET /api/articles` via `vercel curl` | 401 `AUTHENTICATION_REQUIRED` |
| `POST /api/research/publication-gate` via `vercel curl` | 401 `AUTHENTICATION_REQUIRED` |
| Direct public curl without SSO | Blocked by Vercel Deployment Protection (expected) |
| Preview DB columns (local read-only) | `specificationVersion` text null, `disputes` jsonb null, no defaults; RLS enabled; rolled back |
| Prepare for Review revision | Still `article-grounded-v14` |
| Versioned verifier | Still disabled |
| Legacy publication JSON | Still sets `articlePublicationAuthorised: false` |
| Production health | `https://www.echoesandvisions.com/api/health` returned 200 |
| Article audit / approval / publish | Not performed |

## Warnings

- CLI Preview deploys do not attach GitHub commit metadata. The authorised local HEAD at deploy time was `48651704`.
- `vercel link` appended `VERCEL_OIDC_TOKEN` to ignored `.env.local`. Preview identity fields remained correct.
- Vercel Deployment Protection requires `vercel curl` or SSO for Preview URL checks.
- Cold Docker can fail the disposable PostgreSQL suite; confirm the daemon before the full editorial run.

## Rollback

Redeploy the previous Preview revision, or leave this Preview unused. Do not change Production aliases. Leave the nullable Preview audit columns in place.

## Next human boundary

Approve activation of versioned scoring inside Prepare for Review on Preview only. That approval does not authorise Production, article audit, approval, scheduling, or publication.
