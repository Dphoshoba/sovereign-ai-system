# Production Smoke Tests — Sovereign AI System V1

**Last updated:** 2026-06-03  
**Phase:** 16.2 — Deployment Readiness

Run these checks after every production deploy. All tests are read-only unless noted.

Replace `YOUR_DOMAIN` with your production origin (e.g. `https://app.echoesandvisions.com`).

---

## Critical health APIs

### 1. Platform health

```bash
curl -s https://YOUR_DOMAIN/api/health
```

**Pass criteria:**

```json
{
  "ok": true,
  "version": "v1",
  "database": "connected",
  "buildTime": "<ISO timestamp>",
  "environment": "production",
  "env": { "ok": true, "missing": [], "errors": [] }
}
```

- HTTP status **200**
- `database` must be `"connected"`
- `env.ok` must be `true` in production

---

### 2. Executive subsystem health

```bash
curl -s https://YOUR_DOMAIN/api/executive/health
```

**Pass criteria:**

- HTTP status **200**
- Top-level `ok: true`
- Each module reports `ok: true`:
  - `runtime`
  - `commandCenter`
  - `boardroom`
  - `forecast`
  - `planning`
  - `knowledgeGraph`

Example module shape:

```json
{
  "ok": true,
  "latencyMs": 120,
  "executiveStatus": "Good",
  "runtimeHealth": 85
}
```

---

### 3. Executive runtime API

```bash
curl -s https://YOUR_DOMAIN/api/executive/runtime
```

**Pass criteria:**

- HTTP status **200**
- `ok: true`
- `runtime` object with `executiveStatus`, `runtimeHealth`, `systems`, `priorities`

---

## Critical admin pages

Open in browser while authenticated (Supabase login).

| URL | Pass criteria |
|-----|---------------|
| `/admin/runtime` | Page loads; executive status and systems grid visible; no error banner |
| `/admin/command-center` | Page loads; metrics and strategy sections visible; link to Runtime works |
| `/admin/boardroom` | Page loads; session list or empty state visible |
| `/admin/operations` | Page loads; quick actions include V1 Runtime, Command Center, Revenue, Delivery |

---

## Secondary checks (recommended)

| URL / API | Pass criteria |
|-----------|---------------|
| `/api/health/db` | `ok: true`, `database: "connected"` |
| `/api/executive/command-center` | `ok: true`, `center` object |
| `/admin/strategy-adjustments` | Page loads without 500 |
| `/admin/knowledge-graph` | Page loads; summary or build action visible |
| `/login` | Supabase login form renders |

---

## Failure triage

| Symptom | Likely cause | Action |
|---------|--------------|--------|
| `/api/health` → 503, `database: "disconnected"` | Bad `DATABASE_URL`, DB down, network | Verify connection string; check Postgres |
| `/api/health` → 503, `env.errors` populated | Missing required env vars | See `docs/ENVIRONMENT_SETUP.md` |
| `/api/executive/health` → 503, one module `ok: false` | DB query failure or missing executive tables | Check migrations; read module `error` field |
| Admin pages redirect to login | Supabase misconfiguration | Verify `NEXT_PUBLIC_SUPABASE_*` vars |
| `/api/executive/runtime` slow (>10s) | Cold start + heavy aggregation | Acceptable on first request; monitor latency |

---

## Automated curl script

```bash
DOMAIN="https://YOUR_DOMAIN"

echo "== Platform health =="
curl -sf "$DOMAIN/api/health" | jq '.ok, .database, .version'

echo "== Executive health =="
curl -sf "$DOMAIN/api/executive/health" | jq '.ok, .runtime.ok, .commandCenter.ok'

echo "== Runtime API =="
curl -sf "$DOMAIN/api/executive/runtime" | jq '.ok, .runtime.executiveStatus'
```

All commands should exit 0 and print `true` for `ok` fields.

---

## Safety reminder

These smoke tests are **read-only**. They do not:

- Send email
- Publish content
- Delete records
- Execute legacy sovereign-runtime actions

Do not POST to `/api/sovereign-runtime/execute` or strategy apply endpoints during routine smoke testing.

---

## Related docs

- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)
- [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md)
- [`V1_SYSTEM_AUDIT.md`](V1_SYSTEM_AUDIT.md)
