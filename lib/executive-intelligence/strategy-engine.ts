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

  evaluateScenario(scenarioId: string, profileId: string): ScenarioEvaluation { return null as unknown as ScenarioEvaluation; }
  compareScenarios(evaluationIds: string[]): TradeOffComparison { return null as unknown as TradeOffComparison; }
  buildRoadmap(scenarioId: string, phases: RoadmapPhase[]): EnterpriseRoadmap { return null as unknown as EnterpriseRoadmap; }
  buildExecutivePlanningBrief(): ExecutivePlanningBrief { return null as unknown as ExecutivePlanningBrief; }
}
