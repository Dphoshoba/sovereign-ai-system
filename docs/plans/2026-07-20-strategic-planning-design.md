# Era 5 Phase 6 — Strategic Planning Design

**Decision ID:** ERA5-P6-DESIGN-2026-001  
**Date:** 2026-07-20  
**Status:** APPROVED

---

## Architectural Context

Phase 6 is the final phase of the Enterprise Scale programme. It is a **synthesis layer** — it consumes outputs from all prior phases rather than introducing new operational subsystems.

```
Portfolio Intelligence (P1)
Enterprise Metrics (P2)
Resource Allocation (P3)
Cross-Product Dependencies (P4)
Organizational Learning (P5)
        │
        ▼
Strategic Planning Engine
├── Scenario Registry
├── Assumption Registry
├── Scenario Evaluator
├── Trade-off Engine
├── Roadmap Builder
└── Executive Planning Brief
```

The engine **evaluates strategy; it does not select it.** Selection remains an executive decision.

---

## Core Philosophy

Evidence → Assumptions → Scenario → Evaluation → Comparison → Roadmap

- Strategic planning is scenario comparison, not plan imposition
- Every scenario exposes both evidence and explicit assumptions
- Evaluation is deterministic and reproducible
- Recommendations remain advisory

---

## Assumption Registry

Dedicated, first-class, versioned entities.

```
StrategicAssumption
├── id, type, title, description
├── version (immutable history)
├── evidenceIds (traceability)
├── confidence (0–1)
├── statement (the assumption itself)
├── invalidationCriteria (what would disprove it)
├── affectedProductIds
├── affectedInitiativeIds
├── status (active, invalidated, superseded)
├── createdAt, lastValidated
```

**Invariant:** Every `ScenarioEvaluation` records the exact version of every assumption used during evaluation, preserving deterministic replay.

---

## Scenario Registry

Immutable, versioned strategic scenarios.

```
StrategicScenario
├── id, title, description, version
├── thesis (what this scenario optimizes for)
├── assumptionIds (references to assumption versions)
├── evidenceIds (traceability)
├── initiativeIds (proposed initiatives)
├── productIds (affected products)
├── status (draft, proposed, evaluated, superseded, archived)
├── evaluationProfile (which profile to use for scoring)
├── createdAt, createdBy
```

Scenarios are never edited in place — mutations create new versions.

---

## Evaluation Dimensions

Fixed canonical dimensions:

| Dimension | Description |
|---|---|
| `strategicAlignment` | How well does this align with enterprise goals? |
| `resourceUtilization` | How efficient is capacity/demand balance? |
| `dependencyRisk` | What cross-product dependency issues exist? |
| `governanceImpact` | What governance changes are required? |
| `implementationComplexity` | How difficult to execute? |
| `organizationalConfidence` | How much confidence does the organization have? |
| `expectedBenefit` | What is the projected outcome? |

Each dimension is scored 0–1, evidence-backed.

---

## Evaluation Profiles

Configurable weights for the fixed dimensions. Same evidence + same assumption versions + same evaluation profile = identical evaluation.

```
Growth Profile:      Benefit 30%, Alignment 25%, Resources 15%, Risk 10%, Governance 10%, Complexity 5%, Confidence 5%
Stability Profile:   Benefit 10%, Alignment 15%, Resources 20%, Risk 25%, Governance 20%, Complexity 5%, Confidence 5%
Efficiency Profile:  Benefit 15%, Alignment 10%, Resources 30%, Risk 10%, Governance 10%, Complexity 15%, Confidence 10%
Balanced Profile:    All dimensions ~14.3% each
```

---

## Scenario Evaluator

Evaluates one scenario against one evaluation profile.

```
evaluateScenario(scenario, assumptions, profile) → ScenarioEvaluation
  ├── dimensionScores: Record<Dimension, number>
  ├── weightedScore: number
  ├── assumptionVersions: Map<assumptionId, version>
  ├── evidenceSummary
  ├── evaluationTimestamp
  └── evaluationProfileId
```

Separate from comparison — one scenario, one evaluation.

---

## Trade-off Engine

Compares evaluated scenarios, exposing **why** scores differ.

```
compareScenarios(evaluations) → TradeOffComparison
  ├── scenarioA/B/C: { overallScore, strengths, weaknesses }
  ├── dimensionComparison: per-dimension delta
  ├── keyTradeOffs: human-readable trade-off descriptions
  └── confidenceSummary
```

Strengths and weaknesses are derived from dimension scores:
- Strength: dimension ≥ 0.7
- Weakness: dimension ≤ 0.3

Exposes reasoning: "Scenario A +Highest expected benefit -Largest dependency risk"

---

## Scenario Risk Model

Explicit risk categories (not collapsed into one aggregate):

```
ScenarioRisk
├── category: capacity | dependency | governance | metric | knowledge | execution
├── evidence: string[]
├── severity: low | medium | high | critical
├── affectedInitiatives: string[]
├── mitigationOptions: string[]
├── source (which prior phase raised this risk)
```

---

## Roadmap Builder

Roadmaps are derived from scenarios, not authored independently.

```
Scenario → Prioritized initiatives → Dependencies → Capacity → Timeline → Roadmap
```

Roadmap status lifecycle: `draft → proposed → approved → superseded → archived`

The engine generates only `draft` and `proposed` roadmaps. Approval is an executive action.

```
EnterpriseRoadmap
├── id, scenarioId, title, description
├── status (draft, proposed, approved, superseded)
├── version
├── phases: RoadmapPhase[]
│   ├── order, title, description
│   ├── initiativeIds
│   ├── dependencyIds
│   ├── estimatedCapacity
│   └── startAfter
├── createdAt
├── evidenceIds
```

---

## Executive Planning Brief

Integrated into `PortfolioBriefing` as `strategicPlanning`:

```
ExecutivePlanningBrief
├── enterpriseSummary: string
├── strategicScenarios: StrategicScenario[]
├── assumptions: StrategicAssumption[]
├── evaluationProfiles: EvaluationProfile[]
├── tradeOffComparisons: TradeOffComparison[]
├── recommendedRoadmaps: EnterpriseRoadmap[]
├── risks: ScenarioRisk[]
├── confidenceAnalysis: ConfidenceAnalysis
├── requiredExecutiveDecisions: ExecutiveDecision[]
└── supportingEvidence: string[]
```

---

## StrategicPlanningEngine

```
class StrategicPlanningEngine {
  // Assumption Registry
  registerAssumption(a): void
  getAssumption(id, version?): StrategicAssumption
  getAssumptionHistory(id): StrategicAssumption[]
  invalidateAssumption(id, reason): void

  // Scenario Registry
  registerScenario(s): void
  getScenario(id, version?): StrategicScenario
  registerScenarioVersion(s): void

  // Evaluation
  evaluateScenario(scenarioId, profileId): ScenarioEvaluation
  compareScenarios(evaluationIds): TradeOffComparison

  // Roadmap
  buildRoadmap(scenarioId, phases): EnterpriseRoadmap
  getRoadmap(id): EnterpriseRoadmap

  // Briefing
  buildExecutivePlanningBrief(): ExecutivePlanningBrief
}
```

---

## PortfolioEngine Integration

```typescript
private readonly planningEngine = new StrategicPlanningEngine();

// Register methods:
registerAssumption(a): void
registerScenario(s): void

// In analyze():
const planningSection = this.planningEngine.buildExecutivePlanningBrief();

// Returned:
strategicPlanning: planningSection,
```

---

## Guardrails

- No automatic strategic execution
- Every recommendation references supporting evidence
- Every scenario records explicit assumptions with versions
- Assumptions are versioned and independently invalidatable
- Scenario evaluation is deterministic
- Roadmaps are reproducible from same inputs
- Certified Phases 1–5 unchanged
- Sixth-product extensibility preserved
- Advissory-only — never select a scenario automatically

---

## Test Coverage

| Milestone | Tests |
|---|---|
| Assumption Registry — immutable, versioned, validation | 4+ |
| Scenario Registry — immutable, versioned, assumption references | 4+ |
| Scenario Evaluator — deterministic scoring with profiles | 4+ |
| Trade-off Engine — comparison, strengths/weaknesses | 4+ |
| Roadmap Builder — phased roadmap generation | 3+ |
| Executive Planning Brief — PortfolioBriefing integration | 3+ |

Target: 22+ tests, zero regression in existing 196 tests.
