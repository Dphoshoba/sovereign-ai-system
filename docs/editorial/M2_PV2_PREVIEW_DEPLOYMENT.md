# M2-PV2 — Controlled Preview Deployment & Verification

**Status:** **BLOCKED** — stopped before push / Preview deploy  
**RC:** `4ec255b8493e4b58b604d8f699c536a0fde7a996`  
**PV1 evidence:** `eb219405425aa13b6e8624f73ed8b2211014787e` (HEAD at gate evaluation)  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Project:** `davidoshoba-3659s-projects/sovereign-ai-executive`  
**Production:** remains **NO-GO**  
**Remote actions:** None — no push, PR, Preview deploy, Production promote, migration, live social, or Vercel env changes

## Consolidated verdict: **BLOCKED**

All four gates (A–D) are mandatory. **Gate C (DB isolation) did not PASS** (unverifiable that Preview `DATABASE_URL` ≠ Production). Per Director mandate, deployment was **not** started. Push was withheld because it would likely auto-create a Preview before gates clear.

---

## Gate results

| Gate | Result | Evidence |
| --- | --- | --- |
| **A — Integrity** | **PASS** | HEAD `eb219405` contains RC `4ec255b8` as ancestor; `4ec255b8..eb219405` is only `docs/editorial/M2_PV1_PREVIEW_VALIDATION.md`. Dirty/untracked worktree paths are **not** in those commits. Remote branch tip not present on `origin` at evaluation (`git ls-remote` empty for this branch name). |
| **B — Deployment Protection** | **PASS** | Live anonymous probe of an existing Ready Preview (`…-hxg8t3f6p-…vercel.app`) returned **HTTP 302** to `vercel.com/sso-api` with body “Protected by Vercel Authentication”. Same for `/api/agents/architecture-overview`. Production `www.echoesandvisions.com` returned **307** to `/sovereign-ai` (public), confirming Preview ≠ open Production host. |
| **C — DB isolation** | **FAIL / UNVERIFIABLE** | `vercel env ls` shows **Hidden** `DATABASE_URL` rows for both Preview and Production. Values were **not** compared (and must not be assumed equal or unequal). No `DIRECT_URL` Preview row listed. Branch-scoped Preview overrides exist only for `preview/security-isolated` (not for `cursor/autonomous-pipeline-lockdown-1605`). Prior written assessment also marked Vercel `DATABASE_URL`/`DIRECT_URL` project identity **UNVERIFIED**. Therefore Preview isolation for this RC branch is **not proven**. |
| **D — No live social** | **PASS (process)** | This run did not call social publish APIs. Twitter credential env rows appear **Production-only** in `vercel env ls` (no Preview Twitter secrets listed). Cron `CRON_SECRET` listed for Production only in the same listing (Preview cron without secret should fail closed). Still insufficient to override Gate C. |

### Blocking rationale (Gate C)

A Preview of `cursor/autonomous-pipeline-lockdown-1605` would use the generic Preview env set, **not** the `preview/security-isolated` overrides. Without a proven distinct database (or explicit Director written acceptance of shared-DB risk for this deploy), non-destructive intent cannot guarantee zero production data impact (editor sessions, shared Prisma target, scheduled publish paths). Mandate requires Gate C **PASS** before push/deploy → **BLOCKED**.

---

## What was not done

- No `git push`
- No Vercel Preview / Production deploy
- No merge to `main` / no PR
- No migrations / proposed SQL
- No live social publish
- No weakening of auth or publication guards
- No Vercel environment variable changes

---

## Push auto-deploy risk

Project has frequent Preview deployments from Git. Pushing this branch before Gate C clears would likely create a Preview automatically. Mandate: *If push would auto-deploy before gates pass, do not push.* → push withheld.

---

## Conditions to unblock a future M2-PV2 retry

1. **Prove** Preview `DATABASE_URL` targets a non-production database for this branch (fingerprint/project id comparison by an authorised operator — not assumed from “Hidden” dual rows), **or** Director issues explicit written shared-DB risk acceptance for this RC.  
2. Prefer deploying via the existing `preview/security-isolated` posture **or** add equivalent branch overrides for this RC branch **before** push (Director-authorised env work — out of scope for this blocked run).  
3. Re-confirm Gate B on the **new** Preview URL after deploy (SSO 302).  
4. Keep Gate D: no live social; no Production promote.  
5. Push only clean commits (`4ec255b8` / `eb219405` lineage); exclude dirty worktree artefacts.

---

## Local integrity snapshot (for retry)

| Item | Value |
| --- | --- |
| Recommended deploy SHA when unblocked | `eb219405425aa13b6e8624f73ed8b2211014787e` (RC + PV1 prep doc) or exact `4ec255b8` if docs tip disallowed |
| Security baseline | `4ec255b8` (SR1 agent auth) |
| Dirty worktree | Present — must remain uncommitted/unpushed |

---

## Production

**NO-GO.** Unchanged.

---

## Final decision

| Scope | Decision |
| --- | --- |
| Gates A–D | **Not all PASS** (C blocks) |
| Preview deploy this run | **BLOCKED — not performed** |
| Production | **NO-GO** |

**STOP.** Awaiting Director remediation of Gate C (or written shared-DB acceptance) before any push/Preview.

**Follow-up:** See `docs/editorial/M2_PV2C_PREVIEW_DB_ISOLATION.md` — public Preview Supabase project `emmzoeeaznhpwevqprkn` verified ≠ Production `kqptdgbttfuqkzxzbazw`; Prisma `DATABASE_URL` secret still requires Director attestation before Gate C PASS.
