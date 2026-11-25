# EV-EDITORIAL-07 — Production Promotion Readiness Certificate

**Status:** READY FOR DIRECTOR PRODUCTION GO (not deployed)  
**Prepared:** 2026-11-22 (Australia/Adelaide)  
**Recommendation:** **GO** (promotion readiness only)

This certificate does **not** authorise Production deployment, merge to a Production-triggering branch, environment changes, data writes, or social distribution.

---

## Exact commit to deploy

| Role | SHA | Notes |
| --- | --- | --- |
| **Recommended Production pin** | `5bd50c6756dba94c8b3349a441e07e9b1764e38b` | Tip of `cursor/ev-editorial-07-p0u` (app + acceptance docs) |
| Application baseline (Director) | `aad3d160add901d62afdaf0d1fa18ecb856b18da` | Contained in `5bd50c67` (P1–P5) |
| Documentation completion | `5bd50c67` | Checklist + final acceptance report only vs `aad3d160` |
| Branch | `cursor/ev-editorial-07-p0u` | Pushed to `origin` |

EV-EDITORIAL-07 core commits (in order):

1. `a3cd08b0` — P0 stage runner + legacy auto-schedule lockdown  
2. `55524aa8` — P0U Director prepare UI  
3. `aad3d160` — P1–P5 composition  
4. `5bd50c67` — acceptance docs  

---

## Integration and conflict status

| Item | Finding |
| --- | --- |
| Remote branch | `origin/cursor/ev-editorial-07-p0u` @ `5bd50c67` (clean) |
| `origin/integrate/production-research-integrity` | `6ef9f3ed` |
| Merge-base with origin integrate | `6ef9f3ed` |
| Ahead of origin integrate | Release tip includes EV-EDITORIAL-07 **and** EV-BIBLE-AUTHORITY lineage commits present on this branch (`5b5acef7`…`9f52766a`) that are **not** on current `origin/integrate` |
| Conflicts | No unresolved merge conflicts in the worktree; promote as a controlled pin, not an assumed fast-forward of origin integrate |
| Package awareness | Director must accept deploying the **full tip** `5bd50c67` (editorial programme + bible-authority commits already on this branch). This certificate does **not** propose an editorial-only cherry-pick onto an unrelated Production SHA. |

---

## Verification results (pre-promotion)

| # | Check | Result | Evidence |
| --- | --- | --- | --- |
| 1 | Exact release commit | **PASS** | Deploy pin `5bd50c67`; app baseline `aad3d160` |
| 2 | P0–P5 included | **PASS** | `a3cd08b0` → `55524aa8` → `aad3d160` (+ docs `5bd50c67`) |
| 3 | Build + tests | **PASS** | Local `npm run build` exit 0; editorial suite 1252 passed (Docker concurrency excluded earlier); focused acceptance reconfirm 43/43 |
| 4 | Production env/DB mapping (no secrets) | **PASS** | Production health: `environment:production`, `database:connected`, `ok:true`. Preview fail-closed guard remains in code (`preview-postgres.ts`: Production ref `kqptdgbttfuqkzxzbazw` rejected when `VERCEL_ENV=preview`). Secrets not pulled/printed. |
| 5 | Existing Production deployment unchanged | **PASS** | `dpl_FMPu6wdAMaKkkprbEARAJwKVYdjs` / `du0j3lgh6` still **Ready** `target:production`. Domains `echoesandvisions.com` → `www.echoesandvisions.com` still on `sovereign-ai-executive`. |
| 6 | Existing schedules / Article B | **PASS (code + process)** | Deploy alone does not rewrite `scheduledFor`. Post-approval scheduler only runs after **new** successful Approve of a specific `articleId`; already-`scheduled` articles take `already_scheduled` and leave the timestamp unchanged. **No Production DB schedule inventory was queried** (would require secrets). Director should note Article B’s current slot before/after promote via admin UI. |
| 7 | No migrations / backfills / historical batch | **PASS** | No `prisma/migrations` changes in EV-EDITORIAL-07 commit range; no backfill scripts in release scope; no automatic historical article processor added |
| 8 | Post-approval automation cannot sweep existing articles | **PASS** | `runPostApprovalPublishPrep` call sites: **only** `POST /api/articles/approve` after that article’s approve succeeds. Image path skips non-approved; image `already_applied` if featured image exists; schedule skips unless approved and image-ready; never publishes; never social-sends |
| 9 | Editorial / publishing / social guards | **PASS** | `requireEditorAuth` on approve/stage-runner; lifecycle + publication guards unchanged for publish-due; social remains dual-gated; legacy `/api/pipeline/auto-schedule` remains **410** |
| 10 | Rollback + health procedure | **PASS** | Documented below |

Director Preview acceptance: **PASS** (Director-confirmed). Engineering acceptance: **APPROVED**.

---

## Release scope

**In scope when Director authorises promote of `5bd50c67`:**

- Director Prepare UI → Stage Runner  
- Bounded evidence recovery  
- Post-approval featured-image prep (per newly approved article only)  
- Optional calendar slot assignment after approval+image (guarded)  
- Director Decision Board + checklist monitoring  
- Social ops monitoring helpers (no live send)  
- EV-BIBLE-AUTHORITY commits already on this branch tip  

**Out of scope / forbidden in the same promote action:**

- Schema migrations, data backfills  
- Changing Vercel Production env vars  
- Force-running cron / publishing due articles manually  
- Social distribution  
- Retargeting domains away from current Production Ready without explicit alias GO  

---

## Existing schedules preservation

- **Mechanism:** No release code path bulk-updates `scheduledFor`.  
- **Already scheduled:** post-approval prep returns `already_scheduled` without changing the stored instant.  
- **Cron:** existing `publish-due` still requires `scheduledFor <= now` plus publication guards.  
- **Article B:** treat as preserved by non-mutation on deploy; confirm slot via Production admin **after** a future authorised promote (read-only), not before secrets access in this certificate.

---

## Rollback target

| Item | Value |
| --- | --- |
| **Primary rollback deployment** | `dpl_FMPu6wdAMaKkkprbEARAJwKVYdjs` (`sovereign-ai-executive-du0j3lgh6-…`) |
| State now | Production **Ready** |
| Action if incident after future promote | Redeploy/restore this deployment (or last known-good Production pin) with separate Director GO |
| Database | Rollback of code does **not** undo any approvals/schedules created after promote |

---

## Post-promote health-check procedure (when separately authorised)

1. Confirm new Production deployment Ready and aliases still on `www.echoesandvisions.com` / `echoesandvisions.com`.  
2. `GET /api/health` → `ok:true`, `environment:production`.  
3. Unauthenticated privileged route still rejects (e.g. stage-runner / admin redirect).  
4. Read-only: Article B (and other scheduled) still show the same `scheduledFor` in admin.  
5. Do **not** Approve random Production articles solely to “test” post-approval automation.  
6. Stop; report.

---

## GO / NO-GO

**GO** — Production promotion readiness is satisfied for pin **`5bd50c67`**, subject to:

1. Explicit Director **Production GO** for this pin.  
2. Acceptance that the pin includes EV-BIBLE lineage commits ahead of current `origin/integrate` @ `6ef9f3ed`.  
3. No simultaneous env/migration/social/cron-force actions.

**Production deployment remains NOT AUTHORISED until that separate GO.**

---

## STOP

Certificate complete. Awaiting explicit Director Production GO.
