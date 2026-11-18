# M2-PV2D — Safe Branch Registration & Gate C Recovery

**Date:** 2026-11-18  
**Prior evidence:** `6258cada` (M2-PV2 MASTER BLOCKED)  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Vercel project:** `davidoshoba-3659s-projects/sovereign-ai-executive` (`prj_ogfO2yCJl7motADB98mCobU2Aviq`)  
**Expected Preview Supabase:** `emmzoeeaznhpwevqprkn`  
**Forbidden Production Supabase:** `kqptdgbttfuqkzxzbazw`

### Consolidated decision

| Axis | Result |
| --- | --- |
| Gates A–D (this run) | **A PASS · B PASS · C PASS · D PASS** |
| Preview authorisation | **READY FOR PREVIEW AUTHORISATION** (conditional — see §Handoff) |
| Production | **NO-GO** |
| Live social | **None** |
| Generic Preview / Production env mutation | **None** |

---

## Pre-push deploy-prevention (required before push)

### Supported mechanism used

**Project Ignored Build Step** (`commandForIgnoringBuildStep`), branch-gated to the exact RC ref:

```bash
if [ "$VERCEL_GIT_COMMIT_REF" = "cursor/autonomous-pipeline-lockdown-1605" ]; then exit 0; else exit 1; fi
```

| Check | Result |
| --- | --- |
| Set via Vercel API `PATCH /v9/projects/...` | **Yes** (HTTP 200) |
| Re-read before push | **Exact match** stored on project |
| Scope | Exact branch only; other refs `exit 1` (normal build) |
| Production branch `main` | Unaffected by the branch equality check |

### Why not `vercel.json` `git.deploymentEnabled` alone

First-push evaluation order for a new branch introducing `git.deploymentEnabled: false` is **not** a public Vercel engineering guarantee. Unpushed `vercel.json` is also **not** present on the Vercel project before push. Per mandate: unproven → do not push. Project Ignore Command **was** set and re-read on the project **before** push → **proven configuration**.

### Pre-push proof verdict

**PROVEN (configured on project)** — push authorised under mandate.

---

## Branch registration

| Step | Result |
| --- | --- |
| `git push -u origin cursor/autonomous-pipeline-lockdown-1605` | **Success** — remote `6258cada83312f409b67044dda79ad177bd0e8ba` |
| Merge / PR / Production promote | **Not performed** |
| Dirty local WIP | **Not pushed** (uncommitted only) |

---

## Preview-start verification & recovery

| Observation | Detail |
| --- | --- |
| Auto deployment created | `dpl_62G1oxX97V9WzjA3iMxCobyBLni7` · ref RC · state **BUILDING** · target preview |
| Ignore Command behaviour | Did **not** prevent deployment **creation**; build entered BUILDING (Ignored Build Step is skip-at-build, not create-suppression) |
| Recovery | API cancel → **CANCELED**; `vercel remove … --confirm-name` → deployment **deleted** |
| Post-recovery | **0** deployments remain for this branch; **0** Ready Preview on RC |
| Production deployments | Untouched |

**Net:** No Ready Preview remains for the RC branch. Incident recorded: Ignore Command alone is insufficient to guarantee zero deployment objects; cancel/remove completed the no-Ready requirement.

---

## Path B — branch-specific Preview DB env

Source (local, non-Vercel): `echoes-visions-preview-security/.env.local`  
Applied via Vercel Env API `POST …/env` with `gitBranch` = RC only. **Secrets not printed.**

| Variable | Target | gitBranch | Type | Project ref (source fingerprint) | identitySha12 |
| --- | --- | --- | --- | --- | --- |
| `DATABASE_URL` | Preview | `cursor/autonomous-pipeline-lockdown-1605` | sensitive | `emmzoeeaznhpwevqprkn` (pooler `:5432`) | `987cb5a976e5` |
| `DIRECT_URL` | Preview | `cursor/autonomous-pipeline-lockdown-1605` | sensitive | `emmzoeeaznhpwevqprkn` (`db.…supabase.co:5432`) | `d22cae1dc678` |

| Guard | Result |
| --- | --- |
| Contains Production ref `kqptdgbttfuqkzxzbazw`? | **No** (pre-apply assert) |
| Generic Preview `DATABASE_URL` mutated? | **No** (row `Zd0El3VH…` unchanged, `gitBranch: null`) |
| Production `DATABASE_URL` / `DIRECT_URL` mutated? | **No** |
| API create status | both **201** |

---

## Gate revalidation (A–D)

### A — Ancestry & hygiene — **PASS**

| Check | Evidence |
| --- | --- |
| HEAD / remote tip | `6258cada` |
| RC app baseline `4ec255b8` is ancestor | **Yes** |
| Remote branch present | **Yes** (unblocks branch-specific env) |
| Dirty worktree | Present locally; **excluded** from push |

### B — Deployment Protection — **PASS**

Anonymous probe of team Preview host → **HTTP 302** to `vercel.com/sso-api` + `X-Robots-Tag: noindex`.

### C — DB isolation — **PASS**

RC branch now has Preview-only, branch-specific `DATABASE_URL` + `DIRECT_URL` mapped (via controlled Path B write + source fingerprints) to **`emmzoeeaznhpwevqprkn`**, not Production. Generic Preview and Production rows unchanged. Sensitive values remain unreadable via CLI (by design); this PASS is Path B apply + inventory proof, not Path A secret re-read.

### D — No live social — **PASS (process)**

No social publish this run. `TWITTER_*` and `CRON_SECRET` remain **Production-only** in env inventory.

---

## Mutations this run

| Action | Done? |
| --- | --- |
| Set project Ignore Command (RC-gated) | **Yes** (still active) |
| Push RC branch to origin | **Yes** |
| Preview Ready deploy | **No** (BUILDING incident canceled + removed) |
| Path B RC branch-specific Preview env | **Yes** |
| Generic Preview env change | **No** |
| Production env / deploy / promote | **No** |
| PR / merge | **No** |
| Live social | **No** |

---

## Handoff — before authorised Preview deploy

1. **Clear or revise** project `commandForIgnoringBuildStep` so the RC branch can build when Director authorises Preview (current command forces ignore for this ref).  
2. Prefer adding `vercel.json` `git.deploymentEnabled` only if intentional permanent no-auto-deploy is desired; do **not** rely on it alone for first-push guarantees.  
3. Explicit Director authorisation for Preview deploy.  
4. After deploy: reconfirm Gate B on the new RC Preview URL; keep Gate D (no live social); Production remains **NO-GO**.

---

**Final line:** Gates **A–D PASS**. **READY FOR PREVIEW AUTHORISATION** (clear Ignore Command first). Production **NO-GO**.
