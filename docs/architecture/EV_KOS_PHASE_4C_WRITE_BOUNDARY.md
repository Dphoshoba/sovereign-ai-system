# EV-KOS Phase 4C Write Boundary

Date: 2026-06-26

Status: Phase 4C Slice 4 hardening. This document defines the current write boundary for guarded semantic graph ingestion.

## Purpose

Phase 4C introduced the first real semantic graph write executor. Slice 4 keeps that executor deliberately narrow. The system can perform controlled test writes, but broad automatic ingestion remains blocked until entity resolution, approval persistence, and operator authorization are stronger.

## Exact Write Gates

A real semantic graph write must satisfy every gate below:

- `writeMode` must equal `explicit-test-write`.
- `explicitWriteEnabled` must be `true`.
- `dryRun` must be `false`.
- `actorId` must be present.
- `organizationId` must be present.
- `workspaceId` must be present.
- The workspace must belong to the organization.
- The governed ingestion decision must be `ALLOW` or `ALLOW_WITH_WARNING`.
- `approvalRequired` must be `false`.
- The governed plan validation must pass.
- The governed plan must contain exactly one semantic knowledge record.
- Planned nodes must have names and types.
- Planned edges must have source, target, and relationship type.
- Duplicate preflight must not return blocking errors.

The default executor mode remains dry-run. Missing or invalid gates return a blocked result with `writesToPrisma: false`.

## Explicit Test-Write Limitation

The only route-level write mode currently accepted by `app/api/ontology/semantic-graph-transaction/route.ts` is:

```json
{
  "writeMode": "explicit-test-write",
  "explicitWriteEnabled": true,
  "dryRun": false
}
```

This is intentionally not a production ingestion mode. It exists so Phase 4C can verify the transaction boundary against the real Prisma schema without turning ontology ingestion into an automatic graph writer.

## Approval Boundary

The governed ingestion layer must produce an `ALLOW` or `ALLOW_WITH_WARNING` decision before a write can execute. Any `REQUIRES_REVIEW` or `BLOCK` decision remains non-executable.

The current implementation does not yet persist a review package before write execution. That means broader ingestion must remain blocked until a later slice stores review requests and verifies human approval through the governance system.

## Controlled Test Metadata

Controlled Phase 4C writes are tagged for later inspection:

- `sourceType`: `transaction-controlled-test`
- `sourceId` prefix: `phase-4c-controlled-write:`
- `controlledTestWrite.tag`: `phase-4c-controlled-test-write`
- `controlledTestWrite.cleanupEligible`: `true`
- `governedIngestion.requestId`
- `governedIngestion.actorId`
- governance decision and risk/confidence scores

The tag is attached to records, nodes, edge evidence, embedding metadata, and audit details where those models support JSON metadata.

## Cleanup Preview

Slice 4 adds a read-only cleanup preview route:

```text
GET /api/ontology/semantic-graph-transaction/cleanup-preview
```

The route:

- reads only
- does not delete
- does not write
- returns `writesToPrisma: false`
- returns `deletesFromPrisma: false`
- identifies controlled Phase 4C records by `sourceType`, `sourceId`, title prefix, and metadata tagging
- returns related embedding indexes, nodes, edges, and governance audit rows when identifiable

There is intentionally no cleanup/delete route yet. Actual cleanup should be a separately approved operation with a precise deletion plan and a fresh safety audit.

## Why Broad Automatic Ingestion Is Still Blocked

Broad ingestion is still blocked because:

- Semantic graph models do not have relational constraints.
- There are no semantic uniqueness constraints for records, nodes, or edges.
- Duplicate detection is still warning-based.
- Entity resolution and merge policy are not complete.
- Review-required decisions are not yet persisted into an approval workflow.
- The current write route is a controlled test utility, not an ingestion API.
- Placeholder embedding hashes are not real vector embeddings.

## Rollback Approach

For now, rollback is manual and audit-driven:

1. Use cleanup preview to identify controlled Phase 4C test-write records.
2. Inspect related embedding indexes, nodes, edges, and audit rows.
3. Prepare an explicit deletion plan.
4. Run deletion only after separate approval.

No automatic deletion endpoint is provided in Slice 4.

## Phase 4D Requirements

Phase 4D should solve entity resolution and upserts before any broader graph ingestion:

- canonical entity identity rules
- duplicate thresholds that can block writes
- safe reuse of existing nodes
- edge deduplication policy
- update-versus-create policy
- optional schema constraints if approved
- tests for duplicate candidate handling
- clear rollback plan for each write set

Until Phase 4D is complete, the Phase 4C executor should remain limited to controlled test writes.
