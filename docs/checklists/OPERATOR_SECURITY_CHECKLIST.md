# Operator Security Checklist

## Authentication

- [ ] Select a production authentication provider.
- [ ] Bind authenticated identities to EV-KOS operator identities.
- [ ] Require actor identity on every operator-adjacent POST route.
- [ ] Document session/JWT lifecycle before implementation.

## Authorization

- [ ] Map every operator action to required permissions.
- [ ] Bind roles to permissions.
- [ ] Confirm route families allowed for each role.
- [ ] Require organization and workspace scope before tenant-scoped writes.

## Rate Limiting

- [ ] Enforce preview route limits.
- [ ] Enforce operator intent package limits.
- [ ] Enforce review package creation limits.
- [ ] Enforce graph test-write request limits.
- [ ] Log escalation thresholds.

## Startup Validation

- [ ] Verify `DATABASE_URL`.
- [ ] Verify `NEXT_PUBLIC_APP_URL`.
- [ ] Verify `NEXT_PUBLIC_BASE_URL`.
- [ ] Add report-only monitoring checks.
- [ ] Approve boot enforcement in a later RC.

## Governance

- [ ] No operator action execution.
- [ ] No OpenAI calls from operator routes.
- [ ] No automatic publishing.
- [ ] No social posting.
- [ ] No automatic approvals.
- [ ] No graph writes outside explicit-test-write boundaries.
