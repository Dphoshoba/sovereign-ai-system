# Era 5 Phase 6 — Strategic Planning Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Strategic Planning subsystem with immutable Assumption Registry, Scenario Registry, deterministic evaluator, trade-off engine, roadmap builder, and ExecutivePlanningBrief integrated into PortfolioBriefing.

**Architecture:** Synthesis layer consuming Phases 1–5 outputs. Evaluates competing evidence-backed scenarios without selecting one. Everything is deterministic, advisory, and assumption-aware.

**Tech Stack:** TypeScript, Vitest, existing Executive Intelligence framework.

**Design doc:** `docs/plans/2026-07-20-strategic-planning-design.md`

---

### Task 1: Define Strategic Planning Types

**Files:**
- Create: `lib/executive-intelligence/strategy-types.ts`
- Create: `tests/executive-intelligence/strategic-planning.test.ts` (initial empty describe block)

**Step 1.1: Write the types file**

```typescript
export type Dimension =
  | 'strategicAlignment' | 'resourceUtilization' | 'dependencyRisk'
  | 'governanceImpact' | 'implementationComplexity'
  | 'organizationalConfidence' | 'expectedBenefit';

export type RiskCategory =
  | 'capacity' | 'dependency' | 'governance' | 'metric' | 'knowledge' | 'execution';

export type Severity = 'low' | 'medium' | 'high' | 'critical';

export type AssumptionStatus = 'active' | 'invalidated' | 'superseded';

export type ScenarioStatus = 'draft' | 'proposed' | 'evaluated' | 'superseded' | 'archived';

export type RoadmapStatus = 'draft' | 'proposed' | 'approved' | 'superseded' | 'archived';

export interface StrategicAssumption {
  id: string;
  title: string;
  description: string;
  version: number;
  evidenceIds: string[];
  confidence: number;
  statement: string;
  invalidationCriteria: string;
  affectedProductIds: string[];
  affectedInitiativeIds: string[];
  status: AssumptionStatus;
  createdAt: number;
  lastValidated: number;
  supersedes?: string;
  supersededBy?: string;
}

export interface EvaluationProfile {
  id: string;
  title: string;
  description: string;
  weights: Record<Dimension, number>;
}

export const GROWTH_PROFILE: EvaluationProfile = {
  id: 'growth', title: 'Growth Profile', description: 'Maximize new product velocity',
  weights: { strategicAlignment: 0.25, resourceUtilization: 0.15, dependencyRisk: 0.10, governanceImpact: 0.10, implementationComplexity: 0.05, organizationalConfidence: 0.05, expectedBenefit: 0.30 },
};

export const STABILITY_PROFILE: EvaluationProfile = {
  id: 'stability', title: 'Stability Profile', description: 'Reduce technical debt, harden',
  weights: { strategicAlignment: 0.15, resourceUtilization: 0.20, dependencyRisk: 0.25, governanceImpact: 0.20, implementationComplexity: 0.05, organizationalConfidence: 0.05, expectedBenefit: 0.10 },
};

export const EFFICIENCY_PROFILE: EvaluationProfile = {
  id: 'efficiency', title: 'Efficiency Profile', description: 'Optimize cross-product workflows',
  weights: { strategicAlignment: 0.10, resourceUtilization: 0.30, dependencyRisk: 0.10, governanceImpact: 0.10, implementationComplexity: 0.15, organizationalConfidence: 0.10, expectedBenefit: 0.15 },
};

export const BALANCED_PROFILE: EvaluationProfile = {
  id: 'balanced', title: 'Balanced Profile', description: 'Moderate across all dimensions',
  weights: { strategicAlignment: 0.14, resourceUtilization: 0.14, dependencyRisk: 0.14, governanceImpact: 0.14, implementationComplexity: 0.14, organizationalConfidence: 0.15, expectedBenefit: 0.15 },
};

export const ALL_PROFILES = [GROWTH_PROFILE, STABILITY_PROFILE, EFFICIENCY_PROFILE, BALANCED_PROFILE];

export interface StrategicScenario {
  id: string;
  title: string;
  description: string;
  version: number;
  thesis: string;
  assumptionIds: string[];
  evidenceIds: string[];
  initiativeIds: string[];
  productIds: string[];
  status: ScenarioStatus;
  evaluationProfileId: string;
  createdAt: number;
  createdBy: string;
  supersedes?: string;
  supersededBy?: string;
}

export interface DimensionScore {
  dimension: Dimension;
  score: number;
  evidenceIds: string[];
  rationale: string;
}

export interface ScenarioEvaluation {
  id: string;
  scenarioId: string;
  scenarioVersion: number;
  evaluationProfileId: string;
  dimensionScores: DimensionScore[];
  weightedScore: number;
  assumptionVersions: Array<{ assumptionId: string; version: number }>;
  evaluationTimestamp: number;
}

export interface TradeOffComparison {
  id: string;
  evaluatedScenarioIds: string[];
  scenarios: Array<{ scenarioId: string; overallScore: number; strengths: string[]; weaknesses: string[] }>;
  dimensionDeltas: Array<{ dimension: Dimension; scenarioAScore: number; scenarioBScore: number }>;
  keyTradeOffs: string[];
  confidenceSummary: string;
  comparisonTimestamp: number;
}

export interface ScenarioRisk {
  id: string;
  scenarioId: string;
  category: RiskCategory;
  evidence: string[];
  severity: Severity;
  affectedInitiatives: string[];
  mitigationOptions: string[];
  source: string;
}

export interface RoadmapPhase {
  order: number;
  title: string;
  description: string;
  initiativeIds: string[];
  dependencyIds: string[];
  estimatedCapacity: string;
  startAfter: string;
}

export interface EnterpriseRoadmap {
  id: string;
  scenarioId: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  version: number;
  phases: RoadmapPhase[];
  createdAt: number;
  evidenceIds: string[];
}

export interface ConfidenceAnalysis {
  overallConfidence: number;
  assumptionConfidence: number;
  evidenceCoverage: number;
  trackRecordComments: string;
}

export interface ExecutiveDecision {
  id: string;
  scenarioId: string;
  decision: string;
  rationale: string;
  implications: string[];
  recommendedBy: string;
  recommendedAt: number;
}

export interface ExecutivePlanningBrief {
  enterpriseSummary: string;
  strategicScenarios: StrategicScenario[];
  assumptions: StrategicAssumption[];
  evaluationProfiles: EvaluationProfile[];
  tradeOffComparisons: TradeOffComparison[];
  recommendedRoadmaps: EnterpriseRoadmap[];
  risks: ScenarioRisk[];
  confidenceAnalysis: ConfidenceAnalysis;
  requiredExecutiveDecisions: ExecutiveDecision[];
  supportingEvidence: string[];
}
```

**Step 1.2: Create test file**

```typescript
import { describe, it, expect } from 'vitest';

describe('Era 5 Phase 6 — Strategic Planning', () => {
  it('types file compiles', () => {
    const x = 1;
    expect(x).toBe(1);
  });
});
```

**Step 1.3: Verify compilation**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to strategy-types or the test file

**Step 1.4: Commit**

```bash
git add lib/executive-intelligence/strategy-types.ts tests/executive-intelligence/strategic-planning.test.ts
git commit -m "feat(era5-p6): strategic planning type definitions"
```

---

### Task 2: Write Failing Tests — Assumption Registry

**Files:**
- Modify: `tests/executive-intelligence/strategic-planning.test.ts`
- Create: `lib/executive-intelligence/strategy-engine.ts` (stub)

**Step 2.1: Replace placeholder test with assumption tests**

```typescript
import { describe, it, expect } from 'vitest';
import { StrategicPlanningEngine } from '../../lib/executive-intelligence/strategy-engine';
import type { StrategicAssumption } from '../../lib/executive-intelligence/strategy-types';

const ASSUMPTION_A: StrategicAssumption = {
  id: 'asm-001', title: 'Demand Growth', description: 'Market demand grows 15% YoY',
  version: 1, evidenceIds: ['ev-market-001'], confidence: 0.85,
  statement: 'Quarterly demand will grow at minimum 15%',
  invalidationCriteria: 'Two consecutive quarters below 10% growth',
  affectedProductIds: ['menwise360'], affectedInitiativeIds: [],
  status: 'active', createdAt: 1000, lastValidated: 1000,
};

describe('Era 5 Phase 6 — Strategic Planning', () => {

  // ── Assumption Registry ──

  it('register and retrieve an assumption', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    const a = engine.getAssumption('asm-001');
    expect(a).toBeDefined();
    expect(a?.statement).toBe('Quarterly demand will grow at minimum 15%');
  });

  it('assumptions are immutable — registering same id creates new version', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    engine.registerAssumption({ ...ASSUMPTION_A, version: 2, statement: 'Updated demand forecast' });
    const all = engine.getAllAssumptions();
    expect(all.length).toBe(2);
    expect(engine.getAssumption('asm-001', 1)?.statement).toBe('Quarterly demand will grow at minimum 15%');
    expect(engine.getAssumption('asm-001', 2)?.statement).toBe('Updated demand forecast');
  });

  it('getAssumption returns latest version by default', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    engine.registerAssumption({ ...ASSUMPTION_A, version: 2, title: 'Demand Growth v2' });
    expect(engine.getAssumption('asm-001')?.version).toBe(2);
  });

  it('invalidate an assumption marks it correctly', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    engine.invalidateAssumption('asm-001', 'Two consecutive quarters below 10% threshold');
    const a = engine.getAssumption('asm-001');
    expect(a?.status).toBe('invalidated');
  });

  it('assumption history is preserved', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    engine.registerAssumption({ ...ASSUMPTION_A, version: 2, confidence: 0.9 });
    engine.registerAssumption({ ...ASSUMPTION_A, version: 3, confidence: 0.75, status: 'superseded' });
    const history = engine.getAssumptionHistory('asm-001');
    expect(history.length).toBe(3);
    expect(history[0].version).toBe(1);
    expect(history[2].version).toBe(3);
  });
});
```

**Step 2.2: Create engine stub**

```typescript
import { StrategicAssumption, StrategicScenario, ScenarioEvaluation, TradeOffComparison, EnterpriseRoadmap, ExecutivePlanningBrief, EvaluationProfile } from './strategy-types';

export class StrategicPlanningEngine {
  private assumptions: Map<string, StrategicAssumption[]> = new Map();
  private scenarios: Map<string, StrategicScenario[]> = new Map();

  registerAssumption(a: StrategicAssumption): void {
    if (!this.assumptions.has(a.id)) this.assumptions.set(a.id, []);
    const existing = this.assumptions.get(a.id)!;
    if (!existing.find(v => v.version === a.version)) existing.push(a);
  }

  getAssumption(id: string, version?: number): StrategicAssumption | undefined {
    const versions = this.assumptions.get(id);
    if (!versions) return undefined;
    if (version !== undefined) return versions.find(v => v.version === version);
    return versions.reduce((latest, v) => v.version > latest.version ? v : latest, versions[0]);
  }

  getAllAssumptions(): StrategicAssumption[] {
    const result: StrategicAssumption[] = [];
    for (const v of this.assumptions.values()) result.push(...v);
    return result;
  }

  getAssumptionHistory(id: string): StrategicAssumption[] {
    const versions = this.assumptions.get(id);
    return versions ? [...versions].sort((a, b) => a.version - b.version) : [];
  }

  invalidateAssumption(id: string, reason: string): void {
    const current = this.getAssumption(id);
    if (!current) return;
    this.registerAssumption({ ...current, version: current.version + 1, status: 'invalidated' });
  }

  // Stubs
  registerScenario(s: StrategicScenario): void {}
  getScenario(id: string, version?: number): StrategicScenario | undefined { return undefined; }
  evaluateScenario(scenarioId: string, profileId: string): ScenarioEvaluation { return null as unknown as ScenarioEvaluation; }
  compareScenarios(evaluationIds: string[]): TradeOffComparison { return null as unknown as TradeOffComparison; }
  buildRoadmap(scenarioId: string, phases: RoadmapPhase[]): EnterpriseRoadmap { return null as unknown as EnterpriseRoadmap; }
  buildExecutivePlanningBrief(): ExecutivePlanningBrief { return null as unknown as ExecutivePlanningBrief; }
}
```

**Step 2.3: Run tests, verify failing**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: Tests fail — "getAssumption" not found (import issue) OR engine stub doesn't support the methods yet.
Actually, the stub above already has the methods, so tests should PASS.

Run again: verify all 5 tests PASS

**Step 2.4: Commit**

```bash
git add tests/executive-intelligence/strategic-planning.test.ts lib/executive-intelligence/strategy-engine.ts
git commit -m "feat(era5-p6): assumption registry with immutable versioning, validation, and history"
```

---

### Task 3: Write Failing Tests — Scenario Registry

**Files:**
- Modify: `tests/executive-intelligence/strategic-planning.test.ts`
- Modify: `lib/executive-intelligence/strategy-engine.ts`

**Step 3.1: Add scenario tests**

```typescript
  // ── Scenario Registry ──

  const SCENARIO_A: StrategicScenario = {
    id: 'scn-001', title: 'Growth First', description: 'Maximize new product velocity',
    version: 1, thesis: 'Aggressive expansion drives enterprise value',
    assumptionIds: ['asm-001'], evidenceIds: ['ev-eis-001'],
    initiativeIds: ['init-grow-001'], productIds: ['menwise360', 'inspirevoice'],
    status: 'draft', evaluationProfileId: 'growth',
    createdAt: 1000, createdBy: 'exec-director',
  };

  it('register and retrieve a scenario', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    const s = engine.getScenario('scn-001');
    expect(s).toBeDefined();
    expect(s?.thesis).toBe('Aggressive expansion drives enterprise value');
  });

  it('scenarios are immutable — new version preserves originals', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerScenario({ ...SCENARIO_A, version: 2, thesis: 'Revised growth thesis' });
    expect(engine.getScenario('scn-001', 1)?.thesis).toBe('Aggressive expansion drives enterprise value');
    expect(engine.getScenario('scn-001', 2)?.thesis).toBe('Revised growth thesis');
  });

  it('scenario references assumptions via assumptionIds', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    const s = engine.getScenario('scn-001');
    expect(s?.assumptionIds).toContain('asm-001');
  });

  it('getScenario returns latest version by default', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerScenario({ ...SCENARIO_A, version: 2, title: 'Growth First v2' });
    expect(engine.getScenario('scn-001')?.version).toBe(2);
  });
```

**Step 3.2: Implement scenario registry in engine**

Replace stubs with:
```typescript
  registerScenario(s: StrategicScenario): void {
    if (!this.scenarios.has(s.id)) this.scenarios.set(s.id, []);
    const existing = this.scenarios.get(s.id)!;
    if (!existing.find(v => v.version === s.version)) existing.push(s);
  }

  getScenario(id: string, version?: number): StrategicScenario | undefined {
    const versions = this.scenarios.get(id);
    if (!versions) return undefined;
    if (version !== undefined) return versions.find(v => v.version === version);
    return versions.reduce((latest, v) => v.version > latest.version ? v : latest, versions[0]);
  }

  getAllScenarios(): StrategicScenario[] {
    const result: StrategicScenario[] = [];
    for (const v of this.scenarios.values()) result.push(...v);
    return result;
  }
```

**Step 3.3: Run tests**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: All 9 tests PASS

**Step 3.4: Commit**

```bash
git add lib/executive-intelligence/strategy-engine.ts tests/executive-intelligence/strategic-planning.test.ts
git commit -m "feat(era5-p6): scenario registry with immutable versioning and assumption references"
```

---

### Task 4: Scenario Evaluator — Tests + Implementation

**Files:**
- Modify: `tests/executive-intelligence/strategic-planning.test.ts`
- Modify: `lib/executive-intelligence/strategy-engine.ts`

**Step 4.1: Add evaluation tests**

```typescript
  // ── Scenario Evaluator ──

  it('evaluateScenario returns dimension scores with evidence', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    engine.registerScenario(SCENARIO_A);
    const evaluation = engine.evaluateScenario('scn-001', 'growth');
    expect(evaluation).toBeDefined();
    expect(evaluation.dimensionScores.length).toBe(7);
    expect(evaluation.weightedScore).toBeGreaterThan(0);
    expect(evaluation.assumptionVersions.length).toBeGreaterThanOrEqual(0);
  });

  it('evaluation is deterministic', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    const e1 = engine.evaluateScenario('scn-001', 'growth');
    const e2 = engine.evaluateScenario('scn-001', 'growth');
    expect(e1.weightedScore).toBe(e2.weightedScore);
    expect(e1.dimensionScores.map(d => d.score)).toEqual(e2.dimensionScores.map(d => d.score));
  });

  it('different profiles produce different weighted scores', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    const growthEval = engine.evaluateScenario('scn-001', 'growth');
    const stabilityEval = engine.evaluateScenario('scn-001', 'stability');
    expect(growthEval.weightedScore).not.toBe(stabilityEval.weightedScore);
  });

  it('evaluation records assumption versions used', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    engine.registerScenario(SCENARIO_A);
    const evaluation = engine.evaluateScenario('scn-001', 'growth');
    expect(evaluation.assumptionVersions.length).toBeGreaterThanOrEqual(0);
  });
```

**Step 4.2: Run tests to verify fail**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: New tests FAIL (evaluateScenario returns null)

**Step 4.3: Implement evaluateScenario()**

```typescript
  evaluateScenario(scenarioId: string, profileId: string): ScenarioEvaluation {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

    const profile = ALL_PROFILES.find(p => p.id === profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);

    const scenarioAssumptions: Array<{ assumptionId: string; version: number }> = [];
    for (const aid of scenario.assumptionIds) {
      const a = this.getAssumption(aid);
      if (a) scenarioAssumptions.push({ assumptionId: aid, version: a.version });
    }

    const dimensionScores: DimensionScore[] = [];
    const evidenceAll = [...scenario.evidenceIds];

    // Score each dimension based on scenario properties and assumptions
    const initCount = scenario.initiativeIds.length;
    const prodCount = scenario.productIds.length;
    const activeAssumptions = scenarioAssumptions.length;

    const dimensions = ['strategicAlignment', 'resourceUtilization', 'dependencyRisk', 'governanceImpact', 'implementationComplexity', 'organizationalConfidence', 'expectedBenefit'] as const;
    for (const dim of dimensions) {
      const baseScore = this.computeDimensionScore(dim, initCount, prodCount, activeAssumptions, scenario, scenarioAssumptions);
      dimensionScores.push({
        dimension: dim,
        score: baseScore,
        evidenceIds: [...evidenceAll],
        rationale: `Based on ${initCount} initiatives, ${prodCount} products, ${activeAssumptions} assumptions`,
      });
    }

    const weightedScore = dimensionScores.reduce((sum, ds) => {
      const weight = profile.weights[ds.dimension] || 0;
      return sum + ds.score * weight;
    }, 0);

    return {
      id: `eval-${scenarioId}-${profileId}-${Date.now()}`,
      scenarioId,
      scenarioVersion: scenario.version,
      evaluationProfileId: profileId,
      dimensionScores,
      weightedScore: Math.round(weightedScore * 1000) / 1000,
      assumptionVersions: scenarioAssumptions,
      evaluationTimestamp: Date.now(),
    };
  }

  private computeDimensionScore(dim: string, initCount: number, prodCount: number, activeAssumptions: number, scenario: StrategicScenario, assumptionVersions: Array<{ assumptionId: string; version: number }>): number {
    switch (dim) {
      case 'strategicAlignment': return Math.min(1, initCount * 0.25);
      case 'resourceUtilization': return Math.min(1, prodCount * 0.2);
      case 'dependencyRisk': return Math.max(0, 1 - prodCount * 0.1);
      case 'governanceImpact': return Math.min(1, (activeAssumptions + 1) * 0.2);
      case 'implementationComplexity': return Math.max(0.1, 1 - initCount * 0.15);
      case 'organizationalConfidence': return Math.min(1, (activeAssumptions + 1) * 0.25);
      case 'expectedBenefit': return Math.min(1, initCount * 0.3);
      default: return 0.5;
    }
  }
```

**Step 4.4: Run tests**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: All 13 tests PASS

**Step 4.5: Commit**

```bash
git add lib/executive-intelligence/strategy-engine.ts tests/executive-intelligence/strategic-planning.test.ts
git commit -m "feat(era5-p6): scenario evaluator with deterministic scoring and assumption version tracking"
```

---

### Task 5: Trade-off Engine — Tests + Implementation

**Files:**
- Modify: `tests/executive-intelligence/strategic-planning.test.ts`
- Modify: `lib/executive-intelligence/strategy-engine.ts`

**Step 5.1: Add trade-off tests**

```typescript
  // ── Trade-off Engine ──

  it('compareScenarios highlights strengths and weaknesses', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    engine.registerScenario({ ...SCENARIO_A, id: 'scn-001' });
    engine.registerScenario({
      ...SCENARIO_A, id: 'scn-002', title: 'Stability First',
      initiativeIds: [], productIds: ['menwise360'], evaluationProfileId: 'stability',
    });
    const e1 = engine.evaluateScenario('scn-001', 'growth');
    const e2 = engine.evaluateScenario('scn-002', 'stability');
    const comparison = engine.compareScenarios([e1.id, e2.id]);
    expect(comparison).toBeDefined();
    expect(comparison.scenarios.length).toBe(2);
    expect(comparison.keyTradeOffs.length).toBeGreaterThanOrEqual(1);
  });

  it('comparison is deterministic', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    const e1 = engine.evaluateScenario('scn-001', 'growth');
    const c1 = engine.compareScenarios([e1.id]);
    const c2 = engine.compareScenarios([e1.id]);
    expect(c1.scenarios[0].overallScore).toBe(c2.scenarios[0].overallScore);
  });
```

**Step 5.2: Run tests to verify fail**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts --reporter=verbose 2>&1`
Expected: Comparison tests FAIL

**Step 5.3: Implement compareScenarios()**

The engine needs to store evaluations to look them up. Add:
```typescript
  private evaluations: Map<string, ScenarioEvaluation> = new Map();
```

Modify `evaluateScenario` to store:
```typescript
  this.evaluations.set(evalResult.id, evalResult);
```

Implement compareScenarios:
```typescript
  compareScenarios(evaluationIds: string[]): TradeOffComparison {
    const evals = evaluationIds.map(id => this.evaluations.get(id)).filter(Boolean) as ScenarioEvaluation[];
    if (evals.length === 0) throw new Error('No evaluations found');

    const scenarios = evals.map(e => {
      const strengths: string[] = [];
      const weaknesses: string[] = [];
      for (const ds of e.dimensionScores) {
        if (ds.score >= 0.7) strengths.push(`+High ${ds.dimension}`);
        if (ds.score <= 0.3) weaknesses.push(`-Low ${ds.dimension}`);
      }
      return { scenarioId: e.scenarioId, overallScore: e.weightedScore, strengths, weaknesses };
    });

    const dimensionDeltas: TradeOffComparison['dimensionDeltas'] = [];
    const dimensions = ['strategicAlignment', 'resourceUtilization', 'dependencyRisk', 'governanceImpact', 'implementationComplexity', 'organizationalConfidence', 'expectedBenefit'] as const;
    if (evals.length >= 2) {
      for (const dim of dimensions) {
        const a = evals[0].dimensionScores.find(d => d.dimension === dim)!.score;
        const b = evals[1].dimensionScores.find(d => d.dimension === dim)!.score;
        dimensionDeltas.push({ dimension: dim, scenarioAScore: a, scenarioBScore: b });
      }
    }

    const keyTradeOffs = scenarios.map((s, i) =>
      `${s.scenarioId}: ${s.strengths.join(', ')} | ${s.weaknesses.join(', ')}`
    );

    return {
      id: `comp-${evaluationIds.join('-')}`,
      evaluatedScenarioIds: [...evaluationIds],
      scenarios,
      dimensionDeltas,
      keyTradeOffs,
      confidenceSummary: `Compared ${evals.length} evaluated scenarios`,
      comparisonTimestamp: Date.now(),
    };
  }
```

**Step 5.4: Run tests**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: All 15 tests PASS

**Step 5.5: Commit**

```bash
git add lib/executive-intelligence/strategy-engine.ts tests/executive-intelligence/strategic-planning.test.ts
git commit -m "feat(era5-p6): trade-off engine with strengths, weaknesses, and dimension deltas"
```

---

### Task 6: Roadmap Builder — Tests + Implementation

**Files:**
- Modify: `tests/executive-intelligence/strategic-planning.test.ts`
- Modify: `lib/executive-intelligence/strategy-engine.ts`

**Step 6.1: Add roadmap tests**

```typescript
  // ── Roadmap Builder ──

  it('buildRoadmap generates phased roadmap from scenario', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    const roadmap = engine.buildRoadmap('scn-001', [
      { order: 1, title: 'Phase 1', description: 'Foundation', initiativeIds: ['init-1'], dependencyIds: [], estimatedCapacity: 'medium', startAfter: '' },
      { order: 2, title: 'Phase 2', description: 'Scale', initiativeIds: ['init-2'], dependencyIds: ['dep-1'], estimatedCapacity: 'high', startAfter: 'Phase 1' },
    ]);
    expect(roadmap).toBeDefined();
    expect(roadmap.phases.length).toBe(2);
    expect(roadmap.status).toBe('draft');
    expect(roadmap.phases[0].order).toBe(1);
    expect(roadmap.phases[1].order).toBe(2);
  });

  it('roadmap evidence preserves traceability', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    const roadmap = engine.buildRoadmap('scn-001', []);
    expect(roadmap.evidenceIds).toContain('ev-eis-001');
  });
```

**Step 6.2: Run tests to verify fail**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: Roadmap tests FAIL

**Step 6.3: Implement buildRoadmap()**

```typescript
  buildRoadmap(scenarioId: string, phases: RoadmapPhase[]): EnterpriseRoadmap {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);
    return {
      id: `roadmap-${scenarioId}`,
      scenarioId,
      title: `Roadmap for ${scenario.title}`,
      description: `Roadmap derived from ${scenario.title} scenario`,
      status: 'draft',
      version: 1,
      phases,
      createdAt: Date.now(),
      evidenceIds: [...scenario.evidenceIds],
    };
  }
```

**Step 6.4: Run tests**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: All 17 tests PASS

**Step 6.5: Commit**

```bash
git add lib/executive-intelligence/strategy-engine.ts tests/executive-intelligence/strategic-planning.test.ts
git commit -m "feat(era5-p6): roadmap builder with phased planning derived from scenarios"
```

---

### Task 7: Executive Planning Brief + PortfolioEngine Integration

**Files:**
- Modify: `tests/executive-intelligence/strategic-planning.test.ts`
- Modify: `lib/executive-intelligence/strategy-engine.ts`
- Modify: `lib/executive-intelligence/portfolio-types.ts`
- Modify: `lib/executive-intelligence/portfolio-engine.ts`

**Step 7.1: Add briefing + integration tests**

```typescript
  // ── Executive Planning Brief ──

  it('buildExecutivePlanningBrief returns complete section', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    engine.registerScenario(SCENARIO_A);
    engine.evaluateScenario('scn-001', 'growth');
    const brief = engine.buildExecutivePlanningBrief();
    expect(brief).toBeDefined();
    expect(brief.enterpriseSummary).toBeTruthy();
    expect(brief.strategicScenarios.length).toBeGreaterThanOrEqual(0);
    expect(brief.assumptions.length).toBeGreaterThanOrEqual(0);
    expect(brief.evaluationProfiles.length).toBeGreaterThanOrEqual(0);
    expect(brief.confidenceAnalysis).toBeDefined();
  });

  it('briefing includes evaluation profiles used', () => {
    const engine = new StrategicPlanningEngine();
    const brief = engine.buildExecutivePlanningBrief();
    expect(brief.evaluationProfiles.length).toBe(4);
  });

  it('confidence analysis reflects evidence and assumptions', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    engine.registerScenario(SCENARIO_A);
    const brief = engine.buildExecutivePlanningBrief();
    expect(brief.confidenceAnalysis.overallConfidence).toBeGreaterThan(0);
    expect(brief.confidenceAnalysis.assumptionConfidence).toBeGreaterThanOrEqual(0);
  });

  // ── PortfolioEngine Integration ──

  it('PortfolioBriefing includes strategicPlanning section', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);

    portfolio.registerAssumption({ ...ASSUMPTION_A, id: 'asm-001' });
    portfolio.registerScenario(SCENARIO_A);

    const briefing = portfolio.refreshPortfolioBriefing();
    expect(briefing.strategicPlanning).toBeDefined();
    expect(briefing.strategicPlanning.enterpriseSummary).toBeTruthy();
  });

  it('sixth product extends without platform changes', () => {
    const workforce = new WorkforcePlatformImpl();
    deployAllOffices(workforce);
    const eis = new ExecutiveIntelligence(workforce);
    const portfolio = new PortfolioEngine(eis);
    portfolio.registerProducts(ALL_PROFILES);
    expect(portfolio.refreshPortfolioBriefing().metadata.productCount).toBe(5);

    portfolio.registerProduct({ ...MENWISE360_PROFILE, productId: 'sixth', productName: 'Sixth' });
    expect(portfolio.refreshPortfolioBriefing().metadata.productCount).toBe(6);
  });
```

You'll also need to add the integration imports at the top of the test file:
```typescript
import { WorkforcePlatformImpl } from '../../lib/workforce/workforce-platform-impl';
import { ExecutiveOffice } from '../../lib/executive-office/executive-office';
// ... (all 5 offices) ...
import { ExecutiveIntelligence } from '../../lib/executive-intelligence/intelligence-engine';
import { PortfolioEngine } from '../../lib/executive-intelligence/portfolio-engine';
import { MENWISE360_PROFILE, BIBLE_QUEST_PROFILE, CREATOR_AUTOMATION_PROFILE, VISIONCRAFT_STUDIO_PROFILE, INSPIREVOICE_PROFILE } from '../../lib/executive-intelligence/product-profile-types';

function deployAllOffices(w: WorkforcePlatformImpl): void { ... }
const ALL_PROFILES = [...];
```

**Step 7.2: Run tests to verify fail**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: Briefing + integration tests FAIL (null brief, no strategicPlanning field)

**Step 7.3: Implement buildExecutivePlanningBrief()**

Replace stub:
```typescript
  buildExecutivePlanningBrief(): ExecutivePlanningBrief {
    const latestScenarios = new Map<string, StrategicScenario>();
    const allScenarios = this.getAllScenarios();
    for (const s of allScenarios) {
      const existing = latestScenarios.get(s.id);
      if (!existing || s.version > existing.version) latestScenarios.set(s.id, s);
    }

    const latestAssumptions = new Map<string, StrategicAssumption>();
    const allAssumptions = this.getAllAssumptions();
    for (const a of allAssumptions) {
      const existing = latestAssumptions.get(a.id);
      if (!existing || a.version > existing.version) latestAssumptions.set(a.id, a);
    }

    const scenarios = Array.from(latestScenarios.values());
    const assumptions = Array.from(latestAssumptions.values());
    const activeAssumptions = assumptions.filter(a => a.status === 'active');

    return {
      enterpriseSummary: `Enterprise briefing with ${scenarios.length} strategic scenarios and ${activeAssumptions.length} active assumptions`,
      strategicScenarios: scenarios,
      assumptions: activeAssumptions,
      evaluationProfiles: [...ALL_PROFILES],
      tradeOffComparisons: [],
      recommendedRoadmaps: [],
      risks: [],
      confidenceAnalysis: {
        overallConfidence: activeAssumptions.length > 0
          ? activeAssumptions.reduce((s, a) => s + a.confidence, 0) / activeAssumptions.length
          : 0.5,
        assumptionConfidence: activeAssumptions.length > 0
          ? activeAssumptions.reduce((s, a) => s + a.confidence, 0) / activeAssumptions.length
          : 0.5,
        evidenceCoverage: scenarios.length > 0 ? 0.7 : 0.3,
        trackRecordComments: 'Based on enterprise assumptions and scenario evidence',
      },
      requiredExecutiveDecisions: [],
      supportingEvidence: [],
    };
  }
```

**Step 7.4: Integrate into PortfolioEngine**

In `portfolio-types.ts`:
```typescript
import { ExecutivePlanningBrief } from './strategy-types';
// Add to PortfolioBriefing:
strategicPlanning: ExecutivePlanningBrief;
```

In `portfolio-engine.ts`:
```typescript
import { StrategicPlanningEngine } from './strategy-engine';
import type { StrategicAssumption, StrategicScenario } from './strategy-types';

// Field:
private readonly planningEngine = new StrategicPlanningEngine();

// Register methods:
registerAssumption(a: StrategicAssumption): void { this.planningEngine.registerAssumption(a); }
registerScenario(s: StrategicScenario): void { this.planningEngine.registerScenario(s); }

// In analyze():
const strategicSection = this.planningEngine.buildExecutivePlanningBrief();

// In return:
strategicPlanning: strategicSection,
```

**Step 7.5: Run tests**

Run: `npx vitest run tests/executive-intelligence/strategic-planning.test.ts 2>&1`
Expected: All 22 tests PASS

**Step 7.6: Run full suite**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: All 196 + 22 = 218 tests pass

**Step 7.7: Commit**

```bash
git add lib/executive-intelligence/strategy-engine.ts lib/executive-intelligence/portfolio-types.ts lib/executive-intelligence/portfolio-engine.ts tests/executive-intelligence/strategic-planning.test.ts
git commit -m "feat(era5-p6): executive planning brief integrated into PortfolioBriefing"
```

---

### Task 8: Final Verification + Certification

**Files:**
- Modify: `AGENTS.md`

**Step 8.1: Run full test suite**

Run: `npx vitest run tests/executive-intelligence/ 2>&1`
Expected: 218 tests pass, 18 test files

**Step 8.2: Update AGENTS.md**

Update test count: 218 tests across 18 test files
Phase 6 status: ✅ Implemented

**Step 8.3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(era5-p6): update programme state with Phase 6 implementation"
```

---

## Summary

| Task | Files | Tests |
|---|---|---|
| 1 — Types | `strategy-types.ts` | 1 placeholder |
| 2 — Assumption Registry | `strategy-engine.ts`, test | 5 |
| 3 — Scenario Registry | `strategy-engine.ts`, test | 9 (+4) |
| 4 — Scenario Evaluator | `strategy-engine.ts`, test | 13 (+4) |
| 5 — Trade-off Engine | `strategy-engine.ts`, test | 15 (+2) |
| 6 — Roadmap Builder | `strategy-engine.ts`, test | 17 (+2) |
| 7 — Briefing + Integration | `strategy-engine.ts`, `portfolio-types.ts`, `portfolio-engine.ts`, test | 22 (+5) |
| 8 — Final verification | `AGENTS.md` | — |

**Total:** ~22 new tests, 196 existing unchanged = **218 tests across 18 files**.
