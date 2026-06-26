# EV-KOS Phase 4D Entity Resolution

Date: 2026-06-26

Status: Phase 4D dry-run foundation. No writes, deletes, schema changes, migrations, or graph-route rewrites are introduced.

## Purpose

Phase 4C proved a guarded semantic graph write boundary. Phase 4D adds the missing safety layer before broader ingestion: entity resolution and duplicate-safe write planning.

The goal is not to merge data yet. The goal is to classify proposed ontology entities against existing graph candidates so the executor can later decide whether to create, match, review, or block.

## Canonical Position

The canonical graph remains the existing tenant semantic graph:

- `SemanticKnowledgeRecord`
- `SemanticEmbeddingIndex`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `GovernanceAuditTrail`

Entity resolution sits between governed ingestion and the guarded transaction executor:

```text
Ontology extraction
-> Semantic graph adapter
-> Governed ingestion plan
-> Entity resolution plan
-> Guarded write executor
-> Prisma transaction
```

## Implemented Functions

`lib/ontology/entity-resolution.ts` defines:

- `normalizeEntityName(name)`
- `buildEntityFingerprint(entity)`
- `buildRelationshipFingerprint(edge)`
- `scoreEntitySimilarity(a, b)`
- `classifyEntityResolution(candidate, existing)`
- `buildEntityResolutionPlan(payload, existingCandidates)`
- `summarizeEntityResolutionPlan(plan)`

The module is deterministic and dry-run only. It does not import Prisma.

## Resolution Outcomes

### `CREATE_NEW`

The candidate has no strong existing match and can be considered for creation in a later write slice.

### `MATCH_EXISTING`

The candidate strongly matches an existing graph node. A later write slice should reuse the existing node id instead of creating a duplicate.

### `POSSIBLE_DUPLICATE`

The candidate resembles an existing node but is not strong enough to merge automatically. This requires review or a stricter policy before writing.

### `BLOCK_CONFLICT`

The candidate is too risky to write. The common case is a near-match with a conflicting entity type, such as a proposed `process` matching an existing `application` with the same normalized name.

## Plan Shape

Every entity resolution plan includes:

- `dryRun: true`
- `entitiesToCreate`
- `entitiesToMatch`
- `possibleDuplicates`
- `blockedConflicts`
- `relationshipsToCreate`
- `duplicateRiskScore`
- `confidence`
- `warnings`
- `errors`

Any blocked conflict produces an error. Possible duplicates produce warnings and should not be silently written by broader ingestion.

## Similarity Strategy

The first implementation uses transparent heuristics:

- normalized name matching
- entity type matching
- alias overlap
- summary token overlap
- relationship endpoint resolution

This is intentionally simple and reversible. It avoids real embeddings, vector search, or learned matching until the graph has stronger governance around merge behavior.

## Read-Only Route

`GET /api/ontology/entity-resolution`

The route:

- uses example ontology payloads
- uses mock existing candidates
- performs no writes
- performs no deletes
- opens no Prisma transaction
- returns `writesToPrisma: false`
- returns `deletesFromPrisma: false`
- returns `databaseAccess: false`

Mock candidates are preferred in this slice so the behavior is reproducible and safe during static/build verification.

## Duplicate Handling Behavior

The dry-run planner should be interpreted as follows:

- `entitiesToCreate`: safe to create only after governed write gates pass.
- `entitiesToMatch`: safe to reuse only after a later executor can map temporary node keys to existing ids.
- `possibleDuplicates`: should trigger review before write.
- `blockedConflicts`: must block write execution.
- `relationshipsToCreate`: safe only if both endpoint entities are clear or intentionally matched.

## What Is Not Built Yet

Phase 4D does not add:

- database reads in the route
- Prisma writes
- Prisma deletes
- schema constraints
- migrations
- automatic upserts
- merge behavior
- graph route rewrites
- Phase 3 research changes
- embedding similarity

## Why This Stays Dry-Run

The current schema has no semantic uniqueness constraints for nodes or edges. Matching and merging must therefore be enforced by application policy before any broad ingestion can safely create or reuse graph rows.

Dry-run planning gives the operator a visible duplicate/conflict report before the write executor is allowed to act.

## Recommended Phase 4E

Phase 4E should persist approval and review flow around entity resolution:

1. Persist review-required entity resolution plans.
2. Route `POSSIBLE_DUPLICATE` and `BLOCK_CONFLICT` cases to human approval.
3. Store reviewer decisions and rationale.
4. Allow the guarded executor to consume approved match/create decisions.
5. Add a cleanup/rollback plan for controlled test data only after separate approval.

Phase 4E should still avoid broad automatic ingestion until review persistence and operator authorization are complete.
