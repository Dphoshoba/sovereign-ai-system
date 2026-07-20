import { StrategicAssumption, StrategicScenario, ScenarioEvaluation, TradeOffComparison, EnterpriseRoadmap, ExecutivePlanningBrief, ALL_PROFILES, DimensionScore, Dimension, RoadmapPhase } from './strategy-types';

export class StrategicPlanningEngine {
  private assumptions: Map<string, StrategicAssumption[]> = new Map();
  private scenarios: Map<string, StrategicScenario[]> = new Map();
  private evaluations: Map<string, ScenarioEvaluation> = new Map();

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

  evaluateScenario(scenarioId: string, profileId: string): ScenarioEvaluation {
    const scenario = this.getScenario(scenarioId);
    if (!scenario) throw new Error(`Scenario ${scenarioId} not found`);

    const profile = ALL_PROFILES.find(p => p.id === profileId);
    if (!profile) throw new Error(`Profile ${profileId} not found`);

    const assumptionVersions: Array<{ assumptionId: string; version: number }> = [];
    for (const aid of scenario.assumptionIds) {
      const a = this.getAssumption(aid);
      if (a && a.status === 'active') {
        assumptionVersions.push({ assumptionId: aid, version: a.version });
      }
    }

    const initCount = scenario.initiativeIds.length;
    const prodCount = scenario.productIds.length;
    const activeAssumptions = assumptionVersions.length;
    const evidenceAll = [...scenario.evidenceIds];

    const dimensionScores: DimensionScore[] = [];
    const dimensions = ['strategicAlignment', 'resourceUtilization', 'dependencyRisk', 'governanceImpact', 'implementationComplexity', 'organizationalConfidence', 'expectedBenefit'] as const;

    for (const dim of dimensions) {
      let score = 0.5;
      switch (dim) {
        case 'strategicAlignment': score = Math.min(1, initCount * 0.25 + 0.1); break;
        case 'resourceUtilization': score = Math.min(1, prodCount * 0.2 + 0.1); break;
        case 'dependencyRisk': score = Math.max(0.1, 1 - prodCount * 0.1); break;
        case 'governanceImpact': score = Math.min(1, (activeAssumptions + 1) * 0.2); break;
        case 'implementationComplexity': score = Math.max(0.1, 1 - initCount * 0.15); break;
        case 'organizationalConfidence': score = Math.min(1, (activeAssumptions + 1) * 0.25); break;
        case 'expectedBenefit': score = Math.min(1, initCount * 0.3 + 0.1); break;
      }
      dimensionScores.push({ dimension: dim, score: Math.round(score * 1000) / 1000, evidenceIds: [...evidenceAll], rationale: `${initCount} initiatives, ${prodCount} products, ${activeAssumptions} assumptions` });
    }

    const weightedScore = dimensionScores.reduce((sum, ds) => {
      const weight = profile.weights[ds.dimension] || 0;
      return sum + ds.score * weight;
    }, 0);

    const evaluation: ScenarioEvaluation = {
      id: `eval-${scenarioId}-${profileId}`,
      scenarioId,
      scenarioVersion: scenario.version,
      evaluationProfileId: profileId,
      dimensionScores,
      weightedScore: Math.round(weightedScore * 1000) / 1000,
      assumptionVersions,
      evaluationTimestamp: Date.now(),
    };

    this.evaluations.set(evaluation.id, evaluation);
    return evaluation;
  }

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
    if (evals.length >= 2) {
      const dimensions = ['strategicAlignment', 'resourceUtilization', 'dependencyRisk', 'governanceImpact', 'implementationComplexity', 'organizationalConfidence', 'expectedBenefit'] as const;
      for (const dim of dimensions) {
        const a = evals[0].dimensionScores.find(d => d.dimension === dim)!.score;
        const b = evals[1].dimensionScores.find(d => d.dimension === dim)!.score;
        dimensionDeltas.push({ dimension: dim, scenarioAScore: a, scenarioBScore: b });
      }
    }

    const keyTradeOffs = scenarios.map((s) => `${s.scenarioId}: ${s.strengths.join(', ')} | ${s.weaknesses.join(', ')}`);

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

  buildExecutivePlanningBrief(): ExecutivePlanningBrief {
    const latestScenarios = new Map<string, StrategicScenario>();
    for (const s of this.getAllScenarios()) {
      const existing = latestScenarios.get(s.id);
      if (!existing || s.version > existing.version) latestScenarios.set(s.id, s);
    }

    const latestAssumptions = new Map<string, StrategicAssumption>();
    for (const a of this.getAllAssumptions()) {
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
        overallConfidence: activeAssumptions.length > 0 ? activeAssumptions.reduce((s, a) => s + a.confidence, 0) / activeAssumptions.length : 0.5,
        assumptionConfidence: activeAssumptions.length > 0 ? activeAssumptions.reduce((s, a) => s + a.confidence, 0) / activeAssumptions.length : 0.5,
        evidenceCoverage: scenarios.length > 0 ? 0.7 : 0.3,
        trackRecordComments: 'Based on enterprise assumptions and scenario evidence',
      },
      requiredExecutiveDecisions: [],
      supportingEvidence: [],
    };
  }
}
