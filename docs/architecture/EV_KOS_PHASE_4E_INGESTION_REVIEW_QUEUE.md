# EV-KOS Phase 4E Ingestion Review Queue

Date: 2026-06-26

Status: Phase 4E Slice 1 design and read-only planning. No schema changes, migrations, writes, deletes, updates, upserts, or graph-route rewrites are introduced.

## Purpose

Phase 4D can classify semantic graph entities as `CREATE_NEW`, `MATCH_EXISTING`, `POSSIBLE_DUPLICATE`, or `BLOCK_CONFLICT`. Phase 4E begins the approval boundary that decides what to do with risky outcomes before broader ingestion is allowed.

This slice creates an in-memory review queue foundation and maps review items to an existing approval model shape. It does not persist review items yet.

## Existing Model Audit

### `AiApprovalRequest`

Fields:

- `action`
- `payload`
- `status`
- `reason`
- `result`
- timestamps

Assessment:

Useful for broad AI action approvals, but too generic for governed graph ingestion. It has no target layer, target type, risk level, requester role, or explicit error field.

### `GovernanceApproval`

Fields:

- `title`
- `targetType`
- `targetId`
- `requestedBy`
- `status`
- `priority`
- `rationale`
- `decisionNotes`
- approval/rejection timestamps

Assessment:

Useful for simple governance approvals, but too thin for graph ingestion review packages because there is no JSON payload/result/error field.

### `ExecutionAuthorizationRequest`

Fields:

- `title`
- `targetType`
- `targetId`
- `requestedBy`
- `requestedRole`
- `actionType`
- `targetLayer`
- `riskLevel`
- `status`
- `rationale`
- `policyMatches`
- `approvedBy`
- `rejectedBy`
- `decisionNotes`
- `payload`
- `result`
- `error`
- timestamps

Assessment:

Best fit for Phase 4E. It can carry the review package, target semantic graph layer, risk level, reviewer result, and error/remediation notes without schema changes.

### `GovernanceAuditTrail`

Fields:

- `eventType`
- `actor`
- `actorRole`
- `targetType`
- `targetId`
- `action`
- `outcome`
- `severity`
- `details`

Assessment:

Best used as a companion audit trail after a review item is created or decided. It is not itself a queue because it lacks status/update fields.

### Article-Specific Review/Audit Models

`ArticleReviewNote` and `ArticleResearchAudit` are scoped to articles and should not be reused for semantic graph ingestion.

## Recommendation

Use `ExecutionAuthorizationRequest` for persisted ingestion review queue items in a later slice.

Recommended mapping:

- `title`: review queue item title
- `targetType`: `KnowledgeGraphNode` or `SemanticGraphIngestionPlan`
- `targetId`: existing node id or plan/request id when available
- `requestedBy`: operator/system actor
- `requestedRole`: null until role enforcement is added
- `actionType`: `semantic-graph.ingestion-review`
- `targetLayer`: `semantic-graph`
- `riskLevel`: item risk level
- `status`: `pending`
- `rationale`: review reason and instructions
- `policyMatches`: review reason and priority
- `payload`: full in-memory review item

## Implemented Module

`lib/ontology/ingestion-review-queue.ts`

Types/functions:

- `IngestionReviewQueueItem`
- `IngestionReviewDecision`
- `buildIngestionReviewItems(plan)`
- `classifyReviewReason(item)`
- `summarizeReviewQueue(items)`
- `mapReviewItemsToExistingApprovalShape(items)`

The module is pure and does not import Prisma.

## Review Reasons

### `POSSIBLE_DUPLICATE`

An entity may duplicate an existing graph node. A reviewer should approve create, approve match, request changes, or reject.

### `BLOCK_CONFLICT`

An entity closely matches an existing node but conflicts by type or identity. This should block write execution until remediated.

### `REQUIRES_REVIEW`

Governance requires human review even if the entity-level plan has no hard conflict.

### `GOVERNANCE_BLOCK`

Governance blocked the plan. The safe default is reject/remediate and generate a new plan.

### `LOW_CONFIDENCE`

Ontology or relationship confidence is below the direct-allow threshold.

### `HIGH_DUPLICATE_RISK`

Aggregate duplicate risk is high enough to require escalation.

## Read-Only Route

`GET /api/ontology/ingestion-review-queue`

The route:

- uses example ontology payloads
- uses mock existing graph candidates
- builds a dry-run entity resolution plan
- builds review queue items
- maps those items to `ExecutionAuthorizationRequest`-shaped payloads
- returns `writesToPrisma: false`
- returns `deletesFromPrisma: false`
- performs no Prisma transaction
- performs no database writes
- performs no deletes

## Why Persistence Waits

Persistence should wait until Slice 2 because the system needs explicit decisions about:

- whether every `POSSIBLE_DUPLICATE` becomes one authorization request or grouped package
- who can approve graph ingestion reviews
- whether approved match decisions can be consumed by the write executor
- how to audit reviewer decisions
- how to expire stale review items
- how to prevent old approvals from authorizing new payloads

## Phase 4E Slice 2 Recommendation

Slice 2 should add a guarded persistence path for review packages using `ExecutionAuthorizationRequest`, still without executing graph writes from approval automatically.

Minimum gates for Slice 2:

- dry-run review queue can be persisted only by explicit operator request
- `ExecutionAuthorizationRequest.status` starts as `pending`
- full review item is stored in `payload`
- `GovernanceAuditTrail` records queue creation
- no graph write is triggered by persistence
- approvals remain a separate step

## Hard Boundary

Until review persistence and decision consumption are implemented, the Phase 4C write executor remains limited to controlled test writes and must not become a broad automatic ingestion endpoint.
