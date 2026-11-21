# EV-OPS-02 — Cloud Monitoring and Live Alerts

**Status:** Prepared — awaiting Director approvals (CONDITIONAL / HOLD on live + schedule)  
**Date:** 2026-11-21 (Australia/Adelaide)  
**Programme:** Echoes & Visions AI Blog Automation  
**Baseline:** EV-OPS-01 commit `4511dc7e` (engine reused; no second monitoring system)  
**Production pin:** SHA `6258cada` · deploy `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo`  
**Evidence branch:** `cursor/autonomous-pipeline-lockdown-1605`  
**Default branch:** `main` (Vercel Production Branch)

---

## 1. Mission outcome (this run)

| Capability | Result |
| --- | --- |
| Reuse EV-OPS-01 engine | **Done** — same `ops/ev-ops-01/run-check.mjs` |
| Live alert delivery to Director | **BLOCKED** — recipient not confirmed; no live send performed |
| Persistent cloud schedule (`*/5`) | **BLOCKED** — workflow not on `main`; GitHub will not schedule from evidence branch |
| Cross-runner duplicate live alerts | **Mitigated in code** — single emitter role (`MONITORING_ALERT_EMITTER`) |
| Production unchanged | **Verified** — still `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` / `buildTime=2026-11-18T09:45:18.361Z` |

---

## 2. Workstream A — Live notifications

### Inspected

| Item | Finding |
| --- | --- |
| Existing Resend usage | Newsletter / email-execution routes use `RESEND_API_KEY` + `EMAIL_FROM` |
| Local sender | `EMAIL_FROM` configured (masked `Echoes & Visions <o***@davidictoptech.com>`) |
| Local API key | Present; Resend domains probe returns send-restricted key (cannot list domains; send path still possible) |
| `MONITORING_ALERT_TO` | **MISSING** in authorised env |
| `MONITORING_ALERTS_LIVE` | Not set (live disabled) |
| GitHub Actions secrets for monitoring | **None configured** |
| Controlled test mail | **Not sent** (recipient unconfirmed) |

### Policy added (EV-OPS-02)

Live mail requires **all** of:

1. `MONITORING_ALERTS_LIVE=1`
2. `MONITORING_ALERT_EMITTER` ∈ `{cloud,host}` matching `MONITORING_RUNNER`
3. `MONITORING_ALERT_TO` set
4. `RESEND_API_KEY` set
5. Operator confirmation flag for verify gate: `MONITORING_ALERT_TO_CONFIRMED=1`

Default: file-sink dry-run only. Host Windows task remains non-emitter unless explicitly set to `host`.

### Verification command (safe)

```powershell
node ops/ev-ops-01/verify-notify-config.mjs
```

---

## 3. Workstream B — Cloud monitoring

### Inspected

| Item | Finding |
| --- | --- |
| Workflow file | `.github/workflows/ev-ops-01-production-monitor.yml` on evidence branch only |
| Registered on default branch | **No** — `gh` reports workflow 404 on `main` |
| `schedule: "*/5 * * * *"` | Present in YAML; **inactive** until workflow exists on `main` |
| `workflow_dispatch` | Also unavailable until workflow is on default branch (GitHub API) |
| Checkout strategy | Workflow checks out evidence ref for monitor engine (minimal `main` surface) |
| Evidence retention | GHA artifacts 30 days + local `ops/ev-ops-01/var/` (gitignored) |
| Production deploy exclusion | `scripts/vercel-ignore-build.mjs` + `vercel.json` `ignoreCommand` prepared |

### Why schedule is blocked

GitHub Actions only runs `on.schedule` from the repository **default branch**. Evidence-branch placement cannot satisfy “three independent scheduled cloud runs.”

---

## 4. Cross-runner deduplication

| Runner | Role |
| --- | --- |
| GitHub Actions | Intended **live emitter** (`MONITORING_RUNNER=cloud`, `MONITORING_ALERT_EMITTER=cloud`) once secrets + recipient approved |
| Windows Task `EV-OPS-01-Production-Monitor` | Evidence / dry-run (`emitter=none` or mismatch → no live mail) |

Unit test: host with `LIVE=1` + `emitter=cloud` still file-sinks (`tests/ops/ev-ops-02-alert-policy.test.mjs`).

---

## 5. Production-safe default-branch placement (approval packet)

### Minimal files to place on `main` (after approval)

1. `.github/workflows/ev-ops-01-production-monitor.yml`
2. `scripts/vercel-ignore-build.mjs`
3. `vercel.json` (`ignoreCommand` only; existing cron entries unchanged)

Monitor engine may remain on evidence branch via workflow `checkout.ref`.

### Pre-merge safety

- `ignoreCommand` skips Vercel build when the commit touches only monitoring/ops/docs/workflow allowlisted paths.
- Do **not** merge unrelated dirty worktree files.
- Do **not** change Production env vars or application routes.

### GitHub secrets to create (after recipient confirmation)

| Secret | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Send-capable Resend key |
| `MONITORING_ALERT_TO` | Confirmed Director recipient |
| `MONITORING_ALERT_FROM` | Verified sender (or reuse authorised `EMAIL_FROM`) |
| `MONITORING_ALERTS_LIVE` | `1` only after controlled test GO |
| `MONITORING_ALERT_EMITTER` | `cloud` |

---

## 6. Consolidated Director approvals required

Reply with a single GO covering the items you accept:

1. **Recipient confirmation** — exact address for `MONITORING_ALERT_TO` (do not use guesses).  
2. **Controlled test alert** — authorise one dry-labelled test email to that address.  
3. **GitHub secrets** — authorise creating the five secrets above (values supplied by Director / vault; agents must not invent recipients).  
4. **Default-branch placement** — authorise merging/pushing the three minimal files to `main` under ignore-build protection.  
5. **Enable schedule live** — after three scheduled cloud runs succeed, authorise `MONITORING_ALERTS_LIVE=1` for ongoing alerts.

Until then: live mail stays off; cloud schedule stays inactive; Windows host monitoring continues.

---

## 7. Verification performed this run

| Check | Result |
| --- | --- |
| Unit tests EV-OPS-01 + EV-OPS-02 | **5/5 pass** |
| Alert simulation (open/dedupe/recovery) | **Pass** (dry-run) |
| Notify config verify | **Fail gate** — no `MONITORING_ALERT_TO`; TO unconfirmed |
| Resend key probe | Send-restricted key acknowledged (domains list N/A) |
| Cloud scheduled runs (3×) | **Not possible** — workflow absent from `main` |
| Manual cloud dispatch | **Not possible** — workflow not registered on default branch |
| Production pin | **Pass** — `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| DB writes / social / app deploy | **None** |

---

## 8. Outstanding blockers

1. Director-confirmed `MONITORING_ALERT_TO`.  
2. GitHub monitoring secrets not present.  
3. Workflow not on `main` → no cloud `schedule` / no registered workflow_dispatch.  
4. Controlled live test not authorised.  
5. Resend domain listing unavailable with current send-only key (not necessarily fatal for send).

---

## 9. Final recommendation

**HOLD live alerts and cloud schedule activation.**  
**PASS preparation** of emitter policy, ignore-build guard, workflow hardening, tests, and documentation on the evidence branch.

Next smallest safe action after Director GO: (1) set secrets + confirmed recipient, (2) merge minimal three-file packet to `main`, (3) observe ≥3 scheduled cloud runs, (4) one controlled test email, (5) enable `MONITORING_ALERTS_LIVE=1`.

---

## 10. Final status

**EV-OPS-02: CONDITIONAL PASS (preparation) / HOLD (live delivery + cloud schedule evidence)**
