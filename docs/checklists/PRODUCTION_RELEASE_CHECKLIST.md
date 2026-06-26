# Production Release Checklist

## Environment

- [ ] `DATABASE_URL` is configured for production.
- [ ] `NEXT_PUBLIC_APP_URL` is `https://sovereign-ai-executive.vercel.app`.
- [ ] `NEXT_PUBLIC_BASE_URL` is `https://sovereign-ai-executive.vercel.app`.
- [ ] Monitoring configuration is present.
- [ ] Startup validation blocks missing required production configuration.

## Platform

- [ ] `/api/health` passes.
- [ ] `/api/production/readiness` passes.
- [ ] `/api/production/security` passes.
- [ ] `/api/production/deployment` passes.
- [ ] Build passes.
- [ ] Smoke suite passes.

## Governance

- [ ] Operator authentication is active.
- [ ] Operator authorization is active.
- [ ] Operator intent is persisted before execution.
- [ ] Approval packages remain pending until human review.
- [ ] Graph writes remain gated.
- [ ] Publishing remains gated.
- [ ] Automatic approvals remain disabled.

## Release Decision

Do not release production execution controls until all blockers in `/api/production/readiness` are resolved.
