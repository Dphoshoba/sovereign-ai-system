# M2-PV1 — Controlled Preview Validation Prep

**Status:** Prep complete — **STOP before any remote deploy**  
**RC / security baseline:** `4ec255b8493e4b58b604d8f699c536a0fde7a996`  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Programme:** M2 (P0–P5) + M2-RR + M2-SR1 accepted; this phase prepares Controlled Preview only  
**Remote actions:** None — no push, PR, Preview deploy, Production deploy, migration, live social, or Vercel env changes

## Preview recommendation: **CONDITIONAL GO**

Director may authorise a **Vercel Preview** of clean RC `4ec255b8` **only if** the conditions in §8 are met.  
**Production remains NO-GO.** This agent did **not** create or promote any deployment.

---

## 1. RC SHA / commit verification

| Check | Result |
| --- | --- |
| HEAD | `4ec255b8493e4b58b604d8f699c536a0fde7a996` |
| Branch | `cursor/autonomous-pipeline-lockdown-1605` |
| M2-P0…P5 + RR + SR1 ancestry | **PASS** — linear: `d1495d99` → `5299e0d5` → `2659bc8c` → `99bfa863` → `db5ed584` → `6acc0268` → `2317c951` → `4ec255b8` |

Dirty worktree paths (OAuth trees, focus, proposed SQL, etc.) exist locally and **must not** be included in any Preview package.

---

## 2. Agent-route security recheck (SR1)

| Metric | Result |
| --- | --- |
| Total `/api/agents/**/route.ts` | **112** |
| Editor-gated | **106** |
| Justified public / disabled allowlist | **6** (architecture-overview, registry, subtitles/view, render-video, render-with-subtitles, youtube-publish) |
| Prisma writers gated | **7 / 7** |
| AI Autonomous Pipeline | Still `requireEditorAuth` + `403 AUTONOMOUS_PIPELINE_DISABLED` |
| SR1 auth remediation tests | **13 passed** |

---

## 3. Governance chain

Verified present and covered by regression slice:

1. AI Generator / research-audit path (not research-free packaging)  
2. Human approval + fingerprint / review-note provenance (`EV-REG-SPEC-1.1.0`)  
3. Featured-image prompt governance  
4. Publication guards (80 / 70 / `publish-ready`)  
5. Facebook canonical `/blog/{slug}`  
6. Director Checklist + monitoring overlay  
7. Biblical Authority contract boundaries  

M2 editorial + security regression slice: **7 files / 65 tests passed** (plus dedicated SR1 file **13 passed**).

---

## 4. Regression / typecheck / production build

| Gate | Result | Evidence |
| --- | --- | --- |
| M2/SR1 vitest slice | **PASS** | 65 (+13 SR1) |
| `tsc --noEmit -p tsconfig.json` | **PASS** | exit 0 |
| `next build` (production) | **PASS** | Compiled successfully (~61s); static generation 674/674; exit 0 |
| Claim-selection-v15 | **KNOWN FAIL** | 7 failed / 9 passed on RC (see §5) |
| Full-suite Docker concurrency | **UNVERIFIED** | Environment previously lacked disposable Postgres/Docker |

No product behaviour changes in M2-PV1.

---

## 5. Claim-selection-v15 vs pre-M2 (isolated worktree)

| Tree | SHA | Result |
| --- | --- | --- |
| Pre-M2 parent of P0 | `1798b1b70485a7e58c2d70435c33aa0b083e2ccb` (detached worktree) | **7 failed / 9 passed** |
| RC | `4ec255b8493e4b58b604d8f699c536a0fde7a996` | **7 failed / 9 passed** |

**Conclusion:** Failures are **pre-existing** relative to M2/SR1/PV1. No claim-selection product or test changes were made. Temporary worktree removed after comparison.

---

## 6. Vercel Preview configuration (read-only assessment)

| Item | Finding | Action in PV1 |
| --- | --- | --- |
| In-repo `vercel.json` | Single daily cron → `/api/cron/run-pipeline` (`0 0 * * *`) | Not modified |
| Cron auth | `authorizeCronRequest` requires configured `CRON_SECRET` Bearer | Not modified |
| Project Deployment Protection | Prior assessment (`docs/security/PRODUCTION_READINESS_ASSESSMENT.md`) recorded Preview Protection blocking anonymous clients; CLI can bypass to app layer | **Do not disable** for Preview validation |
| Preview vs Production DB | Prior assessment: `DATABASE_URL` / `DIRECT_URL` shared / unverified — Preview may hit production data if not isolated | **Hard condition** before Preview |
| Env vars | Not read or changed by this agent | No Vercel env changes |
| This cloud run | No linked Cursor environment for Vercel automation | Cannot auto-deploy |

**Assessment:** Repo is build-ready for a Director-triggered Preview of the clean RC commit, but Preview is unsafe if Deployment Protection is off or if Preview shares a writable production database without explicit acceptance.

---

## 7. Controlled Preview test plan (execute only after Director authorises deploy)

### 7.1 Preconditions (Director / operator)

1. Push **only** RC `4ec255b8` (or a tip that is exactly that tree) — exclude dirty worktree files.  
2. Confirm Vercel **Deployment Protection** remains enabled on Preview.  
3. Confirm Preview database posture (isolated Preview DB **or** explicit risk acceptance of shared DB).  
4. Confirm `CRON_SECRET` present; do **not** manually invoke social publish routes.  
5. Use an editor/admin Supabase session for privileged checks; keep a logged-out browser for negative tests.

### 7.2 Smoke matrix (Preview)

| # | Check | Expected |
| --- | --- | --- |
| P1 | Anonymous `GET` Preview host | Deployment Protection challenge / SSO — not open app HTML for admin APIs |
| P2 | Anonymous `POST /api/ai/autonomous-pipeline` (after Protection bypass if using CLI) | `401 AUTHENTICATION_REQUIRED` or Protection; never creates articles |
| P3 | Editor `POST /api/ai/autonomous-pipeline` | `403 AUTONOMOUS_PIPELINE_DISABLED` |
| P4 | Anonymous `POST /api/agents/script-generation` (and one other Prisma writer) | `401` before DB write |
| P5 | Anonymous `POST /api/agents/director` | `401`; scheduler not started |
| P6 | Public allowlist `GET /api/agents/architecture-overview` | `200` static metadata (if reachable past Protection) |
| P7 | Editor session: `/admin/director-checklist` | Loads; monitoring badges; `readOnly` API |
| P8 | Editor: open AI Generator path only — do **not** approve/publish/social | UI reachable; no accidental publish |
| P9 | Facebook publish route code path not exercised live | Skip live Graph calls |
| P10 | Cron `POST /api/cron/run-pipeline` without secret | `401` |
| P11 | Confirm no Production alias switched | Production host unchanged |

### 7.3 Explicitly out of scope for Preview validation

- Production promotion  
- Live X/Facebook/LinkedIn/Threads publish  
- Applying `docs/security/proposed/*.sql`  
- Fixing claim-selection-v15  
- Disabling Deployment Protection  

### 7.4 Pass criteria for Preview exercise

- P2–P5, P10 hold  
- P7 reachable for editor  
- No production mutation / no social send  
- Protection still on  

---

## 8. Conditions for CONDITIONAL GO (Preview)

1. Director explicitly authorises push + Preview deploy of **clean** `4ec255b8`.  
2. Deployment Protection stays enabled.  
3. Database isolation (or written acceptance of shared DB risk).  
4. No live social; no migrations; no Production promote.  
5. Claim-selection-v15 accepted as known non-blocking Preview gap.  
6. Dirty worktree artefacts excluded from the pushed tree.

If any of 1–4 fail → **NO-GO for Preview**.

---

## 9. Rollback risks

| Risk | Mitigation |
| --- | --- |
| Preview mis-points at production DB | Prefer isolated Preview DB; otherwise treat Preview as production-impacting and avoid write tests |
| Cron fires on Preview | Ensure cron secret / Vercel cron targets are understood; unauthenticated cron must 401 |
| Accidental Production promote | Do not promote; verify aliases after Preview |
| Rollback Preview | Redeploy previous Preview/production deployment; M2/SR1 have **no** Prisma migrations to reverse |
| Agent auth regression | Revert to pre-`4ec255b8` only if Director accepts restored unauthenticated writers |

---

## 10. Evidence index

| Artefact | Location / command |
| --- | --- |
| This report | `docs/editorial/M2_PV1_PREVIEW_VALIDATION.md` |
| SR1 report | `docs/editorial/M2_SR1_AGENT_API_SECURITY_REMEDIATION.md` |
| RR report | `docs/editorial/M2_RELEASE_READINESS.md` |
| Build | `next build` exit 0; compiled ~61s; 674 static pages |
| Pre-M2 claim probe | worktree at `1798b1b7` → 7 fail / 9 pass (removed after) |
| RC claim probe | `4ec255b8` → 7 fail / 9 pass |

---

## 11. Final decision

| Scope | Decision |
| --- | --- |
| Local RC readiness for Controlled Preview prep | **PASS** |
| Authorise Preview deploy now (this agent) | **STOP — not performed** |
| Preview (after Director conditions §8) | **CONDITIONAL GO** |
| Production | **NO-GO** |

**STOP.** Awaiting Director decision on whether to authorise a remote Preview. No push/PR/deploy performed in M2-PV1.
