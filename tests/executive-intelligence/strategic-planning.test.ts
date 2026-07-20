import { describe, it, expect } from 'vitest';
import { StrategicPlanningEngine } from '../../lib/executive-intelligence/strategy-engine';
import type { StrategicAssumption, StrategicScenario } from '../../lib/executive-intelligence/strategy-types';

const ASSUMPTION_A: StrategicAssumption = {
  id: 'asm-001', title: 'Demand Growth', description: 'Market demand grows 15% YoY',
  version: 1, evidenceIds: ['ev-market-001'], confidence: 0.85,
  statement: 'Quarterly demand will grow at minimum 15%',
  invalidationCriteria: 'Two consecutive quarters below 10% growth',
  affectedProductIds: ['menwise360'], affectedInitiativeIds: [],
  status: 'active', createdAt: 1000, lastValidated: 1000,
};

const SCENARIO_A: StrategicScenario = {
  id: 'scn-001', title: 'Growth First', description: 'Maximize new product velocity',
  version: 1, thesis: 'Aggressive expansion drives enterprise value',
  assumptionIds: ['asm-001'], evidenceIds: ['ev-eis-001'],
  initiativeIds: ['init-grow-001'], productIds: ['menwise360', 'inspirevoice'],
  status: 'draft', evaluationProfileId: 'growth',
  createdAt: 1000, createdBy: 'exec-director',
};

describe('Era 5 Phase 6 — Strategic Planning', () => {

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

  it('evaluateScenario returns dimension scores with evidence', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    engine.registerScenario(SCENARIO_A);
    const evaluation = engine.evaluateScenario('scn-001', 'growth');
    expect(evaluation).toBeDefined();
    expect(evaluation.dimensionScores.length).toBe(7);
    expect(evaluation.weightedScore).toBeGreaterThan(0);
  });

  it('evaluation is deterministic', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerAssumption(ASSUMPTION_A);
    const e1 = engine.evaluateScenario('scn-001', 'growth');
    const e2 = engine.evaluateScenario('scn-001', 'growth');
    expect(e1.weightedScore).toBe(e2.weightedScore);
    expect(e1.dimensionScores.map(d => d.score)).toEqual(e2.dimensionScores.map(d => d.score));
  });

  it('different profiles produce different weighted scores', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerScenario(SCENARIO_A);
    engine.registerAssumption(ASSUMPTION_A);
    const growthEval = engine.evaluateScenario('scn-001', 'growth');
    const stabilityEval = engine.evaluateScenario('scn-001', 'stability');
    expect(growthEval.weightedScore).not.toBe(stabilityEval.weightedScore);
  });

  it('evaluation records assumption versions used', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
    engine.registerScenario(SCENARIO_A);
    const evaluation = engine.evaluateScenario('scn-001', 'growth');
    expect(evaluation.assumptionVersions.length).toBeGreaterThanOrEqual(1);
    expect(evaluation.assumptionVersions[0].assumptionId).toBe('asm-001');
  });

  it('compareScenarios highlights strengths and weaknesses', () => {
    const engine = new StrategicPlanningEngine();
    engine.registerAssumption(ASSUMPTION_A);
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
    engine.registerAssumption(ASSUMPTION_A);
    const e1 = engine.evaluateScenario('scn-001', 'growth');
    const c1 = engine.compareScenarios([e1.id]);
    const c2 = engine.compareScenarios([e1.id]);
    expect(c1.scenarios[0].overallScore).toBe(c2.scenarios[0].overallScore);
  });
});
