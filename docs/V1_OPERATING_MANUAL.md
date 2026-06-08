# V1 Operating Manual — Sovereign AI System

**Last updated:** 2026-06-03  
**Phase:** 17.1 — Production Launch Preparation  
**Scope:** Rule-based V1 executive stack (no auto-publish, no auto-email, no auto-delete)

This manual describes the recommended operating rhythm for Echoes & Visions Sovereign V1. All destructive or outbound actions require explicit operator approval.

---

## Primary destinations

| Route | Role |
|-------|------|
| [`/admin/runtime`](/admin/runtime) | Top-level executive orchestration — start here |
| [`/admin/command-center`](/admin/command-center) | Unified health, alerts, priorities |
| [`/admin/operations`](/admin/operations) | Hub for content ops + executive quick actions |

**Avoid for daily V1 work (legacy):** `/admin/sovereign-runtime`, `/admin/command-center-v2`, `/admin/live-command-center`, `/admin/executive-overview`, `/admin/persistent-runtime`

---

## Daily workflow

**Time:** ~15–20 minutes each business day

### 1. Check Sovereign Runtime

- Open **`/admin/runtime`**
- Review: executive status, runtime health, active risks, priorities, connected systems
- API: `GET /api/executive/runtime`

### 2. Check Command Center

- Open **`/admin/command-center`**
- Review: health score, alerts, revenue/delivery/content signals, boardroom summary
- API: `GET /api/executive/command-center`

### 3. Review Daily Briefing

- Open **`/admin/daily-briefing`**
- Generate or review today's briefing if not yet created
- API: `GET /api/executive/daily-briefing`

### 4. Run boardroom session (if needed)

- Open **`/admin/boardroom`**
- Run a session when major decisions, weekly cadence, or cross-functional review is due
- Sessions are stored; key decisions saved to decision memory
- API: `POST /api/executive/boardroom` (explicit action)

### 5. Review recommendations

- Open **`/admin/executive-recommendations`**
- API: `GET /api/executive/recommendations`
- Treat as advisory — no automatic execution

### 6. Check revenue and delivery

- **`/admin/revenue`** — pipeline, invoiced, outstanding
- **`/admin/delivery`** — active projects, overdue tasks, delivery health
- APIs: `/api/revenue/summary`, `/api/delivery/summary`

### Daily health check (optional automation)

```bash
BASE_URL=https://your-domain.com npm run smoke:v1
```

Or quick API probe:

```bash
curl -s https://your-domain.com/api/health
curl -s https://your-domain.com/api/executive/health
```

---

## Weekly workflow

**Time:** ~45–60 minutes, end of week or Monday morning

### 1. Archive daily briefings

- Ensure the week's briefings are archived for review history
- API: `POST /api/executive/daily-briefing/archive`
- UI: daily briefing page archive action (if exposed)

### 2. Generate weekly review

- Open **`/admin/weekly-review`**
- Generate and read executive summary, risks, opportunities
- API: `GET /api/executive/weekly-review`

### 3. Generate planning cycle

- Open **`/admin/planning-cycles`**
- Run weekly planning cycle (review recommendations, risks, actions)
- API: `POST /api/executive/planning-cycles` with `cycleType: "weekly"`
- Run actions only via explicit **`/api/executive/planning-cycles/run-action`** when approved

### 4. Review goals and initiatives

- **`/admin/goals`** — quarterly goals progress
- **`/admin/initiative-performance`** — initiative health and linkage
- **`/admin/execution`** — strategic initiatives and blocked items
- APIs: `/api/executive/goals`, `/api/executive/initiative-performance`, `/api/executive/execution`

### 5. Boardroom cadence

- If not done daily, run weekly boardroom session at **`/admin/boardroom`**

---

## Monthly workflow

**Time:** ~1–2 hours, last business day of month or first day of new month

### 1. Generate monthly review

- Open **`/admin/monthly-review`**
- Review health score, executive summary, trend analysis
- Export PDF if needed: `/api/executive/monthly-review/pdf`
- API: `GET /api/executive/monthly-review`

### 2. Review simulations

- Open **`/admin/simulations`**
- Run strategic simulations for upcoming decisions (advisory only)
- API: `GET /api/executive/simulations`, `POST` to create

### 3. Review strategy adjustments

- Open **`/admin/strategy-adjustments`**
- Generate proposals from quarterly/monthly signals if needed (`POST`)
- **Apply only after explicit review:** `/api/executive/strategy-adjustments/apply`
- Never auto-implement — status changes require operator PATCH/apply

### 4. Review forecast and strategic plan

- **`/admin/executive-forecast`** — `/api/executive/forecast`
- **`/admin/strategic-plan`** — `/api/executive/strategic-plan`

### 5. Knowledge graph (monthly maintenance)

- **`/admin/knowledge-graph`** — review summary; rebuild if entities stale (`POST /api/executive/knowledge-graph`)

---

## Quarterly workflow

**Time:** ~2–4 hours, start of each quarter

### 1. Generate quarterly review

- Open **`/admin/quarterly-review`**
- Generate review for current quarter (one per quarter/year)
- API: `POST /api/executive/quarterly-review`
- List: `GET /api/executive/quarterly-review`

### 2. Generate strategy adjustments

- Open **`/admin/strategy-adjustments`**
- Generate from quarterly review output (`POST`)
- Review each proposal; approve/reject via UI
- Apply approved adjustments explicitly via apply flow

### 3. Update goals and initiatives

- **`/admin/goals`** — generate or sync quarterly goals
  - `POST /api/executive/goals/generate`
  - `POST /api/executive/goals/sync`
- **`/admin/execution`** — review initiative pipeline; generate if needed
- **`/admin/scenarios`** — convert key simulations to strategy scenarios; implement only when approved

### 4. Quarterly boardroom and planning

- Run quarterly boardroom session (`sessionType: "quarterly"`)
- Run quarterly planning cycle at **`/admin/planning-cycles`**

### 5. Return to runtime

- End quarterly cycle at **`/admin/runtime`** — confirm executive status and next actions reflect updated strategy

---

## Safety reminders

| Rule | Detail |
|------|--------|
| No auto-publish | Articles/newsletters require explicit approve/publish |
| No auto-email | Resend routes require explicit send + `RESEND_API_KEY` |
| No auto-delete | Executive APIs do not delete records |
| Legacy runtime | `/admin/sovereign-runtime` execute requires explicit button click |
| Strategy apply | Adjustments and scenarios require approved status + apply POST |

---

## Related documentation

- [`PRODUCTION_LAUNCH_RUNBOOK.md`](PRODUCTION_LAUNCH_RUNBOOK.md) — deploy and verify
- [`V1_SYSTEM_AUDIT.md`](V1_SYSTEM_AUDIT.md) — system map and legacy routes
- [`SMOKE_TESTING.md`](SMOKE_TESTING.md) — automated verification
- [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md) — environment variables
