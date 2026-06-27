# EV-KOS Enterprise Beta Session Contract

EB-1 defines session requirements without creating sessions or issuing JWTs.

## Required Session Capabilities

- Tenant-scoped session.
- Workspace-scoped access.
- Risk and approval state.
- Operator identity reference.
- Permission context.

## Non-Goals

- No session storage.
- No cookies.
- No JWT issuance.
- No middleware.
- No auth provider integration.
- No runtime authorization.

## Beta Requirement

Sessions must remain blocked until the provider, tenant claims, route guards,
rate limits, and audit persistence strategy are approved.
