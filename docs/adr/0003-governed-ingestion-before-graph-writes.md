# 0003 - Governed Ingestion Before Graph Writes

## Title

Require governed ingestion before any semantic graph write.

## Status

Accepted

## Context

Ontology outputs can create durable graph records, nodes, and edges. Bad graph writes can pollute memory, duplicate entities, weaken reasoning, and affect publishing or agent behavior. Phase 4A and Phase 4B added adapters, dry-run plans, governance decisions, and audit objects without database writes.

## Decision

Every future semantic graph write must pass through governed ingestion. Governed ingestion validates the dry-run plan, scores risk, checks duplicate risk and confidence, creates an audit object, and returns one of `ALLOW`, `ALLOW_WITH_WARNING`, `REQUIRES_REVIEW`, or `BLOCK`.

Phase 4C may add a transaction executor only after this contract is preserved.

## Consequences

- No direct ontology-to-Prisma write path is allowed.
- Dry-run remains the default posture for new graph execution.
- `BLOCK` decisions must not write.
- `REQUIRES_REVIEW` decisions require explicit approval before any future write.
- Auditing is part of the execution plan even before audit persistence exists.

## Alternatives considered

- Add direct Prisma writes from the adapter: rejected because it bypasses governance.
- Add a transaction executor before governance: rejected because risk decisions would be bolted on later.
- Rely only on TypeScript validation: rejected because graph quality risk includes confidence and duplicate concerns.

## Date

2026-06-26
