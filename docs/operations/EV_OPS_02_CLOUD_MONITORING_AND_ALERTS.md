# EV-OPS-02 — Cloud Monitoring and Live Alerts

**Status:** CONDITIONAL PASS (cloud schedule active; live email blocked on Resend API-key account mismatch)  
**Updated:** 2026-11-22 (Australia/Adelaide)  
**Programme:** Echoes & Visions AI Blog Automation  
**Baseline engine:** EV-OPS-01 (`ops/ev-ops-01/`)  
**Workflow activation commit (`main`):** `a6f6a9484cbbcaa19663c01d73be1db3d3aa73d6`  
**Production application SHA:** `6258cada`  
**Production deploy:** `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo`  
**Evidence branch:** `cursor/autonomous-pipeline-lockdown-1605`

---

## 1. Mission outcome

| Capability | Result |
| --- | --- |
| Persistent cloud schedule (`*/5`) | **PASS** — ongoing successful `event=schedule` runs on `main` |
| Live Director alerts | **HOLD** — verified subdomain configured; API key cannot send from it |
| Cross-runner dedupe | **PASS** — `MONITORING_ALERT_EMITTER=cloud`; Windows host Ready / non-matching emitter dry-runs |
| Production unchanged | **PASS** — `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` / `buildTime=2026-11-18T09:45:18.361Z` |
| No social / DB mutate / app deploy | **PASS** |

---

## 2. Sender / recipient configuration (2026-11-22)

| Setting | Value |
| --- | --- |
| Sender | `Echoes & Visions Monitoring <monitor@alerts.davidictoptech.com>` |
| Recipient | `davidoshoba@gmail.com` (Director-confirmed) |
| Domain status (Director) | `alerts.davidictoptech.com` DNS Verified; sending enabled |
| `MONITORING_ALERTS_LIVE` | **`0`** (kept off until controlled test succeeds) |
| `MONITORING_ALERT_EMITTER` | `cloud` |

GitHub Actions secrets updated (names only; values not logged):  
`MONITORING_ALERT_FROM`, `MONITORING_ALERT_TO`, `MONITORING_ALERT_EMITTER=cloud`, `MONITORING_ALERTS_LIVE=0`, `RESEND_API_KEY` (existing local key re-applied).

---

## 3. Resend API key authorisation check

| Check | Result |
| --- | --- |
| Local `.env` `RESEND_API_KEY` | Present (send-only restricted key; domains API returns restricted) |
| Controlled send from `monitor@alerts.davidictoptech.com` | **HTTP 403** — `The alerts.davidictoptech.com domain is not verified` for **this** API key’s account |
| Vercel Production `RESEND_API_KEY` | Present as Sensitive; **not readable** via CLI/API decrypt (cannot reuse/replace from here) |
| Alternate authorised key in workspace | **None found** |
| Secure key replace performed | **No** — no authorised replacement credential available without Director provisioning |

**Exact blocker:** The Resend API key currently stored for monitoring (local + GitHub secret) belongs to an account/team that does **not** own the verified `alerts.davidictoptech.com` domain. Director must set `RESEND_API_KEY` in GitHub Actions secrets to a key from the Resend account where that subdomain is verified (GitHub → Settings → Secrets, or local `gh secret set RESEND_API_KEY` — do not paste the key into chat). Then re-run `node ops/ev-ops-01/send-controlled-test.mjs` and flip `MONITORING_ALERTS_LIVE=1`.

---

## 4. Controlled test email (2026-11-22)

| Step | Result |
| --- | --- |
| From | `monitor@alerts.davidictoptech.com` |
| To | `davidoshoba@gmail.com` |
| Live flag during test | Explicit notifier live path; GitHub `MONITORING_ALERTS_LIVE` remained `0` |
| Provider acceptance | **Failed** — HTTP 403 `validation_error` (domain not verified for this key) |
| Delivery status | N/A (no provider message id) |
| Host duplicate suppression | **Pass** — host + `emitter=cloud` → dry-run file sink only |

---

## 5. Scheduled cloud runs (independent `event=schedule`)

Workflow remains active. Latest three successful scheduled runs (UTC):

| # | Run ID | Created (UTC) | Conclusion |
| --- | ---: | --- | --- |
| 1 | [44987176552](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44987176552) | 2026-11-22T04:55:54Z | success |
| 2 | [44986544739](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44986544739) | 2026-11-22T04:46:51Z | success |
| 3 | [44985863414](https://github.com/Dphoshoba/sovereign-ai-system/actions/runs/44985863414) | 2026-11-22T04:37:19Z | success |

Evidence artifacts continue under `ev-ops-01-evidence-<run_id>` (30-day retention).  
Initial activation triple (2026-11-21): `44900757859`, `44901431374`, `44903083595`.

---

## 6. Cross-runner deduplication

| Runner | Behaviour |
| --- | --- |
| GitHub Actions | Intended live emitter when `LIVE=1` + secrets valid |
| Windows `EV-OPS-01-Production-Monitor` | State=`Ready`; with `emitter=cloud` does not live-send (confirmed in controlled-test host-suppression path) |

---

## 7. Production verification (2026-11-22)

| Check | Result |
| --- | --- |
| Homepage `dpl_*` | `dpl_EnwRCcCgUuH2Jb4SC48MMdc5vdMo` |
| `/api/health` | `ok: true`, `database: connected`, `buildTime: 2026-11-18T09:45:18.361Z` |
| Application SHA | `6258cada` (unchanged) |
| App code / DB / social / Production env mutation | None this run |

---

## 8. Remaining limitation / next action

1. Provision GitHub secret `RESEND_API_KEY` from the Resend account that owns `alerts.davidictoptech.com`.  
2. Re-run controlled test (`node ops/ev-ops-01/send-controlled-test.mjs`).  
3. On success: `gh secret set MONITORING_ALERTS_LIVE --body 1` (keep emitter=`cloud`).  
4. Confirm one scheduled cloud cycle can notify without Windows duplicate.

---

## 9. Final status

**EV-OPS-02: CONDITIONAL PASS**

Cloud monitoring schedule is active and healthy. Live alerting configuration for the verified subdomain is prepared (from/to/emitter) but **not enabled**, because the available Resend API key is not authorised for `alerts.davidictoptech.com`.
