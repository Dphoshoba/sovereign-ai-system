# EV-KOS Enterprise Beta Claims (EB-6)

EB-6 defines report-only claim readiness for future provider-backed sessions.

## Required Claim Set

- `organizationId`
- `workspaceId`
- `environment`
- `membershipRole`
- `entitlementTier`
- `actorId`

## Claim Rules

- Claims are mandatory for tenant-safe enterprise access.
- Claim validation remains planning-only in EB-6.
- Claim propagation to middleware/session runtime is deferred.

## Hard Constraints

- No JWT issuance.
- No provider claim wiring.
- No runtime authorization integration.
- No database writes or persistence activation.
