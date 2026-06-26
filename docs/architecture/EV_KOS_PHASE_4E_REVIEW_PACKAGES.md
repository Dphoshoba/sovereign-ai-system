# EV-KOS Phase 4E Slice 2 - Persisted Ingestion Review Packages

## Status

Implemented as a guarded persistence slice. This slice creates pending review
packages only. It does not execute semantic graph writes.

## Goal

Phase 4E Slice 2 persists semantic graph ingestion review items as pending
authorization packages so a human operator can review duplicates, conflicts, and
governance review cases before later phases attempt graph writes.

## Existing Prisma Model Used

The existing model used is `ExecutionAuthorizationRequest`.

Exact model shape:

```prisma
model ExecutionAuthorizationRequest {
  id            String   @id @default(cuid())
  title         String
  targetType    String
  targetId      String?
  requestedBy   String?
  requestedRole String?
  actionType    String
  targetLayer   String?
  riskLevel     String   @default("medium")
  status        String   @default("pending")
  rationale     String?
  policyMatches Json?
  approvedBy    String?
  rejectedBy    String?
  decisionNotes String?
  payload       Json?
  result        Json?
  error         String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([targetType])
  @@index([targetId])
  @@index([actionType])
  @@index([targetLayer])
  @@index([riskLevel])
  @@index([status])
}
```

Required fields for creation:

- `title`
- `targetType`
- `actionType`

Fields explicitly set by this slice:

- `title`
- `targetType`
- `targetId`
- `requestedBy`
- `requestedRole`
- `actionType`
- `targetLayer`
- `riskLevel`
- `status: "pending"`
- `rationale`
- `policyMatches`
- `payload`

`organizationId` is required by the package request and stored in `payload`
because `ExecutionAuthorizationRequest` does not currently have a dedicated
organization column. This avoids schema changes while preserving review
traceability.

## API Route

Route:

```text
app/api/ontology/ingestion-review-queue/create-package/route.ts
```

### GET

GET is preview only.

It returns:

- required POST fields
- an example `ExecutionAuthorizationRequest` payload
- `writesToPrisma: false`
- `graphWrites: false`
- `graphDeletes: false`
- `databaseAccess: false`

### POST

POST is the only persistence path in this slice.

It requires:

- `explicitCreatePackage: true`
- `actorId`
- `organizationId`
- `source: "semantic-graph-ingestion-review"`
- one or more pending ingestion review queue items

It creates:

- pending `ExecutionAuthorizationRequest` records only

It does not create:

- `SemanticKnowledgeRecord`
- `SemanticEmbeddingIndex`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- graph audit rows
- operational graph events

The response returns:

- `writesToPrisma: true` only when approval package rows are created
- `graphWrites: false`
- `graphDeletes: false`
- created package IDs

## Module

Module:

```text
lib/ontology/ingestion-review-package.ts
```

Functions:

- `buildExecutionAuthorizationPayload(item)`
- `validateReviewPackageRequest(request)`
- `createIngestionReviewPackage(request)`
- `summarizeReviewPackageResult(result)`

## Review Package Mapping

Each `IngestionReviewQueueItem` maps to one `ExecutionAuthorizationRequest`.

Mapping:

- `item.title` -> `title`
- `item.targetType` -> `targetType`
- `item.targetId` -> `targetId`
- `actorId` -> `requestedBy`
- `requestedRole || "semantic-graph-operator"` -> `requestedRole`
- `"semantic-graph.ingestion-review"` -> `actionType`
- `"semantic-graph"` -> `targetLayer`
- `item.riskLevel` -> `riskLevel`
- `"pending"` -> `status`
- `item.rationale` -> `rationale`
- `item.reason` and `item.priority` -> `policyMatches`
- original item, tenant scope, source, and package metadata -> `payload`

## Safety Boundary

This slice deliberately separates review package persistence from graph
mutation.

Approval package creation does not authorize or trigger graph writes. Future
phases must still pass the semantic graph transaction executor gates:

- `writeMode: "explicit-test-write"` until broadened by a later approved phase
- `explicitWriteEnabled: true`
- `dryRun: false`
- governance decision `ALLOW` or `ALLOW_WITH_WARNING`
- `approvalRequired: false`
- actor, organization, and workspace scope checks
- duplicate preflight

## Controlled Test Data

Controlled POST tests should use:

- `source: "semantic-graph-ingestion-review"`
- a recognizable `actorId`
- a recognizable `organizationId`
- review item titles containing Phase 4E context

The created rows can be identified by:

- `targetLayer: "semantic-graph"`
- `actionType: "semantic-graph.ingestion-review"`
- `status: "pending"`
- `payload.packageSource: "semantic-graph-ingestion-review"`
- `payload.createdByPhase: "phase-4e-slice-2"`

## Risks

- `ExecutionAuthorizationRequest` has no dedicated `organizationId` field, so
  organization scope is stored inside JSON payload for this slice.
- Duplicate review package prevention is not implemented yet; repeated
  controlled POST calls can create multiple pending packages for the same item.
- Approval decisions still do not execute graph writes. This is intentional
  until Phase 4E Slice 3 and later transaction phases define the handoff.

## Recommended Phase 4E Slice 3

Add a read-only review package lookup and decision-preparation layer that can:

- find pending semantic graph ingestion review packages
- summarize package risk and target information
- prepare approve/reject/remediation decisions
- avoid triggering graph writes from approval decisions
- define how approved packages feed a later governed graph execution request
