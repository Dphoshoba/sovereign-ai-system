# 0001 - Canonical Semantic Graph

## Title

Use the existing tenant semantic graph as the canonical EV-KOS graph.

## Status

Accepted

## Context

The codebase contains multiple graph-like systems: the legacy global graph, the executive knowledge graph, the cognitive fabric, reasoning outputs, and the newer tenant semantic graph. Phase 4 requires a canonical target for ontology-derived knowledge without adding another graph layer.

## Decision

EV-KOS V1 uses the existing tenant semantic graph as the canonical graph foundation. The canonical persisted graph is composed of `SemanticKnowledgeRecord`, `KnowledgeGraphNode`, `KnowledgeGraphEdge`, `SemanticMemoryQuery`, and `KnowledgeGraphSynthesisRun`.

Other graph systems remain producers, consumers, or legacy migration sources.

## Consequences

- Phase 4C must write only to the tenant semantic graph.
- Executive graph and cognitive fabric behavior are preserved.
- Legacy graph data can be migrated later through governed ingestion.
- Route and admin naming must clearly distinguish canonical graph from executive and legacy graph systems.

## Alternatives considered

- Create a new EV-KOS graph schema: rejected because it would duplicate existing tenant semantic graph models.
- Promote the executive graph: rejected because it is domain-specific.
- Promote the legacy global graph: rejected because it is not the current tenant-scoped semantic graph.
- Use cognitive fabric as canonical graph: rejected because it is an insight/synthesis layer.

## Date

2026-06-26
