# EV-KOS Phase 4C Prisma Write Mapping

Date: 2026-06-26

Status: Phase 4C Slice 2 audit only. No schema changes, migrations, route changes, or database writes are introduced by this document.

## Purpose

Phase 4C will eventually turn governed ontology ingestion plans into canonical tenant semantic graph writes. The canonical graph foundation remains the existing Prisma-backed semantic graph:

- `SemanticKnowledgeRecord`
- `SemanticEmbeddingIndex`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `SemanticMemoryQuery`
- `KnowledgeGraphSynthesisRun`

Slice 2 audits the current model shape and proposes the precise write mapping for a later guarded executor. Slice 3 should implement only the smallest safe write path, behind existing governance preconditions and explicit write enablement.

## Current Route Inventory

### `app/api/knowledge-graph/route.ts`

- `GET` reads recent records, embedding indexes, nodes, edges, memory queries, and synthesis runs.
- `POST` is the existing broad synthesis writer.
- It resolves the default tenant with `SovereignOrganization.slug = "echoes-visions"` and the first `OrganizationWorkspace` for that organization.
- It writes:
  - `KnowledgeGraphSynthesisRun`
  - `SemanticKnowledgeRecord`
  - `SemanticEmbeddingIndex`
  - `KnowledgeGraphNode`
  - `KnowledgeGraphEdge`
  - `OperationalEvent`
- It uses `create` calls, not upserts.
- It uses a SHA-256 `vectorHash` placeholder instead of real embeddings.

### `app/api/knowledge-graph/record/route.ts`

- Manual memory creation endpoint.
- Validates `title` and `content`.
- Resolves organization from `body.organizationId` or default slug `echoes-visions`.
- Resolves workspace from `body.workspaceId` or first workspace under the organization.
- Writes:
  - `SemanticKnowledgeRecord`
  - `SemanticEmbeddingIndex`
- It uses `create` calls, not upserts.

### `app/api/knowledge-graph/query/route.ts`

- Reads active records, nodes, and edges for an organization.
- Calls OpenAI to answer from supplied memory.
- Writes a `SemanticMemoryQuery`.
- This model is query/audit output, not part of graph ingestion writes.

### Ontology Phase 4 Routes

- `app/api/ontology/semantic-graph-adapter/route.ts` returns adapter payloads only.
- `app/api/ontology/semantic-graph-ingestion/route.ts` returns dry-run ingestion plans only.
- `app/api/ontology/governed-ingestion/route.ts` returns governed dry-run plans and audit output only.
- `app/api/ontology/semantic-graph-transaction/route.ts` returns dry-run, blocked, and allowed-but-not-executed transaction examples only.
- These routes intentionally return `writesToPrisma: false` and do not access the database.

## Model Field Audit

### `SemanticKnowledgeRecord`

Fields:

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | no | `cuid()` | Primary key. |
| `organizationId` | `String?` | no | none | Indexed; tenant scope is nullable in schema. |
| `workspaceId` | `String?` | no | none | Indexed; workspace scope is nullable in schema. |
| `title` | `String` | yes | none | Required. |
| `content` | `String` | yes | none | Required. |
| `recordType` | `String` | no | `"knowledge"` | Indexed. |
| `sourceLayer` | `String?` | no | none | Indexed. |
| `sourceType` | `String?` | no | none | Adapter can provide this. |
| `sourceId` | `String?` | no | none | No uniqueness constraint yet. |
| `importance` | `Int` | no | `50` | Indexed. |
| `confidence` | `Float` | no | `0.75` | No index. |
| `tags` | `Json?` | no | none | Adapter supplies array. |
| `metadata` | `Json?` | no | none | Use for ontology/governance provenance. |
| `status` | `String` | no | `"active"` | Indexed. |
| `createdAt` | `DateTime` | no | `now()` | System generated. |
| `updatedAt` | `DateTime` | no | `@updatedAt` | System generated. |

Indexes:

- `organizationId`
- `workspaceId`
- `recordType`
- `sourceLayer`
- `importance`
- `status`

Unique constraints:

- None beyond primary key.

Relation constraints:

- None declared. `organizationId` and `workspaceId` are scalar references only.

### `SemanticEmbeddingIndex`

Fields:

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | no | `cuid()` | Primary key. |
| `knowledgeId` | `String` | yes | none | Required scalar pointer to `SemanticKnowledgeRecord.id`; no Prisma relation declared. |
| `organizationId` | `String?` | no | none | Indexed. |
| `workspaceId` | `String?` | no | none | Indexed. |
| `embeddingModel` | `String` | no | `"text-embedding-3-small"` | Indexed. |
| `vectorHash` | `String?` | no | none | Current routes use SHA-256 placeholder. |
| `dimensions` | `Int` | no | `1536` | Current default matches placeholder model. |
| `contentPreview` | `String?` | no | none | Current routes use first 280 chars. |
| `metadata` | `Json?` | no | none | Use to mark placeholder/non-vector status. |
| `status` | `String` | no | `"indexed"` | Indexed. |
| `createdAt` | `DateTime` | no | `now()` | System generated. |
| `updatedAt` | `DateTime` | no | `@updatedAt` | System generated. |

Indexes:

- `knowledgeId`
- `organizationId`
- `workspaceId`
- `embeddingModel`
- `status`

Unique constraints:

- None beyond primary key. Multiple embedding indexes can point to the same `knowledgeId`.

Relation constraints:

- None declared.

### `KnowledgeGraphNode`

Fields:

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | no | `cuid()` | Primary key. |
| `organizationId` | `String?` | no | none | Indexed. |
| `workspaceId` | `String?` | no | none | Indexed. |
| `nodeType` | `String` | yes | none | Required; ontology entity type maps here. |
| `name` | `String` | yes | none | Required; no uniqueness constraint. |
| `summary` | `String?` | no | none | Optional entity summary. |
| `importance` | `Int` | no | `50` | Indexed. |
| `sourceRecordId` | `String?` | no | none | Indexed scalar pointer to `SemanticKnowledgeRecord.id`; no relation declared. |
| `metadata` | `Json?` | no | none | Use for semantic node key, ontology confidence, and provenance. |
| `status` | `String` | no | `"active"` | Indexed. |
| `createdAt` | `DateTime` | no | `now()` | System generated. |
| `updatedAt` | `DateTime` | no | `@updatedAt` | System generated. |

Indexes:

- `organizationId`
- `workspaceId`
- `nodeType`
- `importance`
- `sourceRecordId`
- `status`

Unique constraints:

- None beyond primary key.

Relation constraints:

- None declared.

### `KnowledgeGraphEdge`

Fields:

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | no | `cuid()` | Primary key. |
| `organizationId` | `String?` | no | none | Indexed. |
| `workspaceId` | `String?` | no | none | Indexed. |
| `sourceNodeId` | `String` | yes | none | Required scalar pointer to source `KnowledgeGraphNode.id`; no relation declared. |
| `targetNodeId` | `String` | yes | none | Required scalar pointer to target `KnowledgeGraphNode.id`; no relation declared. |
| `relationType` | `String` | yes | none | Required; ontology relationship type maps here. |
| `strength` | `Float` | no | `0.5` | Indexed. |
| `summary` | `String?` | no | none | Optional relation summary. |
| `evidence` | `Json?` | no | none | Use for source/target names, ontology confidence, governance request id. |
| `status` | `String` | no | `"active"` | Indexed. |
| `createdAt` | `DateTime` | no | `now()` | System generated. |
| `updatedAt` | `DateTime` | no | `@updatedAt` | System generated. |

Indexes:

- `organizationId`
- `workspaceId`
- `sourceNodeId`
- `targetNodeId`
- `relationType`
- `strength`
- `status`

Unique constraints:

- None beyond primary key.

Relation constraints:

- None declared. The executor must resolve temporary node keys to actual node ids before edge creation.

### `SemanticMemoryQuery`

Fields:

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | no | `cuid()` | Primary key. |
| `organizationId` | `String?` | no | none | Indexed. |
| `workspaceId` | `String?` | no | none | Indexed. |
| `question` | `String` | yes | none | Required. |
| `answer` | `String?` | no | none | Optional. |
| `confidence` | `Float` | no | `0.7` | Indexed. |
| `matchedRecords` | `Json?` | no | none | Query output. |
| `matchedNodes` | `Json?` | no | none | Query output. |
| `reasoningPath` | `Json?` | no | none | Query output. |
| `status` | `String` | no | `"completed"` | Indexed. |
| `createdAt` | `DateTime` | no | `now()` | System generated. |

Indexes:

- `organizationId`
- `workspaceId`
- `confidence`
- `status`

Unique constraints:

- None beyond primary key.

Relation constraints:

- None declared.

Slice 3 should not write this model. It is a downstream query/audit artifact.

### `KnowledgeGraphSynthesisRun`

Fields:

| Field | Type | Required | Default | Notes |
| --- | --- | --- | --- | --- |
| `id` | `String` | no | `cuid()` | Primary key. |
| `organizationId` | `String?` | no | none | Indexed. |
| `workspaceId` | `String?` | no | none | Indexed. |
| `title` | `String` | yes | none | Required. |
| `status` | `String` | no | `"completed"` | Indexed. |
| `graphHealth` | `Int` | no | `75` | Indexed. |
| `memoryHealth` | `Int` | no | `75` | Current broad synthesis health metric. |
| `retrievalHealth` | `Int` | no | `75` | Current broad synthesis health metric. |
| `summary` | `String?` | no | none | Optional. |
| `findings` | `Json?` | no | none | Could store high-level ingestion/synthesis findings. |
| `createdAt` | `DateTime` | no | `now()` | System generated. |

Indexes:

- `organizationId`
- `workspaceId`
- `status`
- `graphHealth`

Unique constraints:

- None beyond primary key.

Relation constraints:

- None declared.

Slice 3 should not write this model unless the slice is explicitly expanded. It is better treated as a downstream synthesis/reporting run rather than the canonical ingestion audit.

## Governance, Approval, and Audit Model Candidates

### `GovernanceAuditTrail`

Best fit for persisted governed ingestion audit in a later slice.

Required fields:

- `eventType`
- `action`
- `outcome`

Optional fields:

- `actor`
- `actorRole`
- `targetType`
- `targetId`
- `severity`
- `details`

Proposed use:

```ts
{
  eventType: "semantic-graph-ingestion",
  actor: request.actorId,
  actorRole: "operator",
  targetType: "SemanticKnowledgeRecord",
  targetId: createdRecord.id,
  action: "semantic-graph.write",
  outcome: "completed",
  severity: plan.riskScore >= 60 ? "warning" : "info",
  details: {
    requestId: plan.requestId,
    decision: plan.decision,
    approvalRequired: plan.approvalRequired,
    riskScore: plan.riskScore,
    duplicateRisk: plan.duplicateRisk,
    ontologyConfidence: plan.ontologyConfidence,
    relationshipConfidence: plan.relationshipConfidence,
    recordsCreated,
    nodesCreated,
    edgesCreated
  }
}
```

### `ExecutionAuthorizationRequest`

Best fit for review-required or blocked write requests before execution.

Required fields:

- `title`
- `targetType`
- `actionType`

Optional fields:

- `targetId`
- `requestedBy`
- `requestedRole`
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

Proposed use:

- Create only when `decision === "REQUIRES_REVIEW"` or an operator explicitly asks to persist a review package.
- Do not create authorization records automatically in Slice 3 unless that is the slice's explicit scope.

### `GovernanceApproval`

Useful for simpler approval workflows, but less expressive than `ExecutionAuthorizationRequest` because it lacks payload/result/error fields.

### `AiApprovalRequest`

General AI action approval model. It can support agent-level actions, but governed graph ingestion should prefer the governance-specific models above.

### `GovernanceRiskSignal`

Useful for surfacing high-risk ingestion attempts, but not needed for the first write executor.

### `ArticleResearchAudit`

Specific to article research and should not be reused for ontology graph ingestion.

## Organization and Workspace Requirements

Schema reality:

- Semantic graph models allow nullable `organizationId` and `workspaceId`.
- Existing knowledge graph routes often resolve a default organization by slug `echoes-visions`.
- `OrganizationWorkspace.organizationId` is required, but there is no Prisma relation declared from semantic graph models to workspace or organization.

Phase 4C governance requirement:

- Even though the schema allows nullable tenant scope, future governed writes should require `organizationId`.
- `workspaceId` should be required for ontology ingestion if the executor is operating inside a workspace-scoped request. Slice 1 already blocks non-dry-run requests without `workspaceId`.
- The executor should verify that a supplied `workspaceId` belongs to `organizationId` before writing in any real write slice.

Recommended Slice 3 tenant preconditions:

- `actorId` present.
- `organizationId` present.
- `workspaceId` present.
- `dryRun === false`.
- `explicitWriteEnabled === true`.
- Governance decision is `ALLOW` or `ALLOW_WITH_WARNING`.
- `approvalRequired === false`.
- Plan has no validation errors.
- Execution plan still has `writesToPrisma: false` at input time, proving the plan came from the read-only planning layer and has not already been executed.

## Proposed Create Payload Shape

### Record Create

```ts
{
  organizationId: request.organizationId,
  workspaceId: request.workspaceId,
  title: record.title,
  content: record.content,
  recordType: record.recordType,
  sourceLayer: record.sourceLayer,
  sourceType: record.sourceType ?? null,
  sourceId: record.sourceId ?? null,
  importance: record.importance,
  confidence: record.confidence,
  tags: record.tags ?? [],
  metadata: {
    ...record.metadata,
    governedIngestion: {
      requestId: plan.requestId,
      decision: plan.decision,
      riskScore: plan.riskScore,
      duplicateRisk: plan.duplicateRisk,
      ontologyConfidence: plan.ontologyConfidence,
      relationshipConfidence: plan.relationshipConfidence,
      actorId: request.actorId
    }
  },
  status: "active"
}
```

### Embedding Index Create

```ts
{
  knowledgeId: createdRecord.id,
  organizationId: request.organizationId,
  workspaceId: request.workspaceId,
  embeddingModel: "text-embedding-3-small",
  vectorHash: sha256(record.content),
  dimensions: 1536,
  contentPreview: record.content.slice(0, 280),
  metadata: {
    note: "Vector hash placeholder. Replace with real embeddings in a later embeddings phase.",
    source: "phase-4c-governed-ingestion"
  },
  status: "indexed"
}
```

### Node Create

```ts
{
  organizationId: request.organizationId,
  workspaceId: request.workspaceId,
  nodeType: node.nodeType,
  name: node.name,
  summary: node.summary ?? null,
  importance: node.importance,
  sourceRecordId: createdRecord.id,
  metadata: {
    ...node.metadata,
    governedIngestion: {
      requestId: plan.requestId,
      actorId: request.actorId
    }
  },
  status: "active"
}
```

### Edge Create

```ts
{
  organizationId: request.organizationId,
  workspaceId: request.workspaceId,
  sourceNodeId: resolvedSourceNodeId,
  targetNodeId: resolvedTargetNodeId,
  relationType: edge.relationType,
  strength: edge.strength,
  summary: edge.summary ?? null,
  evidence: {
    ...edge.evidence,
    governedIngestion: {
      requestId: plan.requestId,
      actorId: request.actorId
    }
  },
  status: "active"
}
```

### Audit Trail Create

```ts
{
  eventType: "semantic-graph-ingestion",
  actor: request.actorId,
  actorRole: null,
  targetType: "SemanticKnowledgeRecord",
  targetId: createdRecord.id,
  action: "semantic-graph.write",
  outcome: "completed",
  severity: plan.decision === "ALLOW_WITH_WARNING" ? "warning" : "info",
  details: {
    requestId: plan.requestId,
    recordsCreated: 1,
    nodesCreated: createdNodes.length,
    edgesCreated: createdEdges.length,
    governance: plan.audit
  }
}
```

## Proposed Upsert Payload Shape

The current schema has no semantic uniqueness constraints for records, nodes, or edges. Prisma `upsert` requires a unique selector, so true upserts are not currently available for these models beyond primary-key `id`.

Safe upsert-like strategy without schema changes:

1. Find existing record candidate:
   - `organizationId`
   - `workspaceId`
   - `sourceLayer`
   - `sourceType`
   - `sourceId`
   - `status: "active"`
2. If found, either:
   - skip record creation and attach nodes to the existing record, or
   - block and require review if duplicate risk is high.
3. Find existing node candidate:
   - `organizationId`
   - `workspaceId`
   - `nodeType`
   - normalized `name`
   - `status: "active"`
4. If found, reuse existing node id for edges.
5. Find existing edge candidate:
   - `organizationId`
   - `workspaceId`
   - `sourceNodeId`
   - `targetNodeId`
   - `relationType`
   - `status: "active"`
6. If found, skip edge creation or update only after a dedicated merge policy is defined.

Do not use actual Prisma `upsert` in Slice 3 unless the request includes existing primary-key ids. A proper unique constraint strategy belongs in a later entity resolution slice.

## Proposed Transaction Order

Future write executor order:

1. Validate transaction request:
   - explicit write enabled
   - actor/organization/workspace present
   - governance decision allows write
   - no approval required
   - no validation errors
2. Verify organization exists.
3. Verify workspace exists and belongs to organization.
4. Duplicate preflight:
   - record source identity candidate
   - node name/type candidates
   - edge relationship candidates
5. If duplicate policy says review, block or return review-required result.
6. Begin Prisma transaction.
7. Create `SemanticKnowledgeRecord`.
8. Create `SemanticEmbeddingIndex` placeholder for the record.
9. Create `KnowledgeGraphNode` rows with `sourceRecordId = createdRecord.id`.
10. Build `nodeKeyMap` from temporary semantic node keys to created database ids.
11. Create `KnowledgeGraphEdge` rows using resolved node ids.
12. Create `GovernanceAuditTrail`.
13. Return created ids, counts, governance summary, and audit id.

Transaction output should never expose a partial success. If any write fails, the transaction should rollback.

## Required Governance Preconditions

Minimum preconditions before any Slice 3 write:

- `dryRun === false`.
- `explicitWriteEnabled === true`.
- `actorId` is present.
- `organizationId` is present.
- `workspaceId` is present.
- Organization exists.
- Workspace exists and belongs to the organization.
- `plan.decision` is `ALLOW` or `ALLOW_WITH_WARNING`.
- `plan.approvalRequired === false`.
- `plan.errors.length === 0`.
- `plan.validation.valid === true`.
- `plan.executionPlan.recordsToCreate.length === 1`.
- Every planned node has `name` and `nodeType`.
- Every planned edge has a resolved temporary key that maps to a planned or reused node.
- No `REQUIRES_REVIEW` or `BLOCK` plan can write.

## Audit Persistence Options

Recommended order:

1. Slice 3 writes `GovernanceAuditTrail` only after successful graph writes.
2. Later Slice 4E can persist review packages in `ExecutionAuthorizationRequest`.
3. Later learning/monitoring slices can emit `GovernanceRiskSignal` for repeated high-risk or duplicate ingestion attempts.

Do not overload `ArticleResearchAudit`; it is article-specific and tied to `Article`.

## What Can Be Safely Written in Slice 3

If approved, Slice 3 can safely add a guarded executor implementation that writes only:

- `SemanticKnowledgeRecord`
- `SemanticEmbeddingIndex`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `GovernanceAuditTrail`

Slice 3 should write only from a governed transaction request that passes all preconditions. The default mode must remain dry-run. The write route, if any, should be opt-in, explicit, and operator-only.

## What Must Remain Dry-Run

Keep these dry-run or read-only in Slice 3:

- `REQUIRES_REVIEW` plans.
- `BLOCK` plans.
- Missing actor, organization, or workspace requests.
- Duplicate candidates above review threshold.
- `SemanticMemoryQuery` creation from ingestion.
- `KnowledgeGraphSynthesisRun` creation from ingestion.
- `ExecutionAuthorizationRequest` persistence unless Slice 3 scope explicitly includes review package creation.
- Any entity resolution merge/update behavior.
- Any real embedding/vector generation.
- Any schema migration or new uniqueness constraint.
- Existing graph route rewrites.

## Risks

- The semantic graph models do not declare relations, so the executor must enforce referential integrity in application code.
- The models have no unique constraints for semantic identity, so duplicate prevention must be preflight-based until a later entity resolution phase.
- `organizationId` and `workspaceId` are nullable in the schema, but governed writes should require them for EV-KOS tenant safety.
- Existing broad synthesis routes already write graph rows directly; Phase 4C should not refactor them during Slice 3.
- Placeholder embedding hashes are not semantic vectors. They should not be presented as real vector search.
- Audit persistence currently has a suitable generic table, but no dedicated governed ingestion audit model.

## Recommended Slice 3 Plan

Implement the smallest guarded write path in `lib/ontology/semantic-graph-transaction-executor.ts`:

1. Keep dry-run as the default.
2. Add an explicit dependency-injected Prisma executor or a narrow internal function so tests can validate behavior without writes.
3. Validate organization and workspace before transaction.
4. Add duplicate preflight reads.
5. Block review-required and duplicate-risk cases.
6. Execute a single transaction for record, embedding index, nodes, edges, and audit trail.
7. Return ids and counts only.
8. Add a read-only preview route or a protected write route only after operator approval.

Slice 3 should not introduce schema changes, upsert semantics, entity merges, graph route rewrites, or autonomous ingestion.
