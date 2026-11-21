# EV-OPS-02 — Cloud Monitoring and Live Alerts

**Status:** CONDITIONAL PASS (cloud schedule active; live email blocked on sender domain)  
**Date:** 2026-11-21 (Australia/Adelaide)  
**Programme:** Echoes & Visions AI Blog Automation  
**Baseline engine:** EV-OPS-01 (`ops/ev-ops-01/`, evidence prep `50f4fcc6`)  
**Workflow activation commit (`main`):** `a6f6a9484cbbcaa19663c01d73be1db3d3aa73d6`  
**Production application SHA:** `6258cada`  
**Production deploy:** `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo`  
**Evidence branch:** `cursor/autonomous-pipeline-lockdown-1605`

---

## 1. Mission outcome

| Capability | Result |
| --- | --- |
| Persistent cloud schedule (`*/5`) | **PASS** — workflow active on `main`; three independent `event=schedule` successes |
| Live Director alerts | **HOLD** — Resend rejects sender domain (not verified); `MONITORING_ALERTS_LIVE=0` |
| Cross-runner dedupe | **PASS** (policy + unit tests) — emitter=`cloud`; Windows host Ready, non-emitter |
| Production unchanged | **PASS** — still `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` / `buildTime=2026-11-18T09:45:18.361Z` |
| No social / DB mutate / app deploy | **PASS** |

---

## 2. Workflow activation

| Field | Value |
| --- | --- |
| Workflow name | `EV-OPS-01 Production Monitor` |
| Path | `.github/workflows/ev-ops-01-production-monitor.yml` |
| Default branch | `main` |
| Activation SHA | `a6f6a948` |
| Files on `main` (only) | workflow YAML · `scripts/vercel-ignore-build.mjs` · `vercel.json` `ignoreCommand` |
| Engine checkout | evidence ref `cursor/autonomous-pipeline-lockdown-1605` (not a full evidence-branch merge) |
| Scheduler | `cron: "*/5 * * * *"` + `workflow_dispatch` |
| Workflow state | **active** |

---

## 3. GitHub secrets (names only)

| Secret | Present |
| --- | --- |
| `RESEND_API_KEY` | Yes |
| `MONITORING_ALERT_TO` | Yes (Director-confirmed `davidoshoba@gmail.com`) |
| `MONITORING_ALERT_FROM` | Yes (existing `EMAIL_FROM` / authorised sender config) |
| `MONITORING_ALERT_EMITTER` | Yes (`cloud`) |
| `MONITORING_ALERTS_LIVE` | Yes (**`0`** — live disabled until verified sender) |

Secret values were never printed or committed.

---

## 4. Controlled test email

| Step | Result |
| --- | --- |
| Recipient | Confirmed `davidoshoba@gmail.com` |
| Attempt | One labelled controlled test via existing Resend key + configured `EMAIL_FROM` |
| Provider response | **HTTP 403** — domain from `EMAIL_FROM` is **not verified** on Resend (`validation_error`) |
| Live mail delivered | **No** |
| Sender invent/replace | **Not done** (forbidden) |
| Recovery format | Verified dry-run subject/body shape |
| Cross-runner suppress | Host with `emitter=cloud` remains dry-run (file sink) |

**Blocker to clear live alerts:** verify the existing sender domain in Resend (or Director-authorise a different already-verified from-address). Then set `MONITORING_ALERTS_LIVE=1` and re-run one controlled test.

---

## 5. Three independent scheduled cloud runs

All `event=schedule`, `conclusion=success`, `headSha=a6f6a948`, Production pin observed in job output.

| # | Run ID | Created (UTC) | Artifact (30-day retention) |
| --- | ---: | --- | --- |
| 1 | [44900757859](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44900757859) | 2026-11-21T11:47:22Z | `ev-ops-01-evidence-44900757859` |
| 2 | [44901431374](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44901431374) | 2026-11-21T11:56:07Z | `ev-ops-01-evidence-44901431374` |
| 3 | [44903083595](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44903083595) | 2026-11-21T12:16:34Z | `ev-ops-01-evidence-44903083595` |

Each cycle reported `ok: true`, `severity: "ok"`, `deploymentId: dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo`.

Manual `workflow_dispatch` runs were **not** counted toward this evidence.

---

## 6. Evidence retention

| Location | Retention |
| --- | --- |
| GitHub Actions artifacts `ev-ops-01-evidence-<run_id>` | 30 days |
| Local host `ops/ev-ops-01/var/` (gitignored) | 30-day prune |
| Windows Task `EV-OPS-01-Production-Monitor` | State=`Ready` (evidence / non-live-emitter) |

---

## 7. Cross-runner alert deduplication

| Runner | Role |
| --- | --- |
| GitHub Actions | Sole intended live emitter (`MONITORING_RUNNER=cloud`, `MONITORING_ALERT_EMITTER=cloud`) when LIVE=1 |
| Windows Scheduled Task | Evidence-only while emitter≠host match; LIVE currently 0 |

Unit coverage: `tests/ops/ev-ops-02-alert-policy.test.mjs`.

---

## 8. Deployment protection

| Control | Result |
| --- | --- |
| Project Ignored Build Step | Set + re-read: marker `[ev-ops-monitor-only]` · evidence branch · path script `scripts/vercel-ignore-build.mjs` (≤256 chars) |
| `vercel.json` `ignoreCommand` | On `main` via activation commit |
| Push to `main` | Created deploy `dpl_HDT1mKrnB25DtKQHmPSz7hCM5B14` (target production) — **CANCELED** before Ready; aliases unchanged |
| Production alias after activation | Still `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |

**Limitation:** Ignored Build Step did not prevent deployment *object creation*; operator cancel was required once. Path-script fallback is now in the project ignore command for subsequent monitoring-only commits.

---

## 9. Production verification (final)

| Check | Result |
| --- | --- |
| Homepage `dpl_*` | `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| `/api/health` | `ok: true`, `database: connected`, `buildTime: 2026-11-18T09:45:18.361Z` |
| Application SHA pin | `6258cada` (unchanged; no new READY Production deploy) |
| Live social | None |
| DB writes | None |
| Production env var changes | None |

---

## 10. Remaining limitations

1. Live email blocked until Resend verifies the configured sender domain.  
2. `MONITORING_ALERTS_LIVE` remains `0`.  
3. GitHub `*/5` schedule intervals are best-effort (observed ~9–20 minute gaps under load).  
4. Vercel ignore may still create a short-lived BUILDING deployment object; cancel if Ready risk appears.  
5. Evidence-branch preview history may still contain READY non-production deploys from earlier pushes (not Production aliases).

---

## 11. Final status

**EV-OPS-02: CONDITIONAL PASS**

Cloud monitoring schedule is active and verified with three scheduled successes and retained artifacts, without changing the Production application deployment. Live Director notifications remain blocked solely on Resend sender-domain verification.
