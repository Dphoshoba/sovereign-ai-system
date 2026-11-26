# Executive Decision Support Architecture

> Milestone 3 design reference — defines scoring philosophy, ranking rules, delta model, pattern model, and the Intelligence/Analysis Engine split.

## 1. Design Principles

| Principle | Meaning |
|-----------|---------|
| **Deterministic** | Same snapshot + same rules = same output. No randomness, no ML, no hidden state. |
| **Evidence-based** | Every ranking, recommendation, or detection must trace to specific data in the snapshot or history. |
| **Traceable** | Each scored item carries a `rationale: string[]` listing the exact signals that influenced it. |
| **Auditable** | The EDSS logs every analysis run: inputs, intermediate scores, final rankings. |
| **Composable** | Each capability is a pure function `(snapshot, history?) => Result` that can be tested independently. |

## 2. Architecture

```
Office Collectors  (5 stateless collectors — unchanged)
       │
       ▼
ExecutiveSnapshot  (immutable — unchanged)
       │
       ▼
ExecutiveIntelligence Engine  (synthesis, query — extended with delta methods)
       │
       ▼
ExecutiveAnalysisEngine  (NEW — priorities, risks, patterns, recommendations)
       │
       ▼
ExecutiveBriefing  (enriched — ranked priorities, scored risks, deltas, patterns)
```

### Responsibilities

**Intelligence Engine** (existing, extended):
- Build and cache snapshots
- Synthesize `ExecutiveBriefing` from snapshot + analysis
- Provide public query API (`getCeoBriefing`, `getExecutiveBriefing(role)`)
- Immutable snapshot management

**Analysis Engine** (new):
- Organizational Priority Engine (Capability 1)
- Risk Intelligence enrichment (Capability 2)
- Organizational Delta Engine (Capability 3) — requires historical snapshot
- Structured Recommendation Engine (Capability 4)
- Organizational Pattern Detection (Capability 5) — requires historical data

## 3. Scoring Philosophy

All scores are in the range `[0, 1]` where:
- `0.0` = no concern / no impact
- `1.0` = maximum concern / maximum impact

### Score Components

| Component | Range | Description |
|-----------|-------|-------------|
| `impact` | 0.0–1.0 | How many agents, tasks, or offices are affected |
| `urgency` | 0.0–1.0 | How time-sensitive the issue is |
| `confidence` | 0.0–1.0 | How reliable the signal is (more evidence → higher) |
| `dependencyWeight` | 0.0–1.0 | How many downstream items depend on resolution |
| `governanceWeight` | 0.0–1.0 | Whether governance approval is pending or blocking |

### Composite Score

```
composite = (impact × 0.35) + (urgency × 0.25) + (dependencyWeight × 0.20) + (governanceWeight × 0.20)
```

Weights are configurable via a `ScoringConfig` interface passed to the Analysis Engine constructor.

## 4. Capability Models

### 4.1 Priority Engine (Capability 1)

Produces `RankedPriority[]`:

```typescript
interface RankedPriority {
  id: string;
  rank: number;            // 1-based
  title: string;
  category: 'risk' | 'blocker' | 'decision' | 'dependency' | 'trend';
  compositeScore: number;
  components: {
    impact: number;
    urgency: number;
    dependencyWeight: number;
    governanceWeight: number;
  };
  confidence: number;
  rationale: string[];      // evidence trace
  affectedOffices: string[];
  timestamp: number;
}
```

**Ranking rules:**
1. Items with `compositeScore > 0.8` are rank-ordered first.
2. Within the same score band, `urgency` is the tiebreaker.
3. Items affecting 3+ offices get a +0.05 bonus to composite.
4. Items with a resolved/cancelled status are excluded.
5. Rank is always 1-based and dense (no gaps).

### 4.2 Risk Intelligence (Capability 2)

Enriches `EscalatedRisk` with likelihood, impact, trend, and recommended action:

```typescript
interface RiskIntelligence {
  id: string;
  source: EscalatedRisk;
  likelihood: 'low' | 'medium' | 'high' | 'very_high';
  organizationalImpact: 'contained' | 'office' | 'cross_office' | 'enterprise';
  trend: 'improving' | 'stable' | 'worsening';    // vs previous snapshot
  recommendedOwner: string;
  recommendedAction: string;
  confidence: number;
  rationale: string[];
}
```

**Derivation rules:**
- `severity === 'critical'` → `likelihood = 'high'`, impact determined by number of offices affected.
- Blocker that appears in 2+ consecutive snapshots → `trend = 'worsening'`.
- Blocker that references a specific office → recommended owner is that office head (via mapping).
- No previous snapshot → `trend = 'stable'`.

### 4.3 Delta Engine (Capability 3)

```typescript
interface ExecutiveDelta {
  previousSnapshotId: string;
  previousTimestamp: number;
  currentSnapshotId: string;
  currentTimestamp: number;
  newRisks: EscalatedRisk[];
  resolvedRisks: string[];                // risk IDs no longer present
  newBlockers: { office: string; blocker: string }[];
  resolvedBlockers: { office: string; blocker: string }[];
  newPendingDecisions: PendingDecision[];
  resolvedPendingDecisions: string[];     // decision IDs now resolved
  officeHealthChanges: {
    office: string;
    previous: OfficeHealth;
    current: OfficeHealth;
  }[];
  newDependencies: CrossOfficeDependency[];
  resolvedDependencies: string[];
  kpiMovements: KpiTrend[];
  summary: string;                        // natural-language summary
}
```

**Comparison logic:** Pure structural diff. Two snapshots compared by ID equality on risks, blockers, decisions, dependencies. Office health changes by field comparison.

### 4.4 Recommendation Engine (Capability 4)

Structured, scorable recommendations:

```typescript
interface StructuredRecommendation {
  id: string;
  rank: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'resolve_blocker' | 'review_decision' | 'clear_dependency' | 'address_risk' | 'investigate_trend';
  action: string;
  reason: string;
  expectedBenefit: string;
  suggestedOwner: string;
  supportingEvidence: string[];
  confidence: number;
  score: number;              // composite score for ranking
}
```

**Derivation rules:**
- Each risk with `likelihood >= 'high'` → one recommendation.
- Each blocked cross-office dependency → one recommendation.
- Each pending decision older than 24h (by `requestedAt`) → one recommendation.
- Duplicate recommendations from the same root cause are deduplicated.
- Ranked by score descending.

### 4.5 Pattern Detection (Capability 5)

```typescript
interface OrganizationalPattern {
  id: string;
  type: 'recurring_blocker' | 'governance_bottleneck' | 'research_without_downstream' | 'incident_cluster';
  description: string;
  severity: 'info' | 'warning' | 'critical';
  affectedOffices: string[];
  occurrences: number;
  firstObserved: number;
  lastObserved: number;
  evidence: string[];
}
```

**Detection rules:**
- `recurring_blocker`: Same blocker text (fuzzy matched) appearing in 2+ consecutive snapshots.
- `governance_bottleneck`: Same `actionType` in pending decisions appearing 3+ times across snapshots.
- `research_without_downstream`: Research tasks completed but no corresponding Product/Operations tasks referencing the same keyword.
- `incident_cluster`: 3+ blockers in the same office within a rolling 5-snapshot window.

## 5. Data Flow

```
WorkforcePlatform
       │
       ▼ (queries)
Office Collectors
       │
       ▼
ExecutiveSnapshot  ───────────────┐
       │                           │
       ▼ (cached)                  │  (historical snapshots
ExecutiveIntelligence Engine       │   stored in memory)
       │                           │
       ├── synthesize()            │
       │     │                     │
       │     ▼                     ▼
       │  ExecutiveAnalysisEngine
       │     │
       │     ├── rankPriorities()
       │     ├── enrichRisks()
       │     ├── computeDelta(prevSnap)
       │     ├── generateRecommendations()
       │     └── detectPatterns(snapshotHistory)
       │     │
       └──────┘
             │
             ▼
       ExecutiveBriefing (enriched)
```

## 6. Testing Strategy

| Capability | Test approach |
|------------|---------------|
| Priority Engine | Given a snapshot with N blockers, expect ranked priorities with scores in [0,1], correct ordering, evidence traces present. |
| Risk Intelligence | Given a critical blocker affecting 2 offices, verify likelihood=high, trend=stable (no history), recommended owner present. |
| Delta Engine | Build snapshot A, build snapshot B with one new blocker, verify diff detects it. |
| Recommendation Engine | Given 1 critical risk + 1 blocked dependency, expect 2 recommendations ranked by score. |
| Pattern Detection | Create 3 snapshots with same blocker text, verify pattern triggers. |

## 7. Future Evolution (Not Implemented Here)

- **Explicit dependency metadata** replacing text matching (noted in Milestone 2 review).
- **Trend scoring** with weighted moving averages across 5+ snapshots.
- **"What if" simulation**: given a resolved blocker, recompute briefing.
- **Named executive owners** from a directory service instead of office-based mapping.
- **Snapshot persistence** to allow cross-session delta computation.
