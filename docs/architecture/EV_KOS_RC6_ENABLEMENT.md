# EV-KOS RC-6 Production Enablement Planning

## Purpose

RC-6 designs the production enablement path for EV-KOS without enabling production behavior. It evaluates authentication providers, authorization enforcement, rate limiting, telemetry, startup enforcement, and implementation order.

## Hard Boundary

RC-6 does not install providers, integrate authentication, create sessions, implement JWTs, enable execution, publish content, call OpenAI, write or delete graph data, change schema, or create migrations.

## Auth Provider Evaluation

Options evaluated:

- Clerk
- Auth.js / NextAuth
- Supabase Auth
- Custom session approach

Recommendation: start with Clerk for the first production operator identity layer, while keeping EV-KOS authorization provider-neutral.

## Authorization Enforcement

Recommended order:

1. Operator identity adapter.
2. Role guard.
3. Permission guard.
4. Approval handoff guard.

All enforcement remains disabled in RC-6.

## Rate Limiting

Options evaluated:

- Middleware
- Redis
- Upstash
- Vercel Edge
- In-memory dev fallback

Recommendation: middleware plus Upstash-backed counters for production, with in-memory fallback only for local development.

## Telemetry

Options evaluated:

- OpenTelemetry
- Sentry
- PostHog
- Vercel Analytics
- Structured logs

Recommendation: Sentry plus structured logs first, followed by OpenTelemetry after route guards are enforced.

## Startup Enforcement

Required environment checks:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_URL`

Startup gate remains report-only until a later approved RC.

## RC-7 Recommendation

RC-7 should implement report-only guard prototypes and automated non-mutating tests. It should still avoid execution, provider integration, sessions, JWTs, publishing, graph writes, and OpenAI calls.
