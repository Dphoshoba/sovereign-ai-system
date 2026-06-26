# EV-KOS Master Development Plan V1.0

## Status

Status: Planning baseline

Date: 2026-06-26

This document defines the master engineering roadmap for the remaining EV-KOS build after the V1 architecture freeze. It is documentation only. It does not authorize source-code behavior changes, Prisma schema changes, migrations, database writes, or Phase 4C implementation.

## 1. Current State Assessment

EV-KOS currently has a stable foundation for source-grounded research, ontology contracts, semantic graph preparation, dry-run ingestion, governed planning, and architecture documentation.

Current strengths:

- The source-grounded research pipeline is active.
- Category-aware source fallback and extraction paths are in place.
- Bible extraction and Bible consensus themes are supported.
- The consensus engine uses best-score theme classification.
- Research audit and review-required governance are preserved.
- The universal ontology contract exists under `lib/ontology`.
- The tenant semantic graph has been selected as canonical.
- Semantic graph adapter payloads are available.
- Dry-run semantic graph ingestion planning exists.
- Governed ingestion planning returns risk, duplicate, confidence, approval, warnings, errors, and audit objects.
- The EV-KOS V1 architecture specification and initial ADR library are merged to `main`.

Current constraints:

- There is no Phase 4C transaction executor yet.
- Graph writes are not enabled from ontology payloads.
- Entity resolution is in-memory only.
- Audit records are not persisted.
- Review-required governed ingestion is not wired to an admin approval workflow.
- Real vector embeddings and vector search are not yet implemented.

## 2. Completed Phases And Milestones

| Phase | Status | Milestones |
| --- | --- | --- |
| Phase 0 - Platform Foundation | Complete | Next.js app, Prisma, admin/public surfaces, core infrastructure. |
| Phase 1 - Governance and Review | Complete | Review gates, publication constraints, governance posture. |
| Phase 2 - Research Pipeline | Complete | Source collection, evidence registry, fact extraction, verification, citations. |
| Phase 3 - Domain Intelligence | In progress | Category-aware fallback, AI extractor, Bible extractor, consensus themes, graceful image failures, audit persistence. |
| Phase 3.5 - Universal Knowledge Ontology | Complete | Domain ontology contract, entity/relationship types, semantic graph shape mapper. |
| Phase 4A - Semantic Graph Adapter | Complete | Ontology outputs convert to write-ready semantic graph payloads. |
| Phase 4B - Dry-run Ingestion | Complete | Temporary node keys resolve in memory and produce dry-run write plans. |
| Phase 4B.5 - Governed Ingestion Architecture | Complete | Governance decisions, risk scoring, audit object, read-only examples. |
| EV-KOS V1 Architecture Freeze | Complete | Definitive architecture spec and ADR library created. |

## 3. Remaining Phase Map

### Phase 4C - Guarded Transaction Executor

Purpose:

Add the first real persistence boundary for governed semantic graph ingestion.

Scope:

- Create a transaction executor that accepts governed plans.
- Default to dry-run.
- Require explicit write enablement.
- Refuse `BLOCK`.
- Require approval metadata for `REQUIRES_REVIEW`.
- Create records, nodes, and edges in one transaction.
- Preserve audit output.

Do not:

- Add broad route rewrites.
- Replace the existing knowledge graph API.
- Introduce a new graph system.
- Add real embeddings yet.

### Phase 4D - Entity Resolution And Upserts

Purpose:

Prevent duplicate canonical graph entities and support stable graph growth.

Scope:

- Define entity matching rules.
- Add deterministic node identity strategy.
- Decide create vs upsert behavior.
- Resolve duplicate names, aliases, source ids, and ontology ids.
- Add test cases for duplicate and near-duplicate entities.

### Phase 4E - Persisted Ingestion Audit And Approval Flow

Purpose:

Persist governed ingestion decisions and connect review-required plans to human approval.

Scope:

- Propose audit schema only after design approval.
- Add persisted audit records if approved.
- Add admin review surface for `REQUIRES_REVIEW`.
- Store approval metadata.
- Make future write execution check approval state.

### Phase 5 - Autonomous Research Missions

Purpose:

Allow agents to propose source-grounded research missions that feed ontology and governed graph ingestion.

Scope:

- Mission planning.
- Source discovery.
- Evidence collection.
- Ontology output proposals.
- Governed ingestion dry-run by default.
- Human review for mission publication or graph writes.

### Phase 6 - Multi-format Publishing

Purpose:

Generate multiple publishable formats from canonical knowledge records.

Formats:

- Article
- Video
- Podcast
- Book
- Course
- Sermon

Scope:

- Format-specific planners.
- Source and graph traceability.
- Review gates.
- Publishing queue integration.

### Phase 7 - Multi-Agent Collaboration

Purpose:

Coordinate specialist agents around canonical memory, graph state, and governed tasks.

Scope:

- Agent roles and permissions.
- Task handoff protocol.
- Shared memory read contracts.
- Governed write proposals.
- Conflict resolution and review-required escalation.

### Phase 8 - Learning And Optimization

Purpose:

Use performance, feedback, and outcomes to improve research, publishing, recommendations, and agent behavior.

Scope:

- Outcome tracking.
- Performance memory proposals.
- Recommendation improvement loops.
- Safe prompt and workflow optimization.
- Governed learning writes.

### Phase 9 - Unified EV-KOS Command System

Purpose:

Unify graph, memory, governance, publishing, agents, executive operations, and learning into one operating system interface.

Scope:

- Operator dashboard.
- Cross-system command routing.
- Unified approval queue.
- Memory and graph command center.
- System health and rollback controls.

## 4. Phase Dependencies

```text
Phase 4C depends on:
  - Phase 4A semantic graph adapter
  - Phase 4B dry-run ingestion
  - Phase 4B.5 governed ingestion
  - V1 architecture freeze

Phase 4D depends on:
  - Phase 4C guarded executor

Phase 4E depends on:
  - Phase 4C executor
  - Phase 4D entity resolution decisions

Phase 5 depends on:
  - Phase 4C write path or dry-run-only fallback
  - governance and review controls

Phase 6 depends on:
  - canonical graph read stability
  - publishing review gates

Phase 7 depends on:
  - governed memory and graph write proposals
  - agent permission boundaries

Phase 8 depends on:
  - persisted outcomes and feedback loops
  - governed learning proposals

Phase 9 depends on:
  - stable graph, memory, governance, publishing, agent, and learning layers
```

## 5. Exit Criteria For Every Phase

| Phase | Exit Criteria |
| --- | --- |
| 4C | Governed plans can execute real graph writes only when explicitly enabled; dry-run remains default; `BLOCK` refused; `REQUIRES_REVIEW` requires approval; build and smoke pass. |
| 4D | Entity resolution rules are documented and tested; duplicate handling works for create/upsert paths; no broad graph route refactors. |
| 4E | Audit persistence and approval flow are approved, implemented, and verified; review-required plans cannot bypass approval. |
| 5 | Autonomous research missions can produce governed ontology proposals without direct graph writes or publication bypass. |
| 6 | Multi-format outputs are generated from source-grounded knowledge with review gates and traceability. |
| 7 | Agents can collaborate through explicit contracts and cannot bypass governed write boundaries. |
| 8 | Learning loops produce measurable, reviewable improvements without unsafe self-modification. |
| 9 | Unified command system can inspect, route, approve, and monitor EV-KOS operations from one controlled surface. |

## 6. Testing Requirements For Every Phase

Baseline for every phase:

- `npm.cmd run build`
- `npm.cmd run smoke:v1`
- Verify `git status --short --branch`
- Confirm no unrelated files changed
- Confirm no unapproved Prisma schema changes

Additional phase-specific tests:

| Phase | Required Tests |
| --- | --- |
| 4C | Dry-run plan test, explicit write gate test, block refusal test, review-required approval test, transaction rollback test. |
| 4D | Duplicate entity test, alias matching test, upsert idempotency test, edge reference resolution test. |
| 4E | Audit creation test, approval state test, reviewer metadata test, unauthorized approval rejection test. |
| 5 | Mission dry-run test, source provenance test, no-direct-write test, review-required mission test. |
| 6 | Format generation tests, citation traceability tests, review gate tests, publishing queue tests. |
| 7 | Agent handoff tests, permission boundary tests, conflict resolution tests, governance escalation tests. |
| 8 | Outcome ingestion tests, learning proposal tests, regression prevention tests, no-unsafe-self-change tests. |
| 9 | Command routing tests, approval queue tests, dashboard health tests, rollback control tests. |

## 7. Merge Requirements

Every phase branch must satisfy:

- Branch name starts with `codex/`.
- Scope is narrow and matches the approved task.
- Build passes.
- Smoke passes.
- No unrelated refactors.
- No unapproved schema changes.
- No unapproved database writes.
- Final report includes files changed, verification, risk, and next step.
- Merge to `main` only after explicit user approval.
- Push branch before merge when requested.
- Push `main` after merge when approved.

## 8. Rollback Strategy

General rollback:

- Prefer reverting the smallest phase commit.
- Preserve audit and source records unless explicitly approved for removal.
- Disable write routes before removing read-only planning tools.
- Keep dry-run routes available for diagnosis.
- Re-run build and smoke after rollback.

Phase-specific rollback:

- 4C: disable executor write flag; keep governed planning.
- 4D: revert entity resolution logic; preserve raw graph records.
- 4E: disable approval write execution; preserve audit history.
- 5: pause autonomous missions; keep manual research pipeline.
- 6: pause multi-format publishing; keep article publishing path.
- 7: disable agent collaboration writes; keep read-only agent summaries.
- 8: pause learning updates; keep outcome records.
- 9: disable unified command execution; keep underlying APIs.

## 9. Risk Register

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Canonical graph pollution | High | Governed ingestion, dry-run default, approval gates, rollback. |
| Duplicate entities | High | Phase 4D entity resolution and upsert rules. |
| Unsafe database writes | High | Explicit write gate, transaction boundaries, review-required approvals. |
| Graph system confusion | Medium | ADRs, architecture spec, clear producer/consumer boundaries. |
| Audit gaps | Medium | Phase 4E persisted audit and approval flow. |
| Agent bypass of governance | High | Permission boundaries and no direct graph write access. |
| Publishing unsupported claims | High | Preserve source-grounded research and publication gates. |
| Overbuilding too early | Medium | One phase at a time; no broad refactors. |
| Build/static generation regressions | Medium | Build after each slice; watch Next generated cache behavior. |
| Vector search premature integration | Medium | Delay real embeddings/vector search until graph write path is stable. |

## 10. Definition Of Done

A phase is done only when:

- The approved scope is implemented.
- Hard rules are followed.
- Build passes.
- Smoke passes.
- Source/schema/database boundaries are confirmed.
- Documentation is updated if architecture changes.
- Branch is pushed if requested.
- Merge happens only after approval.
- Final report is provided.

## 11. Estimated Effort By Phase

| Phase | Effort | Notes |
| --- | --- | --- |
| 4C | Medium | First real guarded graph writes; high care required. |
| 4D | Medium to High | Entity resolution can grow complex quickly. |
| 4E | Medium | May require schema and admin UI if approved. |
| 5 | High | Autonomous research requires careful mission boundaries. |
| 6 | High | Multiple formats and review gates. |
| 7 | High | Agent coordination, permissions, conflict handling. |
| 8 | High | Learning loops require outcome instrumentation. |
| 9 | Very High | Unified command system across all EV-KOS layers. |

## 12. Recommended Build Order

1. Phase 4C guarded transaction executor.
2. Phase 4D entity resolution and upserts.
3. Phase 4E persisted ingestion audit and approval flow.
4. Canonical graph read/query hardening.
5. Phase 5 autonomous research missions.
6. Phase 6 multi-format publishing.
7. Phase 7 multi-agent collaboration.
8. Phase 8 learning and optimization.
9. Phase 9 unified EV-KOS command system.

## 13. What Must Not Be Built Yet

Do not build yet:

- A new graph system.
- Broad graph route rewrites.
- Real embeddings or vector search.
- Automatic graph writes without approval gates.
- Autonomous publishing without review.
- Agent direct-write paths into canonical graph tables.
- Persisted audit schema without explicit approval.
- Phase 9 command center before graph, governance, and learning foundations are stable.
- Client workspace expansion before tenant semantic graph write paths are stable.

## 14. Future Expansion Ideas

Real embeddings:

- Replace placeholder vector hash behavior with real embedding generation after graph writes are stable.

External connectors:

- Add governed connectors for email, calendar, CRM, payments, publishing platforms, and knowledge sources.

Plugin system:

- Allow domain packages to add ontology extractors, publishing formats, and connectors under governance.

Vector search:

- Add semantic retrieval over canonical records once embeddings are real and indexed.

Sermon, course, and book generation:

- Generate long-form structured formats from canonical graph records and source-grounded research.

Client workspace support:

- Expand tenant/workspace graph use for clients once canonical ingestion is stable.

Operator dashboard:

- Build a unified dashboard for graph health, memory health, ingestion decisions, approval queues, agent status, and rollback controls.

## 15. Recommended Next Engineering Task

After this plan is reviewed and approved, the next engineering task should be:

Phase 4C - Guarded Transaction Executor.

Recommended first slice:

- Add a dry-run-default executor interface.
- Refuse writes unless an explicit write flag is present.
- Refuse `BLOCK`.
- Require approval metadata for `REQUIRES_REVIEW`.
- Return a transaction preview before any Prisma write code is introduced.

The first Phase 4C slice should still be small, reversible, and verified with build and smoke before merge.
