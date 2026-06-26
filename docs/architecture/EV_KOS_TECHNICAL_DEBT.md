# EV-KOS Technical Debt Register

## Purpose

This document tracks known EV-KOS technical debt after the Phase 4E review
decision pipeline and Phase 4F readiness foundation.

## Priority Scale

- `P0` - blocks safe production graph ingestion
- `P1` - important before broad autonomous workflows
- `P2` - should be addressed before scale
- `P3` - future polish or expansion

## Architecture Debt

| Priority | Debt | Impact | Recommended Action |
| --- | --- | --- | --- |
| P0 | Review package approval does not yet hand off to a guarded graph execution request. | Human approval exists, but approved packages cannot safely become write candidates without more orchestration. | Build a read-only approved-package handoff plan before enabling broader writes. |
| P0 | Duplicate-safe upsert semantics are not fully persisted. | Entity resolution can classify duplicates, but persistence still needs durable idempotency rules. | Define unique fingerprints and upsert policy without schema churn unless approved. |
| P0 | `ExecutionAuthorizationRequest` has no first-class tenant columns. | `organizationId` and `workspaceId` are carried in JSON payload for graph review packages. | Decide whether to keep payload-based scope or add schema fields in a later approved migration. |
| P1 | Multiple governance surfaces create authorization requests with different conventions. | Review and operational approval packages may diverge in naming, payload, and audit shape. | Standardize authorization request metadata conventions. |
| P1 | Graph write executor still has controlled-test-write semantics. | Good for safety, but not enough for broad ingestion. | Introduce a separate approved-production-write mode only after Phase 4E and 4F gates are fully verified. |

## Duplicate Systems

| Priority | Area | Debt | Recommendation |
| --- | --- | --- | --- |
| P1 | Knowledge graph APIs | Several graph and memory routes expose overlapping graph concepts. | Keep the tenant semantic graph canonical and map downstream routes to it gradually. |
| P1 | Approval models | `AiApprovalRequest`, `GovernanceApproval`, and `ExecutionAuthorizationRequest` overlap. | Use `ExecutionAuthorizationRequest` for ingestion execution packages, document exceptions. |
| P2 | Agent memory systems | Executive memory, semantic memory, and graph memory have overlapping concepts. | Inventory producers and consumers before merging behaviors. |

## Future Migrations

| Priority | Migration | Notes |
| --- | --- | --- |
| P0 | Review package tenant columns or indexed payload policy | Needed if querying approval packages by tenant becomes slow or ambiguous. |
| P1 | Entity fingerprint persistence | Needed for durable duplicate-safe upserts. |
| P1 | Review decision persistence | Needed when decisions become first-class records separate from authorization request status. |
| P2 | Real embeddings | Placeholder embedding support should be replaced by provider-backed embeddings and vector search. |

## Performance

| Priority | Debt | Risk |
| --- | --- | --- |
| P1 | Static generation still touches many dynamic routes during build. | Build time and route warnings may grow with new APIs. |
| P1 | Graph query APIs may need pagination and selective projections. | Broad graph reads can become expensive. |
| P2 | Entity resolution currently uses deterministic local scoring. | Works for safe foundation, but may miss semantic duplicates at scale. |

## Security

| Priority | Debt | Risk |
| --- | --- | --- |
| P0 | Operator identity is passed by request fields in preview/test routes. | Production paths need authenticated actor context. |
| P0 | Approval packages do not yet verify actor authority in the graph-specific route. | Package creation is guarded by explicit fields, but real operator authorization needs to be enforced. |
| P1 | Route-level write boundaries need centralized policy checks. | Future contributors may copy write patterns without the right gates. |

## Governance

| Priority | Debt | Risk |
| --- | --- | --- |
| P0 | Approval does not equal execution, but this must remain obvious in UI and API design. | Operators could assume approved packages execute automatically. |
| P0 | `APPROVE_MERGE` is preparation-only. | Merge behavior could be misinterpreted before merge semantics exist. |
| P1 | Audit persistence for review decisions is not implemented. | Decision preparation is inspectable but not yet durable as its own audit event. |

## Known Risks

| Priority | Risk | Mitigation |
| --- | --- | --- |
| P0 | Broad graph ingestion enabled too early. | Keep `explicit-test-write` and dry-run defaults until approved Phase 4F/5 boundary. |
| P0 | Duplicate graph nodes accumulate. | Require entity resolution and review package checks before any broader write path. |
| P1 | Review package duplication. | Add idempotency keys or lookup-before-create in a later approved slice. |
| P1 | Schema assumptions drift. | Keep Prisma write mapping docs current before each persistence slice. |

## Current Safety Posture

The system is intentionally conservative:

- graph writes are not automatic
- approvals are not automatic
- publishing is not automatic
- readiness is advisory and read-only
- guarded transaction execution remains separately gated

## Next Debt to Retire

Before true autonomous graph ingestion:

1. Persist review decisions or define a safe mapping onto existing approval
   status fields.
2. Add idempotency for review packages.
3. Define duplicate-safe upsert persistence.
4. Add tenant-aware authorization checks for package creation and decisions.
5. Keep graph execution separated from approval until the full audit loop is
   tested.
