# EV-KOS Enterprise Alpha Limitations

Enterprise Alpha is intentionally limited. These limitations preserve the V1 RC
governance posture and prevent accidental enterprise execution.

## Intentional Limitations

- No execution.
- No publishing.
- No social posting.
- No authentication provider integration.
- No sessions.
- No JWT.
- No Prisma schema changes.
- No migrations.
- No database writes.
- No graph writes.
- No OpenAI calls.
- No persistence.
- No telemetry backend.
- No provider installation.
- No merge to `main`.

## Enterprise Beta Blockers

Enterprise Beta requires explicit approval for:

- Canonical auth provider selection.
- Tenant-aware session strategy.
- Runtime role and permission enforcement.
- Route guard enforcement.
- Rate limiting enforcement.
- Persisted audit evidence.
- Policy enforcement and exception handling.
- CI and deployment gate integration.
- Live negative tests against legacy execution and publishing surfaces.

## Non-Goals

Enterprise Alpha does not attempt to implement production enterprise identity,
customer tenant onboarding, billing integration, external connectors, enterprise
admin execution controls, graph ingestion automation, or publishing workflows.
