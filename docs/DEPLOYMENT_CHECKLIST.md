# Deployment Checklist — Sovereign AI System V1

**Last updated:** 2026-06-03  
**Phase:** 16.2 — Deployment Readiness

Use this checklist before every production deploy.

---

## 1. Environment variables

- [ ] `DATABASE_URL` set and reachable from deploy environment
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `NEXT_PUBLIC_APP_URL` set to production HTTPS origin
- [ ] Optional integrations configured as needed (OpenAI, Resend, Stripe, Google, Twitter)
- [ ] Secrets stored in platform secret manager (not in repo)
- [ ] Review [`docs/ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md)

**Validate:**

```bash
curl https://sovereign-ai-executive.vercel.app/api/health
```

Expect `ok: true`, `database: "connected"`, `env.ok: true`.

---

## 2. Prisma

- [ ] `npx prisma generate` succeeds (included in `npm run build`)
- [ ] `npx prisma migrate deploy` applied against production database
- [ ] No pending migrations that would break executive tables
- [ ] Seed data applied only if intentional (`npx prisma db seed`)

---

## 3. Database

- [ ] PostgreSQL instance running and backed up
- [ ] Connection pool limits appropriate for host
- [ ] `GET /api/health/db` returns `database: "connected"` (legacy DB probe)
- [ ] `GET /api/health` returns `database: "connected"`

---

## 4. Build

- [ ] `npm install` completes without errors
- [ ] `npm run build` completes with exit code 0
- [ ] TypeScript check passes
- [ ] Static generation completes (~537 pages)
- [ ] `BUILD_TIME` stamped in health response after deploy

```bash
npm run build
npm start
```

---

## 5. Health endpoints

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /api/health` | Platform health | `ok: true`, `version: "v1"`, DB connected |
| `GET /api/health/db` | Legacy DB probe | `ok: true`, article count |
| `GET /api/executive/health` | V1 executive subsystems | All modules `ok: true` |
| `GET /api/executive/runtime` | Runtime payload | `ok: true`, `runtime` object |

**Executive health modules:**

- `runtime` — sovereign runtime orchestration
- `commandCenter` — executive command center
- `boardroom` — boardroom context + session count
- `forecast` — forecast engine
- `planning` — planning cycle builder
- `knowledgeGraph` — knowledge graph summary

---

## 6. Smoke tests

Run manual checks from [`docs/PRODUCTION_SMOKE_TESTS.md`](PRODUCTION_SMOKE_TESTS.md):

- [ ] `/admin/runtime` loads
- [ ] `/admin/command-center` loads
- [ ] `/admin/boardroom` loads
- [ ] `/admin/operations` loads
- [ ] `/api/health` returns 200
- [ ] `/api/executive/runtime` returns 200

---

## 7. Post-deploy verification

- [ ] Login via `/login` works (Supabase)
- [ ] Admin shell navigation readable (light/dark theme)
- [ ] No unexpected 500s in server logs
- [ ] Legacy routes labeled (sovereign-runtime, command-center-v2) — see [`docs/V1_SYSTEM_AUDIT.md`](V1_SYSTEM_AUDIT.md)

---

## 8. Rollback plan

- [ ] Previous deployment image/commit identified
- [ ] Database migrations are forward-only; test rollback on staging first
- [ ] Health endpoint monitored after deploy (503 = investigate immediately)

---

## Quick deploy sequence

```bash
# 1. Set env vars on host
# 2. Install and migrate
npm ci
npx prisma migrate deploy

# 3. Build and start
npm run build
npm start

# 4. Smoke test
curl -s https://sovereign-ai-executive.vercel.app/api/health | jq
curl -s https://sovereign-ai-executive.vercel.app/api/executive/health | jq
```

---

## Related docs

- [`ENVIRONMENT_SETUP.md`](ENVIRONMENT_SETUP.md) — full env var reference
- [`PRODUCTION_SMOKE_TESTS.md`](PRODUCTION_SMOKE_TESTS.md) — URL checklist
- [`V1_SYSTEM_AUDIT.md`](V1_SYSTEM_AUDIT.md) — system audit and legacy routes
