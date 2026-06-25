# EV-KOS Phase 4 Semantic Graph Plan

## Purpose

Phase 4 turns the EV-KOS research and ontology layers into a durable knowledge graph foundation. The first rule is consolidation: do not create a new graph system. The canonical graph foundation is the existing tenant semantic graph already modeled by `SemanticKnowledgeRecord`, `KnowledgeGraphNode`, `KnowledgeGraphEdge`, `SemanticMemoryQuery`, and `KnowledgeGraphSynthesisRun`.

Phase 4A is a planning and adapter slice only. It defines how ontology outputs become write-ready semantic graph payloads, but it does not write to the database, change the Prisma schema, migrate data, or rewrite graph routes.

## Canonical Graph Choice

The canonical EV-KOS graph is the tenant semantic graph:

- `SemanticKnowledgeRecord` stores durable memory records.
- `KnowledgeGraphNode` stores canonical entities.
- `KnowledgeGraphEdge` stores canonical relationships between nodes.
- `SemanticMemoryQuery` stores retrieval questions, answers, matches, and reasoning paths.
- `KnowledgeGraphSynthesisRun` stores graph synthesis health, findings, and run history.

This is the right foundation because it is already organization/workspace scoped, supports records/nodes/edges, has query history, and can receive ontology outputs without introducing another graph layer.

## Existing Graph Systems And Future Role

### Tenant Semantic Graph

Future role: canonical EV-KOS knowledge graph.

This layer receives normalized ontology outputs from domain pipelines. Future writers should create records first, create or upsert nodes, then create or upsert edges. Embeddings can remain a follow-up concern until the graph write path is stable.

### Universal Knowledge Ontology

Future role: canonical extraction contract.

The ontology layer defines portable domain outputs such as people, places, events, processes, objects, themes, applications, and relationships. It should feed the tenant semantic graph through adapters, not through direct Prisma writes inside extractors.

### Executive Knowledge Graph

Future role: domain producer and downstream consumer.

The executive graph remains useful for deterministic business/executive intelligence. It should not be deleted or rewritten during Phase 4A. Later phases can map selected executive decisions, lessons, goals, initiatives, clients, and projects into semantic graph records while keeping executive screens functional.

### Legacy Global Knowledge Graph

Future role: legacy source and possible migration input.

The older global graph can be inventoried and selectively migrated, but it should not be treated as canonical. It is not the Phase 4 foundation because it is not the tenant semantic graph and has overlapping concepts.

### Cognitive Fabric

Future role: synthesis producer and insight consumer.

The cognitive fabric can produce insights that become semantic records. It should not become another canonical graph. Keep it as an intelligence layer that reads from and contributes to the canonical graph through adapters.

### Reasoning Engine

Future role: downstream consumer.

The reasoning engine should read canonical semantic records, nodes, edges, and query history to generate recommendations and consequence models. It should not own graph persistence.

### Specialized Memories

Future role: producers.

Runtime snapshots, learning memories, article embeddings, agent memories, and performance memories can become source records for semantic graph ingestion. They should feed the graph through explicit adapters or ingestion jobs, not through scattered graph writes.

## Migration And Consolidation Strategy

1. Keep the tenant semantic graph as the only canonical graph target.
2. Keep all new writes behind adapter functions and governance checks.
3. Start with ontology outputs because they already provide domain-neutral entities and relationships.
4. Add read-only examples before writes.
5. Add one guarded writer later that accepts validated adapter payloads.
6. Backfill old graph systems only after the canonical write path is verified.
7. Preserve existing graph routes until replacements are proven.
8. Use status fields and metadata to support rollback, source tracing, and audit review.

## Canonical Objects

Canonical objects in Phase 4 are:

- ontology extraction result
- semantic knowledge record payload
- knowledge graph node payload
- knowledge graph edge payload
- validation report

The canonical persisted graph remains:

- `SemanticKnowledgeRecord`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`

## Downstream, Producer, And Consumer Boundaries

Producer layers:

- research pipeline
- universal ontology extraction
- executive graph and memory systems
- cognitive fabric
- runtime and learning memories
- external signal systems

Canonical persistence layer:

- tenant semantic graph

Consumer layers:

- semantic memory query
- reasoning engine
- publishing systems
- executive intelligence
- future multi-agent collaboration

## What Must Not Change Yet

Phase 4A must not:

- change the Prisma schema
- add migrations
- write ontology outputs to Prisma
- rewrite existing graph routes
- replace executive graph behavior
- change Phase 3 research extraction, consensus, audit, or governance behavior
- add embeddings or pgvector work
- build a new graph system

## Risks

- Duplicate graph concepts can create confusion if route names are not clarified.
- Ontology entity types are universal, while existing graph consumers may expect operational node types.
- Edges need real node ids at write time; Phase 4A can only provide deterministic node keys and deferred references.
- Existing producer systems may create overlapping entities without a future entity resolution step.
- Premature migrations could break active admin screens.

## Rollback Strategy

Phase 4A rollback is simple because it is additive and read-only:

1. Remove the semantic graph adapter module.
2. Remove the read-only example route if present.
3. Remove this architecture document.

No database rollback is required because Phase 4A performs no writes, schema changes, or migrations.

## Phase 4B Recommendation

Phase 4B should add a guarded semantic graph ingestion service that accepts adapter payloads, validates them, and writes records/nodes/edges in a transaction. It should remain behind an explicit API or admin action, preserve review-required governance, and include a dry-run mode before any database writes are enabled.
