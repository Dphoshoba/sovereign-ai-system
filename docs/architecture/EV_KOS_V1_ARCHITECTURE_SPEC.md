# EV-KOS V1 Architecture Specification

## Status

Status: V1 architecture freeze draft

Date: 2026-06-26

This document freezes the current EV-KOS V1 architecture from the codebase state after governed semantic graph ingestion planning. It is a documentation artifact only. It does not authorize schema changes, database writes, route rewrites, or Phase 4C implementation.

## EV-KOS Overview

Echoes and Visions Knowledge Operating System (EV-KOS) is the platform layer beneath the current blog, research, publishing, executive, memory, and graph systems. The blog is the first application running on EV-KOS; it is not the whole system.

EV-KOS V1 is built around these principles:

- Source-grounded research before content generation.
- Universal ontology contracts before graph writes.
- Tenant semantic graph as the canonical graph foundation.
- Governed ingestion before any durable graph mutation.
- Human approval for risky, irreversible, external, or publication-impacting actions.
- Additive, reversible phases with verification after each slice.

## Current Phase Status

| Phase | Status | Notes |
| --- | --- | --- |
| Phase 0 - Platform Foundation | Complete | Base Next.js app, Prisma, admin surfaces, public app, and operational structure are present. |
| Phase 1 - Governance and Review | Complete | Research and publication gates require source-linked facts and human review. |
| Phase 2 - Research Pipeline | Complete | Source collection, evidence registry, extraction, verification, citation, and publication gate are active. |
| Phase 3 - Domain Intelligence | In progress | Category-aware extraction, Bible extraction, consensus themes, and semantic theme scoring are in place. |
| Phase 3.5 - Universal Knowledge Ontology | Complete | Domain ontology contract and mapping helpers exist under `lib/ontology`. |
| Phase 4A - Semantic Graph Adapter | Complete | Adapter converts ontology outputs into semantic graph payloads. |
| Phase 4B / 4B.5 - Dry-run and Governed Ingestion | Complete | Dry-run planning, governance evaluation, audit object creation, and read-only examples exist. |
| Phase 4C - Guarded Transaction Executor | Not started | Future work. Must remain gated and default to dry-run. |
| Phase 5 - Autonomous Research | Not started | Should consume governed graph outputs later. |
| Phase 6 - Multi-format Publishing | Not started | Should publish from governed knowledge records later. |
| Phase 7 - Multi-Agent Collaboration | Not started | Should coordinate agents over canonical memory/graph contracts. |
| Phase 8 - Learning and Optimization | Not started | Should feed performance learning back through governed memory. |
| Phase 9 - Knowledge Operating System | Not started | Final operating-system layer built on verified graph, memory, governance, and agent loops. |

## Layer Diagram

```text
Public Apps and Admin Surfaces
  - blog
  - admin
  - publishing
  - executive operations

Application APIs
  - research
  - ontology
  - knowledge graph
  - executive
  - publishing
  - governance

Domain Intelligence
  - research pipeline
  - category-aware extraction
  - Bible extraction
  - consensus engine
  - source fallback

Universal Ontology
  - DomainCategory
  - OntologyEntity
  - OntologyRelationship
  - OntologyExtractionResult

Semantic Graph Preparation
  - semantic graph adapter
  - dry-run ingestion
  - governed ingestion
  - audit object

Canonical Semantic Graph
  - SemanticKnowledgeRecord
  - KnowledgeGraphNode
  - KnowledgeGraphEdge
  - SemanticMemoryQuery
  - KnowledgeGraphSynthesisRun

Downstream Intelligence
  - reasoning engine
  - executive intelligence
  - cognitive fabric
  - publishing decisions
  - future multi-agent collaboration
```

## Data Flow

```text
Topic or source input
  -> source collection
  -> evidence registry
  -> fact extraction
  -> fact verification
  -> consensus and theme grouping
  -> article composition and publication gate
  -> ontology extraction result
  -> semantic graph adapter payload
  -> dry-run ingestion plan
  -> governed ingestion plan
  -> future Phase 4C transaction executor
  -> canonical semantic graph
  -> reasoning, memory, publishing, and agent consumers
```

Current Phase 4B.5 stops before the future transaction executor. No governed ingestion module writes to the database.

## Research Pipeline

Primary modules live under `lib/research/`.

Important modules:

- `source-collector.ts`: collects manual and search-backed source records.
- `fallback-source-provider.ts`: provides category-aware fallback sources.
- `evidence-registry.ts`: binds evidence to source records.
- `fact-extractor.ts`: creates structured claims from evidence.
- `bible-extractor.ts`: extracts Bible-specific entities and claims.
- `fact-verification-engine.ts`: verifies claims against supporting evidence.
- `consensus-engine.ts`: groups facts into consensus themes using scored theme matching.
- `citation-builder.ts`: constructs source-backed citations.
- `publication-gate.ts`: blocks unsafe publication states.
- `pipeline-registry.ts`: documents the source-grounded pipeline rules.

Research policy:

- No fabricated facts.
- No unsupported claims.
- No invented statistics, studies, companies, or quotes.
- Publication remains review-gated.
- Research audit and review-required governance must be preserved.

## Ontology Layer

Primary modules:

- `lib/ontology/types.ts`
- `lib/ontology/index.ts`

Core types:

- `DomainCategory`
- `OntologyEntityType`
- `OntologyRelationshipType`
- `OntologyExtractionResult`
- `OntologyEntity`
- `OntologyRelationship`

Supported V1 domain categories:

- `ai-tools`
- `bible-stories`
- `history`
- `health`
- `space`
- `motivation`
- `business`
- `creators`

Ontology helper functions:

- `normalizeDomainCategory(category)`
- `ontologyTypesForDomain(category)`
- `mapOntologyToSemanticGraphShape(result)`

The ontology layer is a contract layer. It must not write to Prisma directly.

## Semantic Graph Layer

Canonical graph choice: the existing tenant semantic graph.

Canonical models:

- `SemanticKnowledgeRecord`
- `SemanticEmbeddingIndex`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `SemanticMemoryQuery`
- `KnowledgeGraphSynthesisRun`

Important routes:

- `app/api/knowledge-graph/route.ts`
- `app/api/knowledge-graph/record/route.ts`
- `app/api/knowledge-graph/query/route.ts`

Important Phase 4 modules:

- `lib/ontology/semantic-graph-adapter.ts`
- `lib/ontology/semantic-graph-ingestion.ts`
- `lib/ontology/governed-ingestion.ts`
- `lib/governance/ingestion-governance.ts`
- `lib/governance/ingestion-audit.ts`

V1 freeze rule:

The canonical EV-KOS graph is the tenant semantic graph. Do not introduce a new graph system for Phase 4C.

## Governed Ingestion Layer

Governed ingestion sits between dry-run graph planning and future Prisma execution.

Current functions:

- `createSemanticGraphIngestionPlan(payload)`
- `resolveTemporaryNodeKeys(payload)`
- `validateIngestionPlan(plan)`
- `summarizeIngestionPlan(plan)`
- `validateGovernedIngestion(request)`
- `evaluateGovernanceRules(input)`
- `buildGovernedExecutionPlan(request)`
- `buildAuditRecord(request, plan)`
- `summarizeGovernedPlan(plan)`

Governance decisions:

- `ALLOW`
- `ALLOW_WITH_WARNING`
- `REQUIRES_REVIEW`
- `BLOCK`

Governed plans include:

- `riskScore`
- `duplicateRisk`
- `ontologyConfidence`
- `relationshipConfidence`
- `approvalRequired`
- `warnings`
- `errors`
- `writesToPrisma: false`
- `databaseAccess: false`

Phase 4B.5 defines governance, audit, and execution planning. It does not create transaction code.

## Governance And Approval Model

Human approval is required for:

- Graph ingestion decisions marked `REQUIRES_REVIEW`.
- Any future transition from dry-run to real writes.
- Risky executive actions.
- External sends, publishes, deletes, irreversible operations, or financial changes.
- Actions with low confidence or high duplicate risk.

Existing governance surfaces include:

- `app/api/ai/governance/route.ts`
- `app/api/ai/governance/approval/route.ts`
- `app/api/executive/action-approvals/route.ts`
- `app/api/governance-matrix/route.ts`
- `app/api/enterprise-governance/route.ts`

V1 principle:

Automation may propose. Governed systems decide whether approval is required. Humans approve risky execution.

## Memory Systems Inventory

| System | Models / Modules | V1 Role |
| --- | --- | --- |
| Simple AI memory | `AiMemory`, `src/lib/ai/memory-context.ts`, `app/api/ai/memory/route.ts` | Legacy/simple memory context and snapshots. |
| Article embeddings | `ArticleEmbedding`, `app/api/ai/embed-articles/route.ts` | Older article search/RAG store; not canonical graph. |
| Runtime memory | `RuntimeMemorySnapshot` | Runtime state snapshots; future producer to semantic graph. |
| Executive memory | `src/lib/executive/memory.ts`, `executive-memory.ts`, `business-memory.ts`, `decision-memory.ts` | Business/executive memory producer and consumer. |
| Learning memories | `CreatorLearningMemory`, `EvolutionMemory`, `InstitutionalEvolutionMemory`, `AgentMemory`, `VideoPerformanceMemory` | Specialized learning stores; future governed graph producers. |
| Semantic memory | `SemanticKnowledgeRecord`, `SemanticMemoryQuery` | Canonical EV-KOS memory target. |

## Graph Systems Inventory

| System | Models / Modules | V1 Role |
| --- | --- | --- |
| Legacy global graph | `KnowledgeNode`, `KnowledgeEdge`, `app/api/ai/knowledge-graph/build/route.ts` | Legacy system map and possible migration source. Not canonical. |
| Executive graph | `ExecutiveKnowledgeNode`, `ExecutiveKnowledgeEdge`, `src/lib/executive/knowledge-graph.ts` | Business/executive domain graph. Producer and consumer, not canonical EV-KOS graph. |
| Tenant semantic graph | `SemanticKnowledgeRecord`, `KnowledgeGraphNode`, `KnowledgeGraphEdge` | Canonical graph foundation. |
| Cognitive fabric | `CognitiveEntity`, `CognitiveRelation`, `CognitiveSynthesisRun`, `CognitiveInsight` | Synthesis and insight layer. Not canonical graph. |
| Reasoning graph outputs | `ReasoningSimulationRun`, `StrategicDecisionOption`, `DecisionConsequenceModel`, `ReasoningRecommendation` | Downstream reasoning artifacts. Not canonical graph. |
| Reinforcement memory graph agents | `lib/agents/reinforcement-memory-graph-agent.ts` | Agent experimentation surface. Not canonical graph. |

## Publishing Pipeline

Publishing-related surfaces:

- `app/api/pipeline/route.ts`
- `app/api/pipeline/auto-schedule/route.ts`
- `app/api/execution/research-pipeline/route.ts`
- `app/api/publishing/build-queue/route.ts`
- `app/api/publishing/update-status/route.ts`
- `app/api/publishing-command/route.ts`
- `app/admin/publishing/page.tsx`
- `lib/publishing/publication-guard.ts`

Publishing V1 rule:

Content should be source-grounded, review-gated, and traceable to research/audit evidence. Future publishing should read from canonical semantic graph records only after governed ingestion is proven.

## Agent And Executive Systems Overview

Executive systems live primarily under `src/lib/executive/` and `app/api/executive/`.

Major capabilities:

- boardroom and boardroom consensus
- daily, weekly, monthly, and quarterly review
- executive recommendations and alerts
- CFO, COO, revenue, delivery, client, and forecast intelligence
- goals, initiatives, planning cycles, scenarios, simulations
- decision packages, decision memory, decision execution, decision outcomes
- executive knowledge graph and graph intelligence
- autonomous review and automation action proposals

Agent systems live primarily under `lib/agents/` and `app/api/agents/`.

V1 boundary:

Agents and executive systems may produce signals, recommendations, and memory candidates. They should not bypass governance when writing to canonical memory or graph systems.

## API And Module Map

Ontology and graph preparation:

- `app/api/ontology/contract/route.ts`
- `app/api/ontology/semantic-graph-adapter/route.ts`
- `app/api/ontology/semantic-graph-ingestion/route.ts`
- `app/api/ontology/governed-ingestion/route.ts`
- `lib/ontology/types.ts`
- `lib/ontology/index.ts`
- `lib/ontology/semantic-graph-adapter.ts`
- `lib/ontology/semantic-graph-ingestion.ts`
- `lib/ontology/governed-ingestion.ts`

Canonical semantic graph:

- `app/api/knowledge-graph/route.ts`
- `app/api/knowledge-graph/record/route.ts`
- `app/api/knowledge-graph/query/route.ts`

Research:

- `app/api/research/*`
- `lib/research/*`

Governance:

- `lib/governance/ingestion-governance.ts`
- `lib/governance/ingestion-audit.ts`
- `app/api/ai/governance/*`
- `app/api/governance-matrix/*`
- `app/api/enterprise-governance/*`

Executive:

- `src/lib/executive/*`
- `app/api/executive/*`
- `app/admin/executive-*`

Publishing:

- `app/api/publishing/*`
- `app/api/publishing-command/*`
- `app/admin/publishing/*`
- `lib/publishing/publication-guard.ts`

## Database Model Map

Canonical semantic graph and memory:

- `SemanticKnowledgeRecord`
- `SemanticEmbeddingIndex`
- `KnowledgeGraphNode`
- `KnowledgeGraphEdge`
- `SemanticMemoryQuery`
- `KnowledgeGraphSynthesisRun`

Legacy graph:

- `KnowledgeNode`
- `KnowledgeEdge`

Executive graph:

- `ExecutiveKnowledgeNode`
- `ExecutiveKnowledgeEdge`

Cognitive fabric:

- `CognitiveEntity`
- `CognitiveRelation`
- `CognitiveSynthesisRun`
- `CognitiveInsight`

Reasoning:

- `ReasoningSimulationRun`
- `StrategicDecisionOption`
- `DecisionConsequenceModel`
- `ReasoningRecommendation`

Other memory:

- `ArticleEmbedding`
- `AiMemory`
- `RuntimeMemorySnapshot`
- creator, evolution, institutional, agent, and performance memory models

## Known Technical Debt

- Multiple graph systems coexist and need clear producer/consumer boundaries.
- `SemanticEmbeddingIndex` currently uses placeholder vector hash behavior, not full vector search.
- Executive graph edges use ids without full Prisma relation fields.
- Legacy global graph is not tenant-scoped.
- Ontology-to-graph entity deduplication is in-memory only.
- Governed audit records are objects, not persisted records.
- Approval metadata exists in governed plans but is not wired to a Phase 4C executor.
- Route naming can confuse executive graph, legacy graph, and canonical semantic graph.
- Some generated/cache behavior can require clearing `.next/dev` after route changes.

## Security And Safety Principles

- Default to dry-run for new graph ingestion.
- Never allow graph writes without validation and governance.
- Preserve human approval for risky actions.
- Keep source provenance and evidence metadata with graph candidates.
- Block low-confidence or structurally invalid ingestion.
- Prefer additive changes and rollback-friendly commits.
- Avoid broad refactors during phase transitions.
- Keep Prisma schema changes explicit, reviewed, and isolated.
- Do not let agent systems bypass governance.

## Rollback Strategy

Documentation-only rollback:

1. Remove this architecture spec.
2. Remove ADR files added in this freeze task.

Phase 4 rollback:

1. Disable future write routes first.
2. Keep read-only adapter, dry-run, and governed planning routes available for diagnosis.
3. Revert only the transaction executor if Phase 4C causes issues.
4. Avoid deleting source ontology or research records.
5. Preserve audit trail if persistence is later added.

No database rollback is needed for Phases 4A, 4B, or 4B.5 because they do not write to Prisma.

## Phase 4C Readiness Checklist

Before Phase 4C starts:

- [ ] Confirm `main` is clean and verified.
- [ ] Confirm canonical graph remains the tenant semantic graph.
- [ ] Confirm no new graph system is being introduced.
- [ ] Confirm governed ingestion decisions are understood.
- [ ] Add a dry-run-first executor contract.
- [ ] Require explicit `enableWrites` or equivalent write gate.
- [ ] Require approval for `REQUIRES_REVIEW`.
- [ ] Refuse `BLOCK` decisions.
- [ ] Resolve temporary node keys to real node ids inside a transaction.
- [ ] Define create vs upsert behavior.
- [ ] Define duplicate matching rules.
- [ ] Define rollback behavior.
- [ ] Define audit persistence only if schema is approved.
- [ ] Run build and smoke before any merge.

## Roadmap From Phase 4C To Phase 9

Phase 4C - Guarded Transaction Executor:

- Add dry-run-default execution service.
- Add explicit write gate.
- Add transaction boundaries.
- Add node/entity resolution.
- Keep review-required governance enforced.

Phase 4D - Canonical Graph Query Contracts:

- Standardize graph reads for records, nodes, edges, and semantic queries.
- Avoid direct consumer coupling to multiple graph systems.

Phase 5 - Autonomous Research:

- Let autonomous research agents propose ontology outputs.
- Govern all memory/graph writes.
- Preserve review-required publication gates.

Phase 6 - Multi-format Publishing:

- Generate article, video, podcast, book, course, and sermon packages from canonical knowledge records.
- Keep output traceable to sources and graph records.

Phase 7 - Multi-Agent Collaboration:

- Coordinate agents around canonical memory, task boundaries, and governance state.
- Prevent agents from writing directly to canonical graph stores.

Phase 8 - Learning And Optimization:

- Feed performance results back into governed memory proposals.
- Optimize discovery, extraction, publishing, and recommendations from audited outcomes.

Phase 9 - Knowledge Operating System:

- Consolidate graph, memory, governance, publishing, agent coordination, and learning into a coherent operating system.
- Keep the tenant semantic graph as the durable knowledge substrate unless a future ADR supersedes this decision.
