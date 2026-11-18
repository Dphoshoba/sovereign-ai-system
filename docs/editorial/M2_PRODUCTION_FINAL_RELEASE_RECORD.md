# M2 Production Final Release Record

**Status:** **PENDING — NOT EXECUTED**  
**Date prepared:** 2026-11-18  
**Programme:** M2-PR4/PR5 Production Migration Prep + Final Release Closure  
**App RC (Preview-certified):** `6258cada83312f409b67044dda79ad177bd0e8ba`  
**Preview deploy:** `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` (Ready)  
**Prior cert:** PR3 `6b073f2b`  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Production project:** `kqptdgbttfuqkzxzbazw`  
**Preview project:** `emmzoeeaznhpwevqprkn`

### Record state

| Field | Value |
| --- | --- |
| Migration applied to Production? | **NO** |
| Production env changed? | **NO** |
| Production deploy/promote? | **NO** |
| Push / merge / social invoke? | **NO** |
| Awaiting | **Single Director authorisation** for §9 package |

---

## 1. RC integrity

| Check | Result |
| --- | --- |
| Remote / certified app tip | `6258cada` |
| Preview deployment | `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` · target **preview** · **Ready** |
| Local docs tip | `6b073f2b` (+ this record) — docs/proposed only; **not** app RC |
| Dirty worktree | Present (~unrelated WIP) — **exclude** from release package |
| App tree mutation this prep | **None** |

**Integrity:** Preview-certified promote SHA remains **`6258cada`**.

---

## 2. Production read-only DB access restored

| Item | Result |
| --- | --- |
| Working credential source | `C:\Users\David\.config\echoes-visions\production-db.env` (raw `postgresql://…` URL file, not KEY=value) |
| Project ref confirmed | `kqptdgbttfuqkzxzbazw` |
| Mode | `BEGIN TRANSACTION READ ONLY` … `ROLLBACK` |
| Repo `.env` Production URLs | **Stale** — `28P01 password authentication failed` (pooler user). **Action for ops:** refresh repo `.env` `DATABASE_URL`/`DIRECT_URL` from the working production-db secret for local tooling; **do not** change Vercel Production env in this prep. |

### Live Production structure (read-only, 2026-11-18)

| Object | Present? |
| --- | --- |
| `Connector` (+ 6 related Connector\* tables) | **0 / 7** |
| `isTest` on Client\*/Creator\* (6 tables) | **0 / 6** |
| `public._prisma_migrations` ledger | **Absent** |
| **Migration required before RC promote?** | **YES** |

---

## 3. Proposed SQL verification

| Artefact | Status |
| --- | --- |
| `docs/security/proposed/20261118_add_connectors_and_istest.sql` | Present |
| `docs/security/proposed/20261118_add_connectors_and_istest_rollback.sql` | Present |
| Regenerated `prisma migrate diff` (main → `6258cada`) | Body **matches** proposed (whitespace-normalized) |
| Additive-only | **YES** (no DROP/TRUNCATE/DELETE in forward script) |
| Scope | 6× `isTest` columns + 7× Connector\* tables + indexes + 8 FKs |

---

## 4. Disposable isolated rehearsal (**not** Production / Preview)

| Step | Result |
| --- | --- |
| Engine | Docker Desktop · `postgres:16` container `m2-pr4-migrate-rehearsal` |
| Bootstrap | Minimal stub Client\*/Creator\* tables (for ALTER COLUMN) |
| Forward apply | **PASS** (`ON_ERROR_STOP=1`, exit 0) |
| Post-apply verify | 7 Connector\* tables · 6 `isTest` columns · 8 FKs |
| Rollback apply | **PASS** → 0 Connector tables · 0 `isTest` columns |
| Re-apply after rollback | **PASS** |
| Container destroyed | **YES** |
| Touched Production/Preview? | **NO** |

---

## 5. Security / governance

| Control | Status |
| --- | --- |
| M2-SR1 agent auth tests | **PASS** (18/18 with lockdown suite this prep) |
| Autonomous Pipeline lockdown | **PASS** |
| Preview PASS (PV3) | Stands — SSO, DB connected, director/cron 401 |
| Twitter publish path | `requirePublishingEditor` (no invoke) |
| Cron paths | `authorizeCronRequest` / fail-closed without secret (no invoke) |
| Proposed unrelated Supabase Data API SQL | **Still excluded** from this package |

---

## 6. Build / typecheck

| Gate | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** |
| `npm run build` | **PASS** |

---

## 7. Ops readiness (pre-execution)

| Item | Ready? | Notes |
| --- | --- | --- |
| Production DB credential for migration apply | **YES** via `production-db.env` | Prefer DIRECT/session URL at apply time; confirm same project ref |
| Vercel Production `DATABASE_URL`/`DIRECT_URL` | Present (Sensitive) | **Do not modify** unless Director orders |
| `CRON_SECRET` / `TWITTER_*` | Production-only | Freeze social; monitor first cron after promote |
| Rollback SQL | Prepared | Emergency only |
| App rollback | Redeploy prior Production (e.g. `dpl_5jYU4Bx4ukFa2U5dGuDNj5RDxmJh` or newer known-good) | |
| Dirty WIP exclusion | Required | |
| Claim-selection-v15 / concurrency | **Waived** (PR2) | |
| Repo `.env` refresh | Recommended local hygiene | Not a Vercel Production change |

---

## 8. Pre-release evidence summary

| Evidence | Ref |
| --- | --- |
| Preview PASS | `docs/editorial/M2_PV3_PREVIEW_DEPLOYMENT_VERIFICATION.md` |
| PR2 HOLD / waivers | `docs/editorial/M2_PR2_PRODUCTION_RELEASE_CERTIFICATION.md` |
| PR3 schema HOLD | `docs/editorial/M2_PR3_FINAL_RELEASE_CERTIFICATION.md` |
| This pending record | `docs/editorial/M2_PRODUCTION_FINAL_RELEASE_RECORD.md` |
| Forward SQL | `docs/security/proposed/20261118_add_connectors_and_istest.sql` |
| Rollback SQL | `docs/security/proposed/20261118_add_connectors_and_istest_rollback.sql` |
| Production read-only probe | Connector/`isTest` **missing**; ledger absent; rolled back |
| Isolated rehearsal | Forward + rollback + re-apply **PASS**; container destroyed |
| App SHA to promote | **`6258cada` only** |

---

## 9. Consolidated Director authorisation request

**STOP. Nothing below has been executed.**

Director: please approve **one** package (or reject):

### AUTHORISE (single GO) — Production migration + promote

1. **Apply** `docs/security/proposed/20261118_add_connectors_and_istest.sql` to Production Postgres project **`kqptdgbttfuqkzxzbazw`** only (using operator-held Production credentials; prefer session/direct URL).  
2. **Read-only verify** Connector\* + `isTest` present; keep rollback SQL available.  
3. **Promote / Production-deploy app SHA `6258cada`** to Vercel project `sovereign-ai-executive` (Director-chosen path: merge-to-main or redeploy SHA).  
4. **Enforce** social freeze (no live Twitter/Facebook send) and monitor first Production cron cycle.  
5. **Post-smoke:** `/api/health`, `/api/health/db`, gated agent **401**, cron **401** without secret.  
6. **Exclude** dirty WIP and unrelated proposed SQL.

### Explicit non-authorisations unless separately stated

- No Preview SQL apply  
- No Production env var rewrite  
- No live social  
- No push/merge unless required for the chosen promote path and named in the GO  

### Alternatives

- **HOLD** — leave Production unchanged; prep remains valid.  
- **NO-GO** — abandon promote; Preview RC stays validation-only.

**Prep recommendation while awaiting reply:** treat as **HOLD**. Default without Director GO: **do not mutate Production**.

---

## Execution log (must remain empty until GO)

| Step | Status | Evidence |
| --- | --- | --- |
| Production SQL apply | **PENDING** | — |
| Production schema verify | **PENDING** | — |
| Production app promote `6258cada` | **PENDING** | — |
| Post-promote smoke | **PENDING** | — |
| Social invoke | **NOT PLANNED** | — |

---

**Final line:** Record is **PENDING**. Production **not mutated**. Isolated rehearsal **PASS**. Director: one GO for migration + deploy of `6258cada`, or HOLD/NO-GO.
