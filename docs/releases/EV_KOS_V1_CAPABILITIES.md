# EV-KOS V1 Capabilities

## Purpose

This document summarizes the capabilities included in the EV-KOS V1 release candidate freeze. It describes what the system can model, preview, validate, and govern without enabling high-risk execution.

## Platform Capabilities

- Next.js application foundation with public, admin, API, and documentation surfaces.
- Prisma-backed application models already present in the platform.
- Production URL and local development URL conventions documented.
- Release readiness, production readiness, security readiness, observability readiness, and enablement reporting.

## Research Capabilities

- Source-grounded research pipeline.
- Category-aware source fallback.
- Evidence registry.
- Fact extraction.
- Bible-specific extraction.
- Claim verification and consensus grouping.
- Best-score consensus theme classification.
- Citation construction.
- Publication gate and review-required posture.
- Research audit persistence from earlier phases.

## Domain Intelligence Capabilities

Supported V1 domains through ontology contracts:

- `ai-tools`
- `bible-stories`
- `history`
- `health`
- `space`
- `motivation`
- `business`
- `creators`

The domain intelligence layer can classify and normalize domain categories, ontology entity types, ontology relationship types, ontology extraction results, and semantic graph-compatible shapes.

## Ontology Capabilities

- Universal ontology contract under `lib/ontology`.
- Shared entity and relationship types.
- Domain category normalization.
- Domain-specific ontology type mapping.
- Ontology-to-semantic-graph shape mapping.
- Read-only contract examples.

## Semantic Graph Preparation Capabilities

- Existing tenant semantic graph selected as canonical.
- Ontology adapter creates write-ready semantic graph payloads.
- Dry-run ingestion plans resolve temporary node keys in memory.
- Governed ingestion evaluates risk, duplicate risk, ontology confidence, relationship confidence, warnings, errors, and approval requirements.
- Transaction executor interface previews writes and blocks unsafe execution.
- Controlled explicit test-write boundary exists from Phase 4C and remains gated.
- Cleanup preview route identifies controlled test-write data without deleting it.

## Entity Resolution And Review Capabilities

- Entity name normalization.
- Entity fingerprinting.
- Relationship fingerprinting.
- Similarity scoring.
- Resolution outcomes: `CREATE_NEW`, `MATCH_EXISTING`, `POSSIBLE_DUPLICATE`, `BLOCK_CONFLICT`.
- Review queue item construction.
- Review package creation using existing authorization package shape.
- Review decision preparation.
- Graph write readiness checks.

## Mission Capabilities

- Autonomous research mission lifecycle contracts.
- Mission planning.
- Topic discovery scoring.
- Research prioritization.
- Mission readiness scoring.
- Mission dashboard summaries.
- Read-only integration from mission planning through graph transaction preview.

## Content Orchestration Capabilities

- Campaign orchestration framework.
- Master brief contract.
- Channel planner.
- Content lineage contract.
- Content readiness scoring.
- Draft generation contracts.
- Asset prompt contracts.
- Draft readiness statuses.
- Governed draft preview packets.
- Campaign preview dashboard.

Supported campaign asset types:

- Article
- Newsletter
- LinkedIn
- X / Twitter
- Threads
- Facebook
- YouTube script
- Shorts script
- Podcast outline
- Presentation outline
- Lead magnet
- Email campaign

## Operator Capabilities

- Read-only EV-KOS operator dashboard.
- Operator action registry.
- Operator action preview.
- Operator action validation.
- Operator production readiness audit.
- Operator intent and audit contract.
- Optional controlled operator intent package creation only, with no action execution.

Supported preview actions:

- Start Research Mission
- Refresh Readiness
- Prepare Draft Preview
- Build Review Package
- Validate Campaign
- Prepare Publication
- View Graph Readiness
- View Mission Health

## Production And Release Capabilities

- Production readiness audit.
- Security audit.
- Environment audit.
- API audit.
- Deployment readiness audit.
- Operator security contracts.
- Rate-limit policy definitions.
- Startup validation planning.
- Observability contracts.
- Guardrail readiness contracts.
- HTTP negative-test contracts.
- Release validation scorecard.
- Production enablement plan.

## Safety Capabilities

The V1 release candidate explicitly reports and preserves these safety flags:

- No automatic execution.
- No automatic OpenAI calls.
- No automatic graph writes.
- No graph deletes.
- No automatic publishing.
- No social posting.
- No automatic approvals.
- No auth provider integration.
- No sessions.
- No JWT.

