# 0002 - Universal Ontology Contract

## Title

Use a universal ontology contract before semantic graph mapping.

## Status

Accepted

## Context

EV-KOS must support many domains without rewriting the research and graph pipeline for every category. Current supported domains include AI tools, Bible stories, history, health, space, motivation, business, and creators.

## Decision

EV-KOS V1 defines a reusable ontology contract under `lib/ontology`. Domain outputs use shared entities, relationships, themes, confidence values, and metadata before being adapted to semantic graph payloads.

The ontology layer is a contract and transformation layer. It does not write to Prisma.

## Consequences

- New domains should define ontology behavior rather than bypassing the pipeline.
- Semantic graph writes can be governed uniformly.
- Domain-specific extraction can evolve without changing canonical graph models.
- Mapping decisions remain inspectable and testable through read-only routes.

## Alternatives considered

- Hard-code every category directly into graph writes: rejected because it does not scale.
- Let each domain define its own graph schema: rejected because it fragments EV-KOS memory.
- Write extractor outputs directly to Prisma: rejected because it bypasses validation and governance.

## Date

2026-06-26
