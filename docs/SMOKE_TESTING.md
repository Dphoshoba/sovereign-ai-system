# Automated Smoke Tests — Sovereign AI System V1

**Last updated:** 2026-06-03  
**Phase:** 16.3 — Automated Smoke Tests

Repeatable deployment verification for critical V1 routes. The script performs **read-only GET requests** and reports pass/fail by HTTP status code.

---

## Prerequisites

The application server must be running. Smoke tests hit live HTTP endpoints — they do not start the server for you.

**Local:**

```bash
npm run dev
# or after production build:
npm run build && npm start
```

**Database:** Executive API routes require a connected database. `/api/health` will report `database: "disconnected"` if Postgres is unavailable.

---

## Usage

### Local (default)

```bash
npm run dev
# in another terminal:
npm run smoke:v1
```

Uses `http://localhost:3000` when `BASE_URL` is not set.

### Production / staging

```bash
BASE_URL=https://your-domain.com npm run smoke:v1
```

On Windows PowerShell:

```powershell
$env:BASE_URL="https://your-domain.com"; npm run smoke:v1
```

---

## What is tested

| Group | Routes |
|-------|--------|
| **Public / system** | `/api/health` |
| **Executive APIs** | `/api/executive/health`, `runtime`, `command-center`, `boardroom`, `forecast`, `strategic-plan`, `goals`, `knowledge-graph`, `simulations`, `scenarios` |
| **Admin pages** | `/admin/runtime`, `command-center`, `operations`, `boardroom`, `strategic-plan`, `goals`, `knowledge-graph`, `simulations`, `scenarios`, `revenue`, `delivery` |

**Pass criteria:** HTTP status **200–399** (includes redirects, e.g. admin login).

**Exit code:** `0` if all pass, `1` if any fail.

---

## Sample output

```
Sovereign V1 smoke test — http://localhost:3000

RESULT  CODE    GROUP       ROUTE                                     LATENCY     NOTES
------------------------------------------------------------------------------------------
PASS    200     public      /api/health                               45ms
PASS    200     executive   /api/executive/runtime                    380ms
PASS    200     admin       /admin/runtime                            120ms
...

Summary: 22 passed, 0 failed, 22 total
```

---

## Reading failures

| Symptom | Likely cause |
|---------|--------------|
| `CODE —` + connection error | Server not running; wrong `BASE_URL` |
| `500` on executive APIs | Database down, missing migrations, or runtime error |
| `503` on `/api/health` | Database disconnected or missing required env vars |
| `503` on `/api/executive/health` | One or more executive subsystems failed (check server logs) |
| Admin pages `FAIL` with 404 | Route missing or build not deployed |
| Slow executive routes (>5s) | Cold start or heavy DB aggregation — not a failure unless timeout |

Check server logs and [`docs/PRODUCTION_SMOKE_TESTS.md`](PRODUCTION_SMOKE_TESTS.md) for manual triage steps.

---

## When to run

- **Before deployment** — after `npm run build`, against staging with production-like env
- **After deployment** — against production `BASE_URL`
- **After database migrations** — confirm executive APIs still respond
- **In CI** — start app + DB, then `npm run smoke:v1` (optional future step)

---

## Script location

`scripts/smoke-test-sovereign-v1.ts`

**npm script:** `smoke:v1`

---

## Related docs

- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)
- [`PRODUCTION_SMOKE_TESTS.md`](PRODUCTION_SMOKE_TESTS.md)
- [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md)
