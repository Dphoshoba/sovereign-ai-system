# Executive Intelligence Service (EIS) — Design Document

**Date:** 2026-07-20
**Programme:** Outcome 1A — MenWise360 Operational Deployment

## Architecture

```
Gamma OS
      │
AI Workforce Platform
      │
Five Offices
      │
Executive Intelligence Service
      │
────────────────────────────
Dashboard · Email · Voice · Chat · Mobile
```

The EIS is a consumer of organizational capabilities. It never bypasses the Workforce Platform or reaches into office internals.

## Layers

```
Office Collectors
        │
        ▼
ExecutiveSnapshot
        │
        ▼
Executive Intelligence Engine
        │
        ▼
ExecutiveBriefing
        │
        ▼
Consumers (Dashboard, Email, etc.)
```

### Collectors
Only retrieve facts from each office via the Workforce Platform. No interpretation.

### ExecutiveSnapshot
Raw canonical representation of organizational state at a point in time. No opinions.

### Executive Intelligence Engine
Derives meaning: health, cross-office risks, recommendations, executive summaries.

## Core Queries (Read Models)

All queries operate on a single `ExecutiveSnapshot` — never trigger fresh collection independently.

```
refreshSnapshot()          → ExecutiveSnapshot
getOrganizationalHealth()  → status per office, aggregate
getTodayPriorities()       → priorities from Executive + Product offices
getActiveRisks()           → escalated risks across all offices
getBlockedItems()          → blockers per office
getPendingDecisions()      → items requiring human approval
getRecentChanges()         → changes since last snapshot
getKpiTrends()             → improving/declining metrics
getCeoBriefing()           → synthesized daily briefing (role = 'CEO')
getExecutiveBriefing(role) → role-specific briefing (extensible: CEO, COO, CTO, Board)
```

## ExecutiveBriefing Structure

```
ExecutiveBriefing
├── summary                  # one-line organizational state
├── organizationHealth       # health per office + aggregate
├── priorities               # what to focus on today
├── activeRisks              # escalated risks with severity
├── blockedItems             # blockers per office
├── pendingDecisions         # items requiring human approval
├── kpiTrends                # improving / declining metrics
├── recommendations          # what leadership should do next
├── officeStatus             # detailed status per office
│   ├── ExecutiveOffice
│   ├── ResearchOffice
│   ├── ProductOffice
│   ├── OperationsOffice
│   └── KnowledgeOffice
└── metadata
    ├── generatedAt
    ├── snapshotVersion
    ├── confidence
    └── sources
```

## Metadata on Every Insight

```typescript
{
  status: "Healthy",
  confidence: 0.98,
  generatedAt: 1721481600000,
  sources: ["Executive Office", "Operations Office"]
}
```

## Recommendations — First-Class Output

Not merely "there are N blockers" but "what should leadership do next."

```typescript
recommendations: [
  { priority: 'high', action: 'Escalate Product X deployment', reason: 'Blocked by Operations', office: 'Product Office' },
  { priority: 'medium', action: 'Review Research budget proposal', reason: 'Pending approval', office: 'Research Office' },
]
```

## Office Collectors

Each collector queries the Workforce Platform. Collectors are stateless — they only retrieve.

| Collector | Sources From |
|---|---|
| ExecutiveCollector | getAgent('EXEC-BRIEF-001'), getAgentTasks('EXEC-BRIEF-001') |
| ResearchCollector | getAgent('RES-COL-001'), evaluatePolicy |
| ProductCollector | getAgent('PROD-RMAP-001'), getAgentTasks |
| OperationsCollector | getAgent('OPS-DEPLOY-001'), getAgent('OPS-COMP-001') |
| KnowledgeCollector | getAgent('KNOW-HLTH-001'), getAgentTasks |

## Testing Strategy

Business scenario integration tests, not method-level unit tests:

- **Normal operation** — all offices healthy, briefing reflects that
- **Escalation** — blocker in one office appears in `getActiveRisks` and influences briefing
- **Cross-office dependency** — product delay caused by operations surfaces as linked concern
- **Governance** — pending approval appears consistently in `getPendingDecisions` and briefing
- **Recommendations** — synthesized correctly from cross-office state

## File Structure

```
lib/executive-intelligence/
├── collectors/
│   ├── executive-collector.ts
│   ├── research-collector.ts
│   ├── product-collector.ts
│   ├── operations-collector.ts
│   └── knowledge-collector.ts
├── intelligence-engine.ts
├── executive-snapshot.ts
├── executive-briefing.ts
└── types.ts

tests/executive-intelligence/
└── executive-intelligence.test.ts
```

## Dependency Direction (Enforced)

```
Gamma OS → Workforce Platform → Five Offices → EIS → Consumers
```

The EIS never imports from office internals directly. It only uses the public `WorkforcePlatform` interface.
