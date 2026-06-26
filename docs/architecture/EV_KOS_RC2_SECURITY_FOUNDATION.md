# EV-KOS RC-2 Security Foundation

## Purpose

RC-2 defines the production security foundation for EV-KOS without changing runtime business behavior. It introduces canonical operator authentication interfaces, role and permission contracts, rate-limit policy definitions, and report-only startup validation.

## Non-Goals

- No authentication provider integration.
- No NextAuth, Clerk, Auth0, Supabase Auth, sessions, or JWT implementation.
- No execution controls.
- No OpenAI calls.
- No publishing or social posting.
- No graph writes or graph deletes.
- No governance weakening.

## Audited Route Families

- `/api/ev-kos/operator-dashboard`
- `/api/ev-kos/operator-actions`
- `/api/ev-kos/operator-actions/preview`
- `/api/ev-kos/operator-intent`
- `/api/content/*`
- `/api/research/*`
- `/api/ontology/*`
- `/api/production/*`

## Operator Roles

RC-2 defines six roles:

- Viewer
- Reviewer
- Operator
- Publisher
- Administrator
- System

Each role has explicit permissions, allowed route families, approval capabilities, write capabilities, and a risk level. Write capabilities remain limited to pending intent packages, pending review packages, or future explicit test-write requests. No role receives automatic execution.

## Operator Auth Contract

The canonical auth interface is defined in `lib/security/operator-auth.ts`:

- `validateOperator()`
- `requireRole()`
- `requirePermission()`
- `isOperatorAuthorized()`

These functions are contracts only. They do not read sessions, parse JWTs, call providers, or enforce route access in RC-2.

## Rate-Limit Policies

RC-2 defines policies for:

- Preview routes
- Operator intent
- Review package creation
- Research missions
- Content orchestration
- Ontology readiness
- Graph transaction explicit test writes
- Future execution routes

Policies include recommended limits, burst limits, escalation thresholds, risk classification, and an explicit `defined-not-enforced` status.

## Startup Validation

Startup validation defines required environment checks for:

- `DATABASE_URL`
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_BASE_URL`

Optional future checks include auth, AI, and monitoring secrets. RC-2 reports readiness only and does not block boot.

## Readiness Route

`/api/security/operator-readiness` returns:

- Security readiness score
- Operator auth status
- Authorization status
- Rate-limit status
- Startup validation status
- Release blockers
- Recommended actions

The route is GET-only, read-only, and does not access the database.

## RC-3 Recommendation

RC-3 should add enforcement planning and tests for route guards, including auth provider selection, role binding, rate-limit middleware design, and startup validation boot-gate approval. Execution controls should remain blocked.
