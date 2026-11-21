# EV-OPS-01 — Continuous Production Monitoring and Alerting

**Status:** Implemented (monitoring infrastructure)  
**Programme:** Echoes & Visions AI Blog Automation  
**Date:** 2026-11-21  
**Production URL:** https://www.echoesandvisions.com  
**Pinned deploy:** `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo`  
**Pinned app SHA:** `6258cada83312f409b67044dda79ad177bd0e8ba`  
**Evidence branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Scope:** Monitoring only — no Production app redeploy, migration, env mutation, or live social.

---

## 1. Monitoring architecture

```
Windows Task Scheduler (every 5 min) ─┐
GitHub Actions schedule/dispatch ─────┼─► node ops/ev-ops-01/run-check.mjs
                                      │     ├─ public HTTPS probes
                                      │     ├─ classify incidents
                                      │     ├─ write evidence under ops/ev-ops-01/var/
                                      │     └─ notify (dry-run file sink by default;
                                      │         optional Resend when LIVE=1)
                                      └─ artifacts / local retention (30 days)
```

**Prefer existing infrastructure**

| Capability | Choice |
| --- | --- |
| Health signals | Existing public `GET /api/health`, `GET /api/health/db`, homepage |
| Auth containment probes | Existing unauthenticated 401 expectations (director / cron / twitter) |
| Notification transport | Existing Resend API pattern (gated; dry-run default) |
| Cloud scheduler | GitHub Actions (`*/5 * * * *` + `workflow_dispatch`) |
| Host scheduler | Windows Scheduled Task `EV-OPS-01-Production-Monitor` |

No new Production application routes. No privileged diagnostic exposure. Auth is never bypassed.

---

## 2. Scheduler configuration

### Primary (host-persistent)

| Field | Value |
| --- | --- |
| Mechanism | Windows Scheduled Task |
| Task name | `EV-OPS-01-Production-Monitor` |
| Interval | **Every 5 minutes** |
| Command | `node ops/ev-ops-01/run-check.mjs` |
| Installer | `ops/ev-ops-01/install-windows-task.ps1` |
| Independence | Runs without Cursor/Grok sessions while the host is on |

### Secondary (cloud)

| Field | Value |
| --- | --- |
| Workflow | `.github/workflows/ev-ops-01-production-monitor.yml` |
| Triggers | `schedule: */5 * * * *`, `workflow_dispatch` |
| Checkout ref | `cursor/autonomous-pipeline-lockdown-1605` |
| GitHub limitation | **`schedule` only executes from the repository default branch (`main`)** |
| Production safety | Evidence-branch pushes do not change Production while Production Branch = `main` |

**Activation note:** Until the workflow file also exists on `main` *and* Vercel ignored-build protects ops/docs-only commits, rely on the Windows Task + `workflow_dispatch` for continuity. Promoting the workflow onto `main` requires a separate Director authorisation because `main` auto-deploys Production.

---

## 3. Checks implemented

| Check ID | Target | Pass rule |
| --- | --- | --- |
| `homepage` | `GET /` | HTTP 200 |
| `health` | `GET /api/health` | HTTP 200 |
| `healthDb` | `GET /api/health/db` | HTTP 200 |
| `healthSemantics` | derived | `ok:true` and `database:"connected"` |
| `deploymentIdentity` | derived | observed `dpl_*` / `buildTime` match pin (when observable) |
| `directorAuth` | `POST /api/agents/director` | HTTP **401** |
| `cronPipelineAuth` | `GET /api/cron/run-pipeline` | HTTP **401** |
| `cronPublishAuth` | `GET /api/cron/publish-scheduled` | HTTP **401** |
| `socialTwitterAuth` | `POST /api/social/publish/twitter` | HTTP **401** (no publish body effect when unauthenticated) |

Response time recorded for every probe.

---

## 4. Alert thresholds

| Severity | Condition | Threshold |
| --- | --- | --- |
| **Critical** | Production unavailable (`homepage` fail) | 2 consecutive cycles |
| **Critical** | Database connectivity / health semantics fail | 2 consecutive cycles |
| **Critical** | Unexpected Production deployment / buildTime | 2 consecutive cycles |
| **Critical** | Auth-gate anomaly (not 401) | 2 consecutive cycles |
| **Critical** | HTTP 5xx burst | ≥2 failing 5xx results in a cycle after streak rules |
| **Warning** | Elevated latency | same check ≥ `slowResponseMs` (5000) for 3 consecutive cycles |
| **Warning** | Missing monitoring data | scheduler/operator if cycles stop (manual / missing latest) |

**Dedup:** Open incidents keyed by severity+code; no repeat open notification while unresolved.  
**Recovery:** Resolution notification when an open incident clears.

---

## 5. Notification destination

| Mode | Behaviour |
| --- | --- |
| Default | **Dry-run file sink** → `ops/ev-ops-01/var/notifications/*.json` |
| Live email | Requires `MONITORING_ALERTS_LIVE=1`, `MONITORING_ALERT_TO=<recipient>`, and `RESEND_API_KEY` |
| Recipient | **Not live-enabled in verification** — Director must confirm recipient before live mail |

No test alerts were sent to real recipients during EV-OPS-01 setup.

---

## 6. Evidence retention

| Item | Location |
| --- | --- |
| Runtime evidence root | `ops/ev-ops-01/var/` (gitignored) |
| Per-cycle records | `ops/ev-ops-01/var/checks/<timestamp>.json` + `latest.json` |
| Incident state | `ops/ev-ops-01/var/state.json` |
| Notification receipts | `ops/ev-ops-01/var/notifications/` |
| GHA artifacts | `ev-ops-01-evidence-<run_id>` (30 days) |
| Retention prune | 30 days (local prune on each cycle) |

Each check record stores UTC timestamp, check id, HTTP status, duration, pass/fail, deployment id, and error summary **without secrets**.

---

## 7. Security controls

- Public/read-only probes only; no auth bypass.
- Social publish endpoint probed only for **401**; live social is not invoked.
- Production cron behaviour is not modified (`vercel.json` application cron untouched).
- Secrets never written into evidence JSON.
- Live email gated behind explicit env flags.

---

## 8. Operational runbook

### Install / start (Windows host)

```powershell
cd C:\Users\David\echoes-visions-nextjs-cta
powershell -ExecutionPolicy Bypass -File ops\ev-ops-01\install-windows-task.ps1
Get-ScheduledTask -TaskName EV-OPS-01-Production-Monitor
```

### Manual cycle

```powershell
node ops/ev-ops-01/run-check.mjs
```

### Safe alert simulation

```powershell
node ops/ev-ops-01/simulate-alerts.mjs
```

### Inspect latest evidence

```powershell
Get-Content ops\ev-ops-01\var\checks\latest.json
Get-Content ops\ev-ops-01\var\state.json
```

### Cloud dispatch (evidence branch workflow)

```powershell
gh workflow run "EV-OPS-01 Production Monitor" --ref cursor/autonomous-pipeline-lockdown-1605
```

### Incident response

1. Read `ops/ev-ops-01/var/checks/latest.json` and open incidents in `state.json`.  
2. Confirm Production aliases still point at expected `dpl_*`.  
3. Escalate Critical to Director.  
4. **Do not** rollback/redeploy/migrate unless newly authorised.

---

## 9. Verification results

Recorded during EV-OPS-01 setup (Australia/Adelaide local operator host, 2026-11-21):

| Test | Result |
| --- | --- |
| Unit tests (`tests/ops/ev-ops-01-monitoring.test.mjs`) | **Pass** (2/2) |
| Alert simulation (open / dedupe / recovery, dry-run) | **Pass** |
| Three successive live Production cycles | **Pass** — `2026-11-21T11:18:09.101Z`, `11:18:11.619Z`, `11:18:14.087Z` all `ok` on pin `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| Windows Scheduled Task registered | **Pass** — `EV-OPS-01-Production-Monitor` State=Ready |
| Automatic scheduler fire (no manual start) | **Pass** — LastRunTime `2026-11-21 21:49:39` Australia/Adelaide, LastTaskResult=0, evidence `2026-11-21T11-19-43-453Z.json`, NextRunTime +5m |
| GitHub workflow file | Added on evidence branch; `schedule` effective only after authorised default-branch placement |
| Production deploy unchanged | **Pass** — health `buildTime=2026-11-18T09:45:18.361Z`; homepage `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| Live social triggered | **No** |
| Live email alerts sent | **No** (dry-run only) |

---

## 10. Known limitations

1. GitHub `schedule` does not run from non-default branches; cloud cron requires a future authorised `main` workflow placement with Vercel ignored-build protection.  
2. Live Resend alerts are intentionally disabled until Director confirms recipient.  
3. Deployment identity observation depends on public HTML embedding `dpl_*` and `/api/health` `buildTime`.  
4. Host Task Scheduler requires the operator machine to be powered on; pair with GHA once schedule-on-default is authorised.  
5. Does not scrape Vercel private logs or Supabase privileged metrics (would need new credentials / auth bypass — out of scope).

---

## 11. Final status

**EV-OPS-01: CONDITIONAL PASS**

Working persistent host scheduler + executable monitoring service + evidence + dry-run alerting are in place without Production mutation. Full cloud `*/5` schedule on GitHub remains conditional on an authorised default-branch workflow publication that cannot redeploy Production.
