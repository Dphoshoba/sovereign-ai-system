# M2-PR2 — Production Risk Remediation & Release Certification

**Date:** 2026-11-18  
**Prior:** PR1 `40647665` (CONDITIONAL HOLD) · Preview PASS SHA `6258cada` · dpl `dpl_2qScTYYwxAycMF1c74z6yomcgfgK`  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Nature:** Risk remediation / certification only. **No** Production deploy, env change, DB/migration, live social, or push.

### Certification verdict (for Director)

| Axis | Result |
| --- | --- |
| Preview RC integrity | **PASS** — Ready Preview still `6258cada` / `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` |
| Claim-selection-v15 | **DISPOSED — WAIVE** (intentional gap suite; no app fix) |
| Concurrency suite | **DISPOSED — WAIVE** (Docker unavailable; not M2 delta) |
| Schema compatibility vs Production | **OPEN — HOLD** (RC schema ahead of `main` without migration files in delta) |
| Twitter / CRON safety plan | **DOCUMENTED** (not invoked) |
| Quality gates (tsc / build / M2 tests) | **PASS** |
| Production promote now | **NO-GO / CONDITIONAL HOLD** |
| App code changes this run | **None** → no new Preview required |

**STOP.** Awaiting Director **GO / HOLD / NO-GO**.

---

## 1. RC integrity vs Production

| Check | Evidence | Result |
| --- | --- | --- |
| Remote RC tip | `6258cada83312f409b67044dda79ad177bd0e8ba` | **PASS** |
| Preview deployment | `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` · target **preview** · status **Ready** | **PASS** |
| Local docs tip | `40647665` (+ this cert) ahead of origin; docs-only | Excluded from app SHA |
| Dirty worktree | ~31 porcelain paths (focus/OAuth/WIP, etc.) | **Must exclude** from any promote package |
| Current Production sample | `dpl_5jYU4Bx4ukFa2U5dGuDNj5RDxmJh` (PR1) | Different runtime health payload vs RC |
| Ancestry | `4ec255b8` (SR1) ⊂ RC; M2 P0–P5 present | **PASS** for programme spine |

**Integrity conclusion:** The only Preview-certified app SHA remains **`6258cada`**. Local evidence commits must not be mistaken for a new app RC without a new Preview.

---

## 2. Read-only data compatibility

### 2.1 What was checked (read-only)

| Probe | Result |
| --- | --- |
| Preview `/api/health/db` (PV3) | `connected`, `articles: 1` on isolated `emmzo…` |
| Production `/api/health` + `/api/health/db` (PR1) | `ok: true` on **current** Production deploy |
| M2 P0–P5 / SR1 migrations | **None** in those commits |
| `origin/main..6258cada` `prisma/migrations` file diff | **Empty** (no new migration files in that range) |
| `origin/main..6258cada` `prisma/schema.prisma` | **+198 lines** — includes `isTest` flags and full **Connector** model family |

### 2.2 Compatibility finding — **HOLD driver**

RC Prisma schema is **ahead of `origin/main`** with substantive model additions (Connectors, `isTest` fields) **without** corresponding migration files in the `main..RC` diff.

| Implication | Risk |
| --- | --- |
| Preview DB already accepts RC client | Compatible with Preview (proven live) |
| Production DB schema vs RC client | **Unproven** in this run (no Production schema introspection / migration apply authorised) |
| Blind promote of `6258cada` | May throw at runtime if Production lacks new relations/columns when code paths touch them |

**Remediation (Director-authorised later — not this run):**  
(a) Attest Production DB already matches RC schema, **or**  
(b) Run a separate, reviewed migration/reconciliation programme against Production, **or**  
(c) Promote a narrower SHA that does not require the divergent schema (if Director re-scopes).

**This PR2 does not apply migrations or change Production DB.**

---

## 3. Twitter / CRON safety plan (**no invoke**)

### 3.1 Inventory (env — non-secret)

| Secret | Preview | Production |
| --- | --- | --- |
| `TWITTER_*` (5) | **Absent** | **Present** |
| `CRON_SECRET` | **Absent** | **Present** |
| RC Preview `DATABASE_URL` / `DIRECT_URL` | Branch-specific | Untouched |

### 3.2 Code controls (RC)

| Path | Guard |
| --- | --- |
| `POST /api/social/publish/twitter` | `requirePublishingEditor` before publish |
| `GET|POST /api/cron/run-pipeline` | `authorizeCronRequest` (`CRON_SECRET` Bearer); fail-closed if unset |
| `GET|POST /api/cron/publish-scheduled` | Same cron auth; can publish due articles when authorised |
| `vercel.json` crons | Only `/api/cron/run-pipeline` @ `0 0 * * *` |

### 3.3 Promote-window plan (execute only after Director GO)

1. **Social freeze:** No manual Twitter/Facebook publish; no “smoke tweet.”  
2. **Cron awareness:** Production cron remains armed after promote; treat first `run-pipeline` cycle as monitored. Optional Director control (separate auth): temporarily remove/pause Vercel cron or rotate `CRON_SECRET` **only if** Director orders it — **not done in PR2**.  
3. **Do not** copy Preview DB URLs into Production.  
4. **Do not** exercise live social to “verify” promote.  
5. Post-promote: confirm gated social without editor session returns auth failure; confirm cron without secret returns **401**.

**PR2 status:** Plan certified; **zero** cron/social invocations performed.

---

## 4. Security & DB posture

| Control | Status |
| --- | --- |
| M2-SR1 agent auth | **PASS** — 65/65 focused M2/SR1 tests green this run; Preview live director **401** (PV3) |
| Autonomous Pipeline lockdown | **PASS** |
| Preview isolation | **PASS** (`emmzo…`; Production ref fail-closed) |
| Proposed Supabase SQL | **EXCLUDED** — must not ship with M2 promote |
| Production secrets | Unchanged; Sensitive values not pulled |
| Residual | Authenticated editors can still run agent compute / publishing (by design) |

---

## 5. Claim-selection-v15 disposition

| Item | Finding |
| --- | --- |
| Origin | `b641505d` — *“record claim-selection gaps for v15… failing regressions… engine stays article-grounded-v14”* |
| Current result | **7 failed / 9 passed** (reconfirmed) |
| Nature | **Intentional gap suite**, not a silent Production regression introduced by M2 |
| Safe local product fix? | **No** — would require claim-extractor / selection engine changes → new app SHA → **new Preview** mandatory |
| PR2 action | **No code change** |
| Disposition | **WAIVE for M2 Production certification** as known, documented research-audit gap (pre-M2). Track as separate research milestone if Director wants closure |

---

## 6. Quality gates (this run)

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** (exit 0) |
| `npm run build` | **PASS** (exit 0) |
| M2/SR1 focused vitest (7 files) | **PASS** — 65/65 |
| claim-selection-v15 | **FAIL (waived)** — 7 intentional gap failures |
| Full suite | Not re-run end-to-end; prior PARTIAL + Docker concurrency still waived |

---

## 7. Release plan (authorised run only — **DO NOT EXECUTE**)

### Package

- **App SHA:** `6258cada` only (Preview-certified).  
- **Exclude:** dirty WIP; proposed SQL; local-only docs tips unless Director wants docs sync after.  
- **Target:** Production promote of that SHA **after** §8 conditions.

### Steps

1. Director decision: **GO / HOLD / NO-GO**.  
2. If GO: complete §8 attestations (especially schema).  
3. Clean tree / exclude dirty paths.  
4. Promote via Director-chosen path (merge to `main` or Vercel Production redeploy of SHA).  
5. Post-promote smoke: health, health/db, agent **401**, cron **401** without secret, Director Checklist read.  
6. Enforce §3 social/cron freeze.  
7. Rollback owner: redeploy prior Production (`dpl_5jYU4Bx4ukFa2U5dGuDNj5RDxmJh` or newer known-good).

---

## 8. Conditions matrix (updated from PR1)

| # | Condition | PR2 status |
| --- | --- | --- |
| 1 | Explicit Director Production authorisation naming SHA | **Open** |
| 2 | Dirty worktree excluded | **Plan PASS** / execution pending |
| 3 | Claim-selection-v15 disposition | **WAIVED** (documented gap) |
| 4 | Concurrency suite waive/CI | **WAIVED** (env) |
| 5 | Proposed Supabase SQL not applied | **PASS** (excluded) |
| 6 | Accept Production behavioural delta vs current Production | **Open** (Director) |
| 7 | Social / cron freeze for promote window | **Plan PASS** / execution pending |
| 8 | Post-promote smoke + rollback owner | **Open** (Ops) |
| 9 | **NEW:** Production DB schema compatible with RC Prisma client (Connector/`isTest` delta) | **OPEN — HOLD** |

Until **1, 6, 8, 9** (and any non-waived items) are cleared: Production remains **NO-GO**.

---

## 9. Decision request

Director: choose one

1. **GO** — authorise Production promote of `6258cada` after attesting §8.9 schema compatibility + social/cron freeze + smoke owner.  
2. **HOLD** — keep Preview RC; clear schema attestation / migration programme first (recommended default).  
3. **NO-GO** — abandon promote; leave Production on current deployment.

**PR2 recommendation:** **HOLD** (schema compatibility unresolved). Claim-selection and concurrency no longer block once Director accepts the waivers recorded here.

---

## 10. Mutations this run

| Action | Done? |
| --- | --- |
| App / Prisma / env / deploy / social / push | **No** |
| Local certification doc commit | **Yes** |
| New Preview | **Not required** (no app change) |

---

**Final line:** Production **CONDITIONAL HOLD / NO-GO**. Preview PASS stands. Claim-selection **waived**. Schema compatibility **blocks GO**. **STOP** for Director decision.
