# M2-PV3 — Controlled Preview Deployment & Live Verification

**Date:** 2026-11-18  
**Authorisation:** Director **AUTHORISED** Preview deploy  
**Remote RC tip deployed:** `6258cada83312f409b67044dda79ad177bd0e8ba`  
**Local evidence tip (not required on remote):** `e666eef5` (may stay local)  
**Branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Vercel project:** `davidoshoba-3659s-projects/sovereign-ai-executive`  
**Expected Preview DB / Supabase:** `emmzoeeaznhpwevqprkn`  
**Forbidden Production:** `kqptdgbttfuqkzxzbazw` — **NO-GO**

### Verdict

**PREVIEW PASS**

Production remains **NO-GO**. No Production promote, no Production env mutation, no live social.

---

## 1. Pre-checks & Gates A–D (pre-deploy)

| Gate | Pre-deploy | Evidence |
| --- | --- | --- |
| **A** Ancestry | **PASS** | Remote tip `6258cada`; `4ec255b8` is ancestor; dirty WIP not deployed |
| **B** Protection | **PASS** | Team Preview host anonymous **302** → `vercel.com/sso-api` |
| **C** DB isolation config | **PASS** | RC branch-specific Preview `DATABASE_URL` + `DIRECT_URL` present (ids `7qdMpkY5…`, `IftYLUT5…`); Production rows untouched |
| **D** No live social | **PASS** | No social calls; `TWITTER_*` / `CRON_SECRET` Production-only |

Ignore Build Command before clear:

```text
if [ "$VERCEL_GIT_COMMIT_REF" = "cursor/autonomous-pipeline-lockdown-1605" ]; then exit 0; else exit 1; fi
```

---

## 2. Ignore Build Command — narrow remove

| Action | Result |
| --- | --- |
| `PATCH` project `commandForIgnoringBuildStep: null` | HTTP **200** |
| Re-read | **`null`** (cleared) |
| Scope | Project-level restore of default; RC can build; Production branch still `main` |

No generic Preview env rewrite. No Production env rewrite.

---

## 3. Controlled Preview deployment

| Field | Value |
| --- | --- |
| Method | Vercel API `POST /v13/deployments` + `gitSource` (exact SHA) |
| `gitSource.ref` | `cursor/autonomous-pipeline-lockdown-1605` |
| `gitSource.sha` | `6258cada83312f409b67044dda79ad177bd0e8ba` |
| `target` | **omitted** → Preview (`target: null` on result) |
| Deployment id | `dpl_2qScTYYwxAycMF1c74z6yomcgfgK` |
| URL | `https://sovereign-ai-executive-39wva2k02-davidoshoba-3659s-projects.vercel.app` |
| Alias | `sovereign-ai-executive-git-cu-f21e1f-davidoshoba-3659s-projects.vercel.app` |
| Inspector | `https://vercel.com/davidoshoba-3659s-projects/sovereign-ai-executive/2qScTYYwxAycMF1c74z6yomcgfgK` |
| Ready state | **READY** |
| Production deploy | **Not performed** |

Local dirty tree and local-only `e666eef5` were **not** included (gitSource SHA deploy).

---

## 4. Post-deploy verification

### 4.1 Gate B — Deployment Protection — **PASS**

Anonymous `HEAD` on deployment URL and `/api/health` → **HTTP 302** to `vercel.com/sso-api`, `X-Robots-Tag: noindex`.

### 4.2 Runtime health / DB — **PASS**

Via `vercel curl` (protection bypass for authenticated operator probe only):

| Endpoint | Result |
| --- | --- |
| `GET /api/health` | `ok: true`, `database: "connected"`, `env.ok: true` |
| `GET /api/health/db` | `ok: true`, `database: "connected"`, `articles: 1` |

Note: health JSON `environment: "production"` reflects **Node `NODE_ENV`** on Vercel builds, **not** Vercel deployment target. Deployment `target` remains **null (Preview)**.

### 4.3 Gate C — Live isolation — **PASS**

| Proof | Detail |
| --- | --- |
| Preview public Supabase URL | `emmzoeeaznhpwevqprkn.supabase.co` (encrypted Preview env) |
| Production public Supabase URL (control) | `kqptdgbttfuqkzxzbazw.supabase.co` (Production/Development row — unused by this Preview) |
| RC branch DB overrides | Preview `DATABASE_URL` + `DIRECT_URL` with `gitBranch = cursor/autonomous-pipeline-lockdown-1605` |
| Fail-closed runtime | `preview-postgres` throws if Preview `DATABASE_URL` contains Production ref; live DB **connected** ⇒ effective URL **does not** contain `kqptdgbttfuqkzxzbazw` |
| Preview article count | `1` (matches isolated Preview posture from prior Path A runtime probes) |

Sensitive secret values were **not** re-printed.

### 4.4 Security / governance — **PASS**

| Check | Result |
| --- | --- |
| Allowlisted `GET /api/agents/architecture-overview` | **200** (expected public metadata) |
| Gated `POST /api/agents/director` (no auth) | **401** `AUTHENTICATION_REQUIRED` |
| `GET/POST /api/cron/run-pipeline` (no secret) | **401** `Unauthorized` (Preview lacks `CRON_SECRET`) |
| Live social publish | **Not performed** |
| Production host `sovereign-ai-executive.vercel.app` | Still public **307** → `/sovereign-ai` (unchanged; not this deploy) |

### 4.5 Monitoring / incident — **PASS (no containment required)**

| Signal | Result |
| --- | --- |
| Deployment readyState | **READY** (no ERROR) |
| Runtime logs scan for Production ref / DB failure strings | **No matches** in sampled `vercel logs` |
| Containment actions | **None required** (no Production-ref incident, no failed Ready, no social leak) |

---

## 5. Gates A–D (post-deploy consolidated)

| Gate | Result |
| --- | --- |
| **A** | **PASS** — exact remote RC SHA deployed |
| **B** | **PASS** — SSO 302 on live Preview URL |
| **C** | **PASS** — Preview DB connected; public + fail-closed isolation to `emmzoeeaznhpwevqprkn` |
| **D** | **PASS** — no live social; cron/Twitter remain Production-credentialed |

---

## 6. Mutations this run

| Action | Done? |
| --- | --- |
| Cleared Ignore Build Command | **Yes** → `null` |
| Preview deploy of `6258cada` | **Yes** → Ready |
| Production deploy / promote | **No** |
| Production / generic Preview env mutation | **No** |
| Live social | **No** |
| Local verification commit | **Yes** (this document) |
| Push of local evidence commits | **No** (not required) |

---

## 7. Residual notes

1. Ignore Build Command remains **cleared**; subsequent pushes to this RC branch will auto-Preview unless re-gated.  
2. Health payload `environment: "production"` is Node env naming — do not confuse with Vercel Production target.  
3. Production remains **NO-GO** pending separate Director authorisation.

---

**Final line:** **PREVIEW PASS.** Production **NO-GO.**
