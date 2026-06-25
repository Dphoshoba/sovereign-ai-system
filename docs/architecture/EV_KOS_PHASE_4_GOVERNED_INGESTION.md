# EV-KOS Phase 4 Governed Ingestion Architecture

## Purpose

Phase 4B.5 defines the governance layer between ontology-derived graph payloads and any future Prisma write path. It does not write to the database. It creates the contract every future semantic graph write must pass through before Phase 4C can introduce a guarded transaction executor.

The current flow is:

```text
Ontology
↓
Semantic Graph Adapter
↓
Dry-run Ingestion Plan
↓
Governed Ingestion
↓
Prisma Transaction (future Phase 4C only)
```

## How Ontology Becomes Graph

The ontology layer extracts domain-neutral concepts:

- people
- places
- events
- processes
- objects
- themes
- applications
- relationships

The semantic graph adapter converts those concepts into write-ready payload shapes for:

- `SemanticKnowledgeRecord`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`

The dry-run ingestion layer resolves temporary node keys in memory and produces a non-executable write plan. Governed ingestion then validates that plan, scores graph quality risk, makes an approval decision, and creates an audit record.

## Governance Protection

Governed ingestion protects graph quality before any write path exists. Every request receives one decision:

- `ALLOW`
- `ALLOW_WITH_WARNING`
- `REQUIRES_REVIEW`
- `BLOCK`

The decision is based on:

- validation errors
- validation warnings
- duplicate risk
- ontology confidence
- relationship confidence
- overall risk score

The governed plan includes:

- `riskScore`
- `duplicateRisk`
- `ontologyConfidence`
- `relationshipConfidence`
- `approvalRequired`
- `warnings`
- `errors`

## Validation Contract

`validateGovernedIngestion()` checks that:

- the request contains a payload
- the request remains dry-run only
- the dry-run ingestion plan is structurally valid
- records, nodes, and edges have required fields
- temporary node references resolve in memory

This phase validates shape and risk. It does not validate truth, perform external fact checking, or query existing database records.

## Duplicate Protection

Duplicate protection is currently conservative and in-memory. It checks duplicate node names and duplicate semantic node keys within a single payload. High duplicate risk triggers review or block-level governance depending on the total risk score.

Future Phase 4C can extend this with database-backed entity resolution, but Phase 4B.5 intentionally does not access the database.

## Audit Records

`buildAuditRecord()` produces a non-persistent audit object for every governed plan. The audit object captures:

- request id
- requester
- source
- decision
- approval requirement
- risk score
- duplicate risk
- ontology confidence
- relationship confidence
- planned record/node/edge counts
- warnings
- errors
- `writesToPrisma: false`
- `databaseAccess: false`

Future persistence can store these audit records only after a separate schema and governance decision.

## Review-Required Decisions

`REQUIRES_REVIEW` is used when a plan is structurally valid but too risky for automatic write enablement. Common causes include:

- duplicate-risk signals
- moderate overall risk score
- ontology confidence below direct-allow threshold
- relationship confidence below direct-allow threshold

Review-required plans must not be written automatically in Phase 4C. A future executor should require explicit approval metadata before performing any database transaction.

## Future Transaction Flow

Phase 4C should add a guarded executor that accepts a governed plan and refuses to run unless:

- `dryRun` defaults to true
- the plan is valid
- the decision is not `BLOCK`
- review-required plans include explicit approval
- audit capture is active
- all database writes happen inside one transaction
- rollback behavior is documented

The future transaction should create or upsert in this order:

1. `SemanticKnowledgeRecord`
2. `KnowledgeGraphNode`
3. `KnowledgeGraphEdge`
4. future audit record, if a schema is approved

Phase 4B.5 implements none of that execution code.

## Hard Boundaries

This phase does not:

- import Prisma
- access the database
- change the Prisma schema
- add migrations
- rewrite graph routes
- change Phase 3 research behavior
- add transaction execution code
- merge automatically

## Rollback

Rollback is additive:

1. Remove the governed ingestion module.
2. Remove the governance and audit helpers.
3. Remove the read-only governed ingestion route.
4. Remove this architecture document.

No database rollback is required because this phase performs no database writes.
