# EV-EDITORIAL-07 — Director Acceptance Checklist (UI only)

**Preview URL:** https://sovereign-ai-executive-nvh9chxlf-davidoshoba-3659s-projects.vercel.app  
**Deployment:** `dpl_iraDxQ6Di3cZqU6wCe3mDs54RfPB` (Preview only)  
**Pin:** `aad3d160` on branch `cursor/ev-editorial-07-p0u`  
**Rule:** Use the normal signed-in admin UI only. No Console, no cookies export, no API tools.

Sign into Preview with your editor account when Vercel Authentication prompts.

---

## A. Preparation (AI Generator)

1. Open **AI Generator** (nav) or `/admin/ai-generator`.
2. Confirm the primary button is labelled **Prepare for Director Review**.
3. Enter a clearly disposable Preview topic (prefix with `P0U-ACCEPT-` + date).
4. Keep category sensible (e.g. `ai-automation`).
5. Click **Prepare for Director Review**.
6. Wait for progress: draft creation → editorial stages.
7. Expect one of: navigation to article edit, or on-page outcome `ready_for_human_review` / `already_applied` / `hold` / `failed`.
8. If **HOLD**: read the HOLD reason; use **Retry preparation** only if offered; do not invent sources.

**Pass if:** Platform runs preparation without Console/API; outcome is visible; no auto-approve / schedule / publish / social send.

---

## B. Decision Board

1. Open **Decision Board** (`/admin/director-board`).
2. Locate the article from step A (title or HOLD bucket).
3. Confirm status bucket is sensible (`Being prepared` / `Review-ready` / `On HOLD`).
4. Confirm audit summary or HOLD text is shown when applicable.
5. Use **Open** / **Checklist** links as needed (read-only OK).

**Pass if:** Article appears in the board without hunting through unrelated admin screens.

---

## C. Human approval boundary

1. From Decision Board or article edit, open review actions.
2. Confirm **Approve** is available only when the UI allows (current audit path).
3. **Do not Approve yet** if you only want to confirm the boundary — or Approve only for this disposable Preview article.
4. Confirm there is no control that publishes or posts to social in the same click as Approve.

**Pass if:** Approval remains an explicit human action; publish/social are separate.

---

## D. Post-approval image + calendar (Preview-only, optional but preferred)

Only after you intentionally **Approve** the disposable Preview article:

1. Expect the platform to attempt featured-image preparation (may succeed, already_applied, or report failure).
2. Expect optional calendar slot assignment only when gates allow (image + publish-ready audit).
3. If scheduling occurs, note the Adelaide/future slot; **do not** force cron or publish.
4. Open **Social** only to confirm drafts (if any) still need separate approval — **do not publish social**.

**Pass if:** Any image/calendar work is post-approval; no live public Production content changes; no social send.

---

## E. Production untouched (Director spot-check)

1. In a separate tab, open Production site `https://www.echoesandvisions.com` (or known Production admin if you use it).
2. Confirm you did **not** create the `P0U-ACCEPT-` article there.
3. Confirm existing Production schedules you care about are unchanged.

**Pass if:** Acceptance work stayed on Preview.

---

## Sign-off

| Item | Pass? | Notes |
| --- | --- | --- |
| A Preparation | ☐ | |
| B Decision Board | ☐ | |
| C Approval boundary | ☐ | |
| D Post-approval (if run) | ☐ | |
| E Production untouched | ☐ | |

Director name: __________________  
Date/time (Australia/Adelaide): __________________  
Article ID / title (Preview): __________________  
