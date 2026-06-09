# Production Launch Runbook — Sovereign AI System V1

**Last updated:** 2026-06-03  
**Phase:** 17.1 — Production Launch Preparation  
**Audience:** Operator / deploy engineer

This runbook is the single path from “ready to ship” to “live and verified” for Sovereign V1.

---

## 1. Pre-deploy checklist

- [ ] Production domain and TLS certificate ready
- [ ] PostgreSQL provisioned with backups enabled
- [ ] Supabase project configured for production auth
- [ ] All **required** env vars set on host (see §2)
- [ ] Optional integrations decided (OpenAI, Resend, Stripe)
- [ ] Latest `main` branch checked out
- [ ] Staging smoke test passed (`npm run smoke:v1` against staging URL)
- [ ] Rollback target commit identified (previous production deploy)
- [ ] Operator has login credentials for `/login`

**Related docs:**

- [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md)
- [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)
- [`PRODUCTION_SMOKE_TESTS.md`](PRODUCTION_SMOKE_TESTS.md)
- [`V1_OPERATING_MANUAL.md`](V1_OPERATING_MANUAL.md)

---

## 2. Environment variables

Set on your hosting platform (Vercel, Railway, VPS, etc.). Never commit secrets to git.

### Required (V1 launch minimum)

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=https://sovereign-ai-executive.vercel.app
```

### Optional (enable when needed)

```env
OPENAI_API_KEY=sk-...                  # AI articles, agents, legacy sovereign runtime
RESEND_API_KEY=re_...                  # Email / newsletters
EMAIL_FROM="Echoes & Visions <hello@your-domain.com>"
NEWSLETTER_FROM="Newsletter <news@your-domain.com>"
STRIPE_SECRET_KEY=sk_live_...          # Billing / payments
STRIPE_PUBLISHABLE_KEY=pk_live_...     # Client checkout (when enabled)
```

**Validate before deploy:**

```bash
# After deploy, from any machine:
curl -s https://sovereign-ai-executive.vercel.app/api/health
```

Expect: `ok: true`, `database: "connected"`, `env.ok: true`, `version: "v1"`.

---

## 3. Database migration / sync

On the deploy host (or CI step before start):

```bash
npm ci
npx prisma migrate deploy
```

**Notes:**

- `npm run build` runs `prisma generate` automatically.
- Do **not** run `prisma db push` in production unless explicitly instructed.
- Seed only if intentional: `npx prisma db seed`
- Confirm executive tables exist (boardroom sessions, planning cycles, knowledge graph, quarterly reviews).

**Verify DB from app:**

```bash
curl -s https://sovereign-ai-executive.vercel.app/api/health/db
```

---

## 4. Build

```bash
npm ci
npm run build
```

**Expected:**

- Exit code `0`
- TypeScript check passes
- ~539 static pages generated
- No compile errors

**Local pre-flight (recommended):**

```bash
npm run build
npm start
# separate terminal:
BASE_URL=http://localhost:3000 npm run smoke:v1
```

---

## 5. Deploy

Replace placeholders with your platform commands.

### Generic Node.js host

```bash
npm ci
npx prisma migrate deploy
npm run build
npm start
# listens on PORT (default 3000)
```

### Vercel (placeholder)

```bash
# Set env vars in Vercel project settings
# Connect GitHub repo → deploy main branch
# Build command: npm run build
# Install command: npm ci
# Add post-deploy or manual step for migrations:
npx prisma migrate deploy
```

### Docker / VPS (placeholder)

```bash
git pull origin main
npm ci
npx prisma migrate deploy
npm run build
pm2 restart sovereign-v1   # or systemd service
```

---

## 6. Post-deploy health checks

Run immediately after deploy:

```bash
DOMAIN=https://sovereign-ai-executive.vercel.app

curl -sf "$DOMAIN/api/health" | jq '.ok, .database, .version, .env.ok'
curl -sf "$DOMAIN/api/executive/health" | jq '.ok, .runtime.ok, .commandCenter.ok'
curl -sf "$DOMAIN/api/executive/runtime" | jq '.ok, .runtime.executiveStatus'
```

**Browser checks (authenticated):**

| URL | Pass criteria |
|-----|---------------|
| `/login` | Supabase login renders |
| `/admin/runtime` | V1 Primary runtime loads |
| `/admin/command-center` | Command center loads |
| `/admin/operations` | V1 Executive Entry Points visible |

**Failure triage:**

| Symptom | Action |
|---------|--------|
| `/api/health` → 503 | Check `DATABASE_URL`, Postgres reachability |
| `env.ok: false` | Set missing Supabase or `NEXT_PUBLIC_APP_URL` vars |
| `/api/executive/health` → 503 | Check migrations; read module `error` fields |
| Admin 500 | Check server logs; verify Prisma client generated |

---

## 7. Smoke test command

Automated read-only GET checks (22 routes):

```bash
BASE_URL=https://sovereign-ai-executive.vercel.app npm run smoke:v1
```

**Pass:** exit code `0`, all routes `PASS`, HTTP 200–399.

**Requires:** application server running and reachable at `BASE_URL`.

See [`SMOKE_TESTING.md`](SMOKE_TESTING.md) for full route list and failure interpretation.

---

## 8. Rollback notes

1. **Application rollback:** Redeploy previous known-good commit or container image.
2. **Database:** Migrations are forward-only. Do not roll back schema without a tested plan.
3. **Env vars:** If launch fails due to env, fix vars and redeploy — no code rollback needed.
4. **Health gate:** If `/api/health` returns 503 after deploy, treat as failed launch; rollback or hotfix immediately.
5. **Smoke gate:** If `npm run smoke:v1` fails on production, investigate before announcing launch.

**Previous commit reference:** note the SHA before each production deploy in your change log.

---

## 9. First 30-day operating plan

### Week 1 — Stabilize

| Day | Action |
|-----|--------|
| 1 | Launch deploy + full smoke test; verify login and V1 runtime |
| 2–3 | Daily: check `/admin/runtime`, `/admin/command-center`, `/api/health` |
| 4 | Run first boardroom session (`/admin/boardroom` → POST session) |
| 5 | Review `/admin/daily-briefing`; confirm no unexpected 500s in logs |
| 6–7 | Review revenue (`/admin/revenue`) and delivery (`/admin/delivery`) |

### Week 2 — Weekly rhythm

- Archive daily briefings (`/api/executive/daily-briefing/archive`)
- Generate weekly review (`/admin/weekly-review`)
- Run planning cycle (`/admin/planning-cycles`)
- Review goals and initiative performance

### Week 3 — Monthly cadence

- Generate monthly review (`/admin/monthly-review`)
- Review simulations (`/admin/simulations`) and scenarios (`/admin/scenarios`)
- Review strategy adjustments (`/admin/strategy-adjustments`) — apply only with explicit approval

### Week 4 — Quarterly readiness

- Generate or review quarterly review (`/admin/quarterly-review`)
- Generate strategy adjustments if quarterly review recommends
- Sync goals (`/admin/goals`); review execution engine

### Ongoing (daily operator habit)

- Start at **`/admin/runtime`** → **`/admin/command-center`**
- Use **`/admin/operations`** as hub; avoid legacy consoles unless intentional
- Run **`BASE_URL=https://sovereign-ai-executive.vercel.app npm run smoke:v1`** after each deploy

Full workflow detail: [`V1_OPERATING_MANUAL.md`](V1_OPERATING_MANUAL.md)

---

## Quick reference

| Step | Command / URL |
|------|----------------|
| Migrate | `npx prisma migrate deploy` |
| Build | `npm run build` |
| Start | `npm start` |
| Health | `GET /api/health` |
| Executive health | `GET /api/executive/health` |
| Smoke | `BASE_URL=https://sovereign-ai-executive.vercel.app npm run smoke:v1` |
| V1 entry | `/admin/runtime`, `/admin/command-center`, `/admin/operations` |
