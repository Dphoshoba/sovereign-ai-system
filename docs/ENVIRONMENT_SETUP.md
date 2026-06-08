# Environment Setup — Sovereign AI System V1

**Last updated:** 2026-06-03  
**Phase:** 16.2 — Deployment Readiness

This document lists environment variables used by the application, grouped by concern. Variables marked **Required** must be set for production deployment. **Optional** variables enable specific integrations.

Programmatic validation lives in `src/lib/startup/validate-env.ts`.

---

## Quick start (local)

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/echoes_visions
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=sk-...
```

Then:

```bash
npx prisma migrate deploy
npm run dev
```

---

## Database

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | **Yes** | PostgreSQL connection string for Prisma. Used by all admin, executive, CRM, and content features. |

**Notes:**

- Run `npx prisma generate` before build (handled by `npm run build`).
- Use `npx prisma migrate deploy` in production after schema changes.
- Health check: `GET /api/health` probes database connectivity.

---

## Authentication

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Supabase anonymous key for client auth (`/login`, admin shell). |

**Notes:**

- Admin routes depend on Supabase session validation via `src/lib/supabase/server.ts`.
- Missing auth variables will block login; executive V1 APIs remain rule-based but still need DB access.

---

## Application

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_APP_URL` | **Yes (production)** | Canonical public URL (`https://your-domain.com`). Used for metadata, internal fetches, PDF links, and webhooks. |
| `NEXT_PUBLIC_BASE_URL` | Optional | Alternate base URL for some agent pipeline callbacks. |
| `NODE_ENV` | Auto | Set by Next.js (`development` / `production`). |
| `BUILD_TIME` | Auto | Injected at build via `next.config.ts`. Exposed in `/api/health`. |

---

## OpenAI

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Optional* | OpenAI API key for AI generation, agents, TTS, and legacy sovereign runtime. |

\* **Not required** for the V1 rule-based executive stack (`/admin/runtime`, `/api/executive/*`). Required for:

- Article and image generation (`/api/ai/generate-article`)
- Legacy `/api/sovereign-runtime` (OpenAI synthesis)
- Agent pipelines and billing runtime AI features

---

## Email

| Variable | Required | Description |
|----------|----------|-------------|
| `RESEND_API_KEY` | Optional | Resend API key for outbound email. |
| `EMAIL_FROM` | Optional | Default transactional from address (e.g. `Echoes & Visions <hello@domain.com>`). |
| `NEWSLETTER_FROM` | Optional | Newsletter-specific from address. |

**Notes:**

- Email sends require explicit API calls; nothing auto-sends on startup.
- Without `RESEND_API_KEY`, newsletter and email-execution routes return clear errors.

---

## Stripe

| Variable | Required | Description |
|----------|----------|-------------|
| `STRIPE_SECRET_KEY` | Optional | Stripe secret key for billing runtime and payment integrations. |

**Notes:**

- Referenced in `/api/external-operations` integration registry.
- Prisma billing models store Stripe IDs; payments are not active without configuration.

---

## External APIs

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_CLIENT_ID` | Optional | YouTube OAuth client ID. |
| `GOOGLE_CLIENT_SECRET` | Optional | YouTube OAuth client secret. |
| `GOOGLE_REDIRECT_URI` | Optional | OAuth redirect URI registered with Google. |
| `GOOGLE_CALENDAR_CLIENT_ID` | Optional | Calendar booking integration. |
| `TWITTER_API_KEY` | Optional | Twitter/X publishing. |
| `TWITTER_API_SECRET` | Optional | Twitter/X API secret. |
| `TWITTER_ACCESS_TOKEN` | Optional | Twitter/X access token. |
| `TWITTER_ACCESS_SECRET` | Optional | Twitter/X access token secret. |
| `BRAVE_SEARCH_API_KEY` | Optional | Brave Search for research pipeline. |
| `SEARCH_PROVIDER` | Optional | Research search provider (`none` default). |

---

## V1 executive stack minimum

For deployment of the **Sovereign V1 executive system** only:

```env
DATABASE_URL=...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://your-production-domain.com
```

OpenAI, email, Stripe, and social keys can be added later without redeploying executive logic.

---

## Validation

Import and call at startup or inspect via health endpoint:

```typescript
import { validateEnv, formatEnvValidationErrors } from "@/lib/startup/validate-env"

const result = validateEnv()
if (!result.ok) {
  console.error(formatEnvValidationErrors(result))
}
```

`GET /api/health` includes an `env` summary with `missing` and `errors` arrays.

---

## Security

- Never commit `.env` to git.
- Use platform secret managers (Vercel, Railway, etc.) for production.
- Rotate keys if exposed.
- Restrict database access to application IPs where possible.
