# EV-KOS Enterprise Beta Provider Selection (EB-6)

EB-6 is report-only and defines provider decision checkpoints without integrating
authentication providers into runtime.

## Candidate Comparison Scope

- Auth0
- Clerk
- Supabase Auth
- Custom OIDC

## Decision Criteria

- Tenant and workspace boundary support.
- Claim mapping quality for enterprise authorization.
- Operational complexity for phased rollout.
- Enterprise fit score alignment.

## Constraints

- No provider installation in EB-6.
- No auth integration in EB-6.
- No sessions or JWT issuance in EB-6.
- No middleware changes in EB-6.

## Output

EB-6 emits a report-only provider score and recommends installation planning in
EB-7.
