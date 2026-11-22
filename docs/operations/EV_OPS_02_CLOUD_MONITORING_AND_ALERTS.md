# EV-OPS-02 — Cloud Monitoring and Live Alerts

**Status:** **PASS**  
**Finalised:** 2026-11-22 (Australia/Adelaide)  
**Repository:** `Dphoshoba/sovereign-ai-system`  
**Baseline engine:** EV-OPS-01 (`ops/ev-ops-01/`)  
**Workflow activation / controlled-test mode (`main`):** `dd18fee8c9fd2a1dd11d37ce312d46fe4074a4a0`  
**Evidence branch tip (this report):** see git commit after docs land  
**Production application SHA:** `6258cada`  
**Production deploy:** `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo`

---

## 1. Mission outcome

| Capability | Result |
| --- | --- |
| Persistent cloud schedule (`*/5`) | **PASS** |
| Controlled test via GitHub Actions secrets | **PASS** — Resend **accepted** (HTTP 200) |
| Live alerts enabled | **PASS** — `MONITORING_ALERTS_LIVE=1`, emitter=`cloud` |
| Post-LIVE scheduled monitoring cycle | **PASS** — run `44989818787` |
| Cross-runner dedupe (Windows dry-run) | **PASS** |
| Production unchanged | **PASS** |

---

## 2. Notification configuration

| Secret | Configured |
| --- | --- |
| `RESEND_API_KEY` | Yes (Director-updated; Actions-only for live path) |
| `MONITORING_ALERT_FROM` | `monitor@alerts.davidictoptech.com` |
| `MONITORING_ALERT_TO` | `davidoshoba@gmail.com` |
| `MONITORING_ALERT_EMITTER` | `cloud` |
| `MONITORING_ALERTS_LIVE` | **`1`** (enabled after controlled test success) |

Secret values are not logged or committed.

---

## 3. Controlled test email (GitHub Actions)

| Field | Evidence |
| --- | --- |
| Run | [44989401758](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44989401758) (`workflow_dispatch`, `mode=controlled_test`) |
| Secret source | `github_actions_secrets` (script ignores local `.env` when `GITHUB_ACTIONS=true`) |
| Resend **acceptance** | **Yes** — `delivery: resend`, HTTP **200**, provider message id present |
| Confirmed **mailbox delivery** | **Not independently confirmed** — Resend email-status lookup returned HTTP 401 (send-capable key cannot read message status). Acceptance ≠ inbox delivery proof. |
| Host duplicate suppression | Host runner + `emitter=cloud` → dry-run file sink only |
| Artifact | `ev-ops-01-evidence-44989401758` |

---

## 4. Post-LIVE scheduled cloud run

| Field | Evidence |
| --- | --- |
| LIVE enabled at (UTC) | 2026-11-22T05:26:46Z (`MONITORING_ALERTS_LIVE` secret updated) |
| Schedule run | [44989818787](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44989818787) |
| Event | `schedule` |
| Created (UTC) | 2026-11-22T05:32:05Z (**after** LIVE enablement) |
| Conclusion | **success** |
| Checks | All probes `pass: true`; `ok: true`; `severity: "ok"` |
| Deployment identity | `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| Opened incidents / notifications | None (healthy Production — no alert email expected this cycle) |
| Artifact | `ev-ops-01-evidence-44989818787` |
| Live config active | Secrets inject `MONITORING_ALERTS_LIVE` + `MONITORING_ALERT_EMITTER` into the monitor job |

---

## 5. Cross-runner behaviour

| Runner | Role |
| --- | --- |
| GitHub Actions | Sole live emitter (`MONITORING_RUNNER=cloud`, `MONITORING_ALERT_EMITTER=cloud`) |
| Windows `EV-OPS-01-Production-Monitor` | State=`Ready`; local `MONITORING_ALERTS_LIVE` / `MONITORING_ALERT_EMITTER` unset → no live mail |

---

## 6. Production verification (final)

| Check | Result |
| --- | --- |
| Homepage `dpl_*` | `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| `/api/health` | `ok: true`, `database: connected`, `buildTime: 2026-11-18T09:45:18.361Z` |
| Application SHA pin | `6258cada` |
| App / DB / social / Production env mutation this programme | None |

Workflow-only `main` pushes used `[ev-ops-monitor-only]`; any BUILDING Production objects were canceled and never became Ready.

---

## 7. Remaining limitations

1. Resend **acceptance** (HTTP 200 + provider id) is verified; **end-user inbox delivery** is not proven via API with the current send-scoped key (status lookup 401).  
2. GitHub `*/5` schedule timing is best-effort under load.  
3. Vercel Ignored Build Step may still create short-lived BUILDING deployment objects on `main` monitoring commits; cancel if needed.  
4. Healthy cycles correctly emit **zero** alert emails; live path is exercised by controlled test and by future real incidents.

---

## 8. Final status

**EV-OPS-02: PASS**
