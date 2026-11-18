# M2-PR1 — Production Readiness Assessment

**Date:** 2026-11-18  
**Nature:** Assessment + release proposal only. **No** Production deploy, env change, DB/migration, live social, push, or merge.  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Preview PASS inputs:** SHA `6258cada` · dpl `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` · evidence `362dba7f`  
**Production Supabase (forbidden for Preview; intended Production target):** `kqptdgbttfuqkzxzbazw`  
**Preview Supabase (verified isolated):** `emmzoeeaznhpwevqprkn`

### Executive verdict (for Director decision)

| Axis | Verdict |
| --- | --- |
| M2 Preview programme | **PASS** (PV3) — live Preview verified |
| Production promotion now | **NO-GO** |
| Programme acceptance | **CONDITIONAL GO** — promote only after Director clears §7 conditions |
| This run mutations | **None** (docs commit only) |

**STOP.** Awaiting Director decision. Do not promote.

---

## 1. Production baseline vs Preview RC

### 1.1 Deployments

| Surface | Identifier | State | Notes |
| --- | --- | --- | --- |
| **Preview RC** | `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` | **READY** | SHA `6258cada`; branch `cursor/autonomous-pipeline-lockdown-1605`; Vercel `target: null` (Preview) |
| Preview URL | `https://sovereign-ai-executive-39wva2k02-davidoshoba-3659s-projects.vercel.app` | SSO **302** | Protected |
| **Production (current)** | `dpl_5jYU4Bx4ukFa2U5dGuDNj5RDxmJh` (newest sampled) | **READY** | `target: production`; created 2026-11-17; commit SHA **not exposed** on meta in API sample |
| Production host | `https://sovereign-ai-executive.vercel.app` / `www.echoesandvisions.com` | Public | **307** → `/sovereign-ai` on app host |

### 1.2 Runtime health delta (important)

| Probe | Preview RC (`6258cada`) | Current Production |
| --- | --- | --- |
| `GET /api/health` | `ok:true`, `database:"connected"`, `env.ok:true`, `version:"v1"` | `ok:true`, `versionedEditorialVerifierEnabled:true`, `researchAuditEngineRevision:"article-grounded-ev-reg-1"` (**different payload shape**) |
| `GET /api/health/db` | `ok:true`, `database:"connected"`, `articles:1` | `ok:true` only (no article count / database field in body) |
| Anonymous access | SSO **302** | Public (expected for Production) |

**Implication:** Production is healthy on the **currently deployed** build, but that build is **not** the Preview RC. Promoting `6258cada` would change Production behaviour/surface (including richer health responses and all M2/SR1 deltas). This is expected for a promote — it is **not** a no-op alias flip.

### 1.3 Git / package surface

| Check | Result |
| --- | --- |
| Remote RC tip | `6258cada` |
| Local evidence commits | `e666eef5`, `362dba7f` (ahead of origin; **docs-only**; optional to land later) |
| `origin/main` | `d564ce13` |
| Commits on RC not in `main` | **Large** (~518 in `main..6258cada` log) — promote is **not** a tiny cherry-pick; treat as full branch promote of the RC tip after dirty-tree exclusion |
| M2 product spine (P0–P5 + SR1) | Present at/before `4ec255b8` on this branch |
| Dirty worktree | **~31** porcelain lines of unrelated WIP — **must not** ride any Production package |

### 1.4 Environment matrix (non-secret)

| Variable | Preview | Production |
| --- | --- | --- |
| `DATABASE_URL` | Generic Preview + **RC branch override** (`emmzo…` Path B) | Production Sensitive (intended `kqptd…`) |
| `DIRECT_URL` | **RC branch override** only (Preview) | Production Sensitive |
| `NEXT_PUBLIC_SUPABASE_URL` | `emmzoeeaznhpwevqprkn.supabase.co` | `kqptdgbttfuqkzxzbazw.supabase.co` |
| `CRON_SECRET` | **Absent** (cron **401** on Preview) | Present (Sensitive) |
| `TWITTER_*` | **Absent** | Present (Sensitive) — live social possible only on Production |
| `NEXT_PUBLIC_APP_URL` | Preview encrypted (+ optional `preview/security-isolated` override) | Production Sensitive |

Isolation between Preview and Production DBs was proven for the RC Preview path (PV2D/PV3). Production must continue to use Production credentials only.

---

## 2. Security readiness

| Control | Status | Notes |
| --- | --- | --- |
| M2-SR1 agent auth | **PASS on Preview RC** | 106/112 gated; allowlist of 6; live `POST /api/agents/director` → **401**; cron → **401** |
| Autonomous Pipeline packaging | **PASS** | Still disabled (`403 AUTONOMOUS_PIPELINE_DISABLED`) after auth |
| Preview Deployment Protection | **PASS** | Live SSO **302** |
| Production Deployment Protection | N/A (public by design) | Rely on app auth + edge controls |
| Sensitive Production secrets | **Present / unreadable via CLI** | Expected; do not rotate in this assessment |
| Proposed Supabase Data API SQL | **OUT OF SCOPE / DO NOT APPLY** with M2 promote | `docs/security/proposed/*` remains separate programme |
| Residual | Authenticated editors retain agent compute power (by design); public allowlist discloses architecture metadata | Accept or waive at Director discretion |

**Security promote gate:** SR1 + Preview live auth probes are sufficient for **security acceptance of the RC tip**, provided Production promote does not include unrelated dirty WIP or proposed SQL.

---

## 3. Database readiness

| Check | Status | Notes |
| --- | --- | --- |
| Preview isolation | **PASS** | Live connected to isolated project; fail-closed excludes Production ref |
| Production DB connectivity (current deploy) | **PASS (current)** | `/api/health/db` → `ok:true` |
| Schema migrations in M2 P0–P5 / SR1 | **None** | App/docs/tests only — no Prisma migration bundled |
| Promote DB risk | **Medium (data, not schema)** | New code paths hit Production data; no M2 migration, but behavioural change against live content |
| RLS / public Data API remediation | **NOT READY / SEPARATE** | Proposed SQL must not ship with M2 |
| Concurrency suite | **UNVERIFIED** | Docker unavailable in agent env (M2-RR open item) |

**DB promote gate:** Schema-safe for M2 delta, but Director must accept behavioural risk on Production data and keep proposed SQL excluded.

---

## 4. Editorial / governance readiness

| Area | Status | Evidence |
| --- | --- | --- |
| Publishing spine (generate → audit → human → guards → social) | **PASS (programme)** | M2-RR §D; Director Checklist |
| Autonomous Pipeline lockdown | **PASS** | P0 + Preview behaviour |
| Facebook canonical `/blog/{slug}` | **PASS** | P2 in RC |
| EV-BIBLE-AUTHORITY-001 | **PASS** | Contract + tests |
| EV-REG-SPEC-1.1.0 | **PASS** | Spec without new engine |
| Director Checklist monitoring | **PASS** | Read-only overlay |
| Claim-selection-v15 suite | **OPEN GAP** | Pre-M2; 7 failing tests last measured — disposition required |
| Live social on Preview | **N/A / blocked by env** | No Twitter secrets on Preview |
| Live social on Production | **PROCESS GATE** | Credentials exist — promote must **not** imply social fire |

---

## 5. Operations readiness

| Item | Status | Notes |
| --- | --- | --- |
| Preview controlled deploy procedure | **Proven** | PV2D registration + PV3 API gitSource SHA deploy |
| Ignore Build Command | **Cleared** (`null`) | RC auto-Preview possible on push; intentional after PV3 |
| Rollback plan | **Documented** | Redeploy prior Production deployment; no M2 schema reverse |
| Monitoring | **Ready** | Director Checklist + health endpoints on RC |
| Cron on Production | **Armed** | `CRON_SECRET` present — confirm schedules acceptable post-promote |
| Release package hygiene | **NOT CLEAN YET** | Dirty WIP + local-only evidence commits must be handled explicitly |
| Canonical Production URLs | Documented | `sovereign-ai-executive.vercel.app` / `www.echoesandvisions.com` |

---

## 6. Release proposal (for Director approval — **DO NOT EXECUTE**)

### Proposed package

- **Commit to promote:** remote `6258cada` (Preview-verified).  
- **Optional follow-up docs tip:** land `e666eef5` / `362dba7f` / this `M2_PR1` commit on the branch **after** Director OK for docs sync (or include in a docs-only push that does not change app SHA if promote already done).  
- **Target:** Vercel **Production** for project `sovereign-ai-executive` only after explicit Director authorisation.  
- **Exclude:** all dirty WIP; all `docs/security/proposed/*.sql`; any live social exercise; any DB migration.

### Proposed steps (authorised run only)

1. Director written **GO** for Production promote of `6258cada` (or named successor SHA).  
2. Confirm Production env still points at `kqptdgbttfuqkzxzbazw` (public URL already verified; Sensitive DB URL operator attestation if required).  
3. Ensure working tree for release contains **only** intended commits (stash/exclude dirty paths).  
4. Promote via approved path (merge to `main` **or** Vercel promote/redeploy of the verified SHA — Director chooses; do not invent).  
5. Post-promote smoke: `/api/health`, `/api/health/db`, one gated agent **401** without auth, Director Checklist read, **no** social send.  
6. If regression: rollback by redeploying `dpl_5jYU4Bx4ukFa2U5dGuDNj5RDxmJh` (or newer known-good Production) immediately.

### Explicit non-goals of the promote

- No Supabase SQL apply  
- No Twitter/Facebook live publish test  
- No Preview DB credentials copied to Production  
- No inclusion of focus/OAuth/privacy WIP trees

---

## 7. Conditions before Production GO

| # | Condition | Owner |
| --- | --- | --- |
| 1 | Explicit Director **Production promote authorisation** naming the SHA | Director |
| 2 | Dirty worktree paths excluded from release package | Release operator |
| 3 | Claim-selection-v15 disposition (fix / waive / ticket) | Director |
| 4 | PostgreSQL concurrency suite waive or CI proof | Director |
| 5 | Confirm proposed Supabase SQL remains **not applied** with M2 | Director |
| 6 | Accept Production behavioural delta vs current Production health payload / RC surface | Director |
| 7 | Social freeze for promote window (no celebratory live send unless separately authorised) | Director |
| 8 | Post-promote smoke + rollback owner identified | Ops |

Until **all** are cleared or formally waived: Production remains **NO-GO**.

---

## 8. Evidence index

| Artefact | Ref |
| --- | --- |
| Preview verification | `docs/editorial/M2_PV3_PREVIEW_DEPLOYMENT_VERIFICATION.md` (`362dba7f`) |
| Gate C recovery | `docs/editorial/M2_PV2D_SAFE_BRANCH_REGISTRATION.md` |
| SR1 security | `docs/editorial/M2_SR1_AGENT_API_SECURITY_REMEDIATION.md` |
| M2-RR | `docs/editorial/M2_RELEASE_READINESS.md` |
| Preview deploy | `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` @ `6258cada` |
| Current Production sample | `dpl_5jYU4Bx4ukFa2U5dGuDNj5RDxmJh` |

---

## 9. Decision request

Director: choose one

1. **WAIVE / GO** — authorise Production promote of `6258cada` under §6 after acknowledging §7.  
2. **CONDITIONAL HOLD** — clear named §7 items first (list which).  
3. **NO-GO** — keep Production on current deployment; Preview RC remains validation-only.

**Assessment recommendation:** **CONDITIONAL HOLD** (programme ready; Production promote blocked on §7). Default without reply: **NO-GO**.

---

**Final line:** Production **NO-GO**. Preview **PASS** stands. **STOP** for Director decision.
