# EV-KOS Enterprise Alpha EA-1 Foundations

## Status

Status: Planning and contracts only

Branch: `codex/enterprise-alpha`

EA-1 establishes the Enterprise Alpha foundation without adding execution, publishing, authentication integration, Prisma migrations, schema changes, OpenAI calls, or graph writes.

## Mission

Enterprise Alpha prepares EV-KOS for enterprise operation by defining tenant boundaries, data boundaries, governance gates, blocked capabilities, and readiness reporting. It does not make the platform executable.

## Added Contracts

- `lib/enterprise/tenant-boundary.ts`
- `lib/enterprise/enterprise-governance-contract.ts`
- `lib/enterprise/enterprise-foundation.ts`
- `lib/enterprise/enterprise-readiness.ts`

## Added Readiness Route

- `/api/enterprise-alpha/readiness`

The route is GET-only and read-only. It does not import Prisma, call OpenAI, publish, execute actions, create sessions, create JWTs, write graph data, or modify source data.

## Enterprise Layers

EA-1 defines these enterprise layers:

- Tenant boundary.
- Operator identity contract.
- Role and permission contract.
- Governance gate contract.
- Data boundary contract.
- Readiness and risk reporting.
- Future enterprise rollout plan.

## Tenant Boundary

Future enterprise actions must carry:

- `organizationId`
- `workspaceId`
- `actorId`

The current status is `contract-defined-not-enforced`. EA-1 does not add route guards or provider-backed identity.

## Data Boundaries

EA-1 classifies the major EV-KOS enterprise data areas:

- Research evidence: confidential, tenant scoped.
- Semantic graph: restricted, tenant scoped.
- Operator intent: restricted, tenant scoped.
- Campaign previews: confidential, tenant scoped.
- Release readiness: internal, not tenant scoped.

Retention policies are marked as contract-required where needed, but no persistence behavior is changed.

## Governance Gates

EA-1 records these required gates for future enterprise operations:

- Tenant scope.
- Operator authentication.
- Operator authorization.
- Review required.
- Approval required.
- Audit required.
- Rate limit required.
- Execution disabled.

## Blocked Capabilities

These capabilities remain blocked:

- Operator action execution.
- Automatic publishing.
- Automatic graph ingestion.
- OpenAI draft generation.
- Auth sessions and JWTs.

## Legacy Enterprise Governance Risk

The existing `/api/enterprise-governance` and `/api/enterprise-governance/decision` routes contain Prisma-backed write behavior. EA-1 intentionally does not reuse or modify those routes. They should be audited separately before being included in any enterprise production path.

## Readiness Position

| Metric | Value |
| --- | --- |
| Enterprise readiness score | `68` |
| Production confidence | `58` |
| Execution readiness | `BLOCKED` |
| Candidate status | `READY_FOR_EA2_PLANNING` |

## Critical Blockers

- Enterprise auth provider is not integrated.
- Tenant and workspace route guards are not enforced.
- Legacy enterprise-governance write routes need a separate audit before reuse.
- Rate limits are not enforced.
- Enterprise audit persistence taxonomy is not approved.
- Graph, publishing, OpenAI, and operator execution remain intentionally blocked.

## Recommended EA-2

EA-2 should remain non-executing and should audit tenant isolation, legacy enterprise governance routes, organization/workspace model usage, and route guard coverage. It should not add execution, publishing, OpenAI calls, graph writes, auth providers, sessions, JWTs, schema changes, or migrations.

