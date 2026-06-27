# EV-KOS Enterprise Beta Tenant Claims

Tenant claims define the minimum identity context required before any enterprise
runtime action can be considered.

## Required Claims

- `actorId`
- `organizationId`
- `workspaceIds`
- `role`
- `approvalScopes`

## Claim Sources

Claims may come from the future identity provider, membership store, and policy
engine. EB-1 does not assert or validate these claims at runtime.

## Boundary Rule

Every future enterprise route must be able to answer:

- Who is the actor?
- Which organization is scoped?
- Which workspace is scoped?
- Which role and permissions apply?
- Which approval scopes are available?
- Which audit record will explain the decision?
