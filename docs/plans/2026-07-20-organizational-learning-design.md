# Era 5 Phase 5 — Organizational Learning Design

**Approved:** ERA5-P5-DESIGN-2026-001  
**Date:** 2026-07-20  
**Status:** APPROVED

---

## Architectural Context

Phase 5 continues the compositional pattern established through Phases 1–4:

```
ExecutiveIntelligence
        │
PortfolioEngine
    ├── Portfolio Intelligence (Phase 1)
    ├── Enterprise Metrics (Phase 2)
    ├── Resource Allocation (Phase 3)
    ├── Cross-Product Coordination (Phase 4)
    └── Organizational Learning (Phase 5)
```

The enterprise progression: *Observe → Measure → Advise → Coordinate → Learn → Plan*

---

## Enterprise Knowledge Lifecycle

```
Operational Evidence
        │
        ▼
  Learning Registry
        │
        ▼
   Pattern Engine
        │
        ▼
Knowledge Promotion
        │
        ▼
Validation Registry
        │
        ▼
Approved Enterprise Standards
        │
        ▼
Executive Learning Brief
```

---

## Learning Registry — 7 Immutable Artifact Types

Each is an independent knowledge class (not a lifecycle stage):

| Type | Description | Creation Path |
|---|---|---|
| **Lesson** | Raw observation from a product/initiative | Direct submission |
| **Pattern** | Multiple corroborating lessons | Pattern Detection |
| **Playbook** | Approved actionable procedure | Promotion from Pattern |
| **WorkflowTemplate** | Reusable workflow definition | Promotion or direct |
| **GovernancePattern** | Governance refinement for enterprise use | Promotion from Pattern |
| **BestPractice** | Recommended practice (advisory) | Promotion or direct |
| **ExecutiveInsight** | Executive-level strategic observation | Generated independently |

### Common Metadata

Every artifact carries:
- `id` — unique identifier
- `type` — one of the 7 types
- `title`, `description` — human-readable
- `status` — `draft`, `candidate`, `approved`, `superseded`, `archived`
- `version` — monotonically increasing integer
- `evidenceIds` — references to originating evidence
- `supersedes` / `supersededBy` — version chain
- `confidence` — 0–1 score
- `productCoverage` — applicable products
- `initiativeCoverage` — originating initiatives
- `createdAt`, `lastValidated` — timestamps
- `approvedBy`, `approvedAt` — promotion audit trail
- `rationale` — why the artifact exists or was promoted

---

## Branching Promotion Model

```
Lesson
  │
  ▼
Pattern
  │
  ├──────────────┐
  ▼              ▼
Playbook      GovernancePattern
  │              │
  ├──────┐       │
  ▼      ▼       ▼
Workflow  Best  Enterprise
Template  Practice  Standard
```

**ExecutiveInsight** is generated independently — it influences decisions but does not become a standard.

**Rules:**
- No automatic promotion — every transition requires explicit approval
- Each promotion records: originating evidence, approving authority, timestamp, superseded artifact, rationale
- Superseded versions are preserved (immutable history)

---

## Validation Registry

Every approved artifact exposes:

| Field | Description |
|---|---|
| `validationStatus` | `current`, `needs_review`, `declining`, `superseded` |
| `lastValidated` | Timestamp of last validation |
| `validationHistory` | Array of {timestamp, status, reviewer, rationale} |
| `validationConfidence` | 0–1 score based on evidence freshness |

This ensures knowledge ages gracefully rather than being treated as permanently correct.

---

## OrganizationalLearningEngine — 5 Capabilities

| Capability | Responsibility |
|---|---|
| **Consolidation** | Merge duplicate/related lessons into a single record |
| **Pattern Detection** | Identify repeated observations → candidate patterns |
| **Recommendation Synthesis** | Generate evidence-backed improvement proposals |
| **Knowledge Promotion** | Manage approval lifecycle (status transitions) |
| **Version Management** | Preserve history, track supersession chains |

---

## Learning Briefing Section

```
LearningBriefingSection
├── newLessons: LearningArtifact[]
├── emergingPatterns: LearningArtifact[]
├── promotionCandidates: LearningArtifact[]
├── recentlyApprovedStandards: LearningArtifact[]
├── governanceRefinements: LearningArtifact[]
├── validationAlerts: ValidationAlert[]
├── supersededStandards: LearningArtifact[]
└── executiveRecommendations: InsightRecommendation[]
```

Integrated into `PortfolioBriefing` as `learning: LearningBriefingSection`.

---

## PortfolioEngine Integration

```typescript
private readonly learningEngine = new OrganizationalLearningEngine();

// Register methods delegate:
registerLesson(record: LearningArtifact): void { ... }
registerLessons(records: LearningArtifact[]): void { ... }

// In analyze():
const learningSection = this.learningEngine.buildLearningBriefing();

// Returned in briefing:
learning: learningSection,
```

---

## Guardrails

- Immutable artifacts (version on change, never overwrite)
- Explicit evidence lineage on every artifact
- No automatic promotion
- Superseded versions preserved and queryable
- Recommendations remain advisory
- Zero platform modifications
- Existing certified Phases 1–4 unchanged
- Sixth product requires registration only

---

## Test Coverage

Milestones:
1. **Learning Registry** — 7 artifact types, immutable version history, evidence lineage
2. **Pattern Detection** — deterministic consolidation, repeated observation detection
3. **Promotion Workflow** — branching paths, approval requirements, rejection without evidence
4. **Validation Registry** — state transitions, aging, alerts
5. **Portfolio Briefing Integration** — section appears, sixth-product extensibility

Target: 20+ tests, zero regression in existing 175 tests.
