import { describe, it, expect, beforeEach } from 'vitest';
import { AutonomousDecisionEngineImpl } from '../../lib/platform/execution/autonomous-decision-impl';
import { DependencyImpact, LayerHealth } from '../../lib/platform/execution/operational-state';
import { TriggeringState } from '../../lib/platform/execution/autonomous-decision';

const healthyLayer = (layer: string): LayerHealth => ({
  layer, status: 'healthy', score: 100, lastUpdated: 1000, details: 'OK',
});

const degradedLayer = (layer: string): LayerHealth => ({
  layer, status: 'degraded', score: 60, lastUpdated: 1000, details: 'Slow',
});

const unhealthyLayer = (layer: string): LayerHealth => ({
  layer, status: 'unhealthy', score: 20, lastUpdated: 1000, details: 'Down',
});

const mkState = (overrides: Partial<TriggeringState> = {}): TriggeringState => ({
  operationalState: 'healthy',
  overallScore: 100,
  activeImpacts: [],
  layerHealth: [],
  ...overrides,
});

const criticalImpact: DependencyImpact = {
  source: 'provider', type: 'unhealthy_provider', affectedLayers: ['workflow'],
  severity: 'critical', description: 'Provider p-fast is unhealthy',
  downstreamEffects: ['workflow may be affected'],
};

const majorImpact: DependencyImpact = {
  source: 'workflow', type: 'degraded_workflow', affectedLayers: ['planning', 'scheduling', 'policy'],
  severity: 'major', description: 'Workflow execution degraded',
  downstreamEffects: ['planning may be affected', 'scheduling may be affected', 'policy may be affected'],
};

describe('AutonomousDecisionEngineImpl', () => {
  let engine: AutonomousDecisionEngineImpl;

  beforeEach(() => {
    engine = new AutonomousDecisionEngineImpl();
  });

  // ── 7B.1 — Operational Decision Model ──

  describe('7B.1 — Operational Decision Model', () => {
    it('produces an operational decision with id and timestamp', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.id).toBeDefined();
      expect(decision.timestamp).toBeGreaterThan(0);
    });

    it('produces immutable decision objects', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.selectedAction.action).toBe('no_action');
      expect(decision.alternatives.length).toBeGreaterThan(0);
    });

    it('includes triggering state in the decision', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60 });
      const decision = engine.evaluate(state);
      expect(decision.triggeringState.operationalState).toBe('degraded');
      expect(decision.triggeringState.overallScore).toBe(60);
    });
  });

  // ── 7B.2 — Risk Scoring ──

  describe('7B.2 — Risk Scoring', () => {
    it('reports zero risk for healthy state', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.riskAssessment.overallRisk).toBe(0);
    });

    it('reports elevated risk for degraded state', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60, layerHealth: [degradedLayer('provider')] });
      const decision = engine.evaluate(state);
      expect(decision.riskAssessment.overallRisk).toBeGreaterThan(0);
    });

    it('reports high risk for failed state with impacts', () => {
      const state = mkState({
        operationalState: 'failed', overallScore: 20,
        activeImpacts: [criticalImpact],
        layerHealth: [unhealthyLayer('provider')],
      });
      const decision = engine.evaluate(state);
      expect(decision.riskAssessment.overallRisk).toBeGreaterThan(50);
    });

    it('includes risk factors with descriptions', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60, layerHealth: [degradedLayer('provider')] });
      const decision = engine.evaluate(state);
      for (const factor of decision.riskAssessment.factors) {
        expect(factor.name).toBeDefined();
        expect(factor.description.length).toBeGreaterThan(0);
        expect(factor.score).toBeGreaterThan(0);
      }
    });
  });

  // ── 7B.3 — Candidate Action Evaluation ──

  describe('7B.3 — Candidate Action Evaluation', () => {
    it('recommends no_action for healthy state', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.selectedAction.action).toBe('no_action');
    });

    it('recommends monitor for degraded state', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.action).toBe('monitor');
    });

    it('recommends initiate_recovery for failed state', () => {
      const state = mkState({ operationalState: 'failed', overallScore: 20 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.action).toBe('initiate_recovery');
    });

    it('recommends monitor for recovering state', () => {
      const state = mkState({ operationalState: 'recovering', overallScore: 70 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.action).toBe('monitor');
    });

    it('recommends no_action for maintenance state', () => {
      const state = mkState({ operationalState: 'maintenance', overallScore: 100 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.action).toBe('no_action');
    });

    it('recommends no_action for paused state', () => {
      const state = mkState({ operationalState: 'paused', overallScore: 100 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.action).toBe('no_action');
    });

    it('includes alternative candidates in decision', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60 });
      const decision = engine.evaluate(state);
      expect(decision.alternatives.length).toBeGreaterThan(0);
    });

    it('each candidate has rationale', () => {
      const state = mkState({ operationalState: 'failed', overallScore: 20 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.rationale.length).toBeGreaterThan(0);
      for (const alt of decision.alternatives) {
        expect(alt.rationale.length).toBeGreaterThan(0);
      }
    });

    it('rejects inappropriate candidates', () => {
      const state = mkState({ operationalState: 'healthy', overallScore: 100 });
      const decision = engine.evaluate(state);
      for (const alt of decision.alternatives) {
        if (alt.action === 'initiate_recovery') {
          expect(alt.rejected).toBe(true);
        }
      }
    });

    it('selects highest confidence non-rejected candidate', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60 });
      const decision = engine.evaluate(state);
      expect(decision.selectedAction.rejected).toBe(false);
      const allActive = [decision.selectedAction, ...decision.alternatives]
        .filter((c) => !c.rejected);
      const best = allActive.sort((a, b) => b.confidence - a.confidence)[0];
      expect(best.action).toBe(decision.selectedAction.action);
    });
  });

  // ── 7B.4 — Decision Trace ──

  describe('7B.4 — Decision Trace', () => {
    it('includes a complete audit record', () => {
      const decision = engine.evaluate(mkState({ operationalState: 'degraded' }));
      const audit = decision.auditRecord;
      expect(audit.decisionId).toBe(decision.id);
      expect(audit.timestamp).toBe(decision.timestamp);
      expect(audit.selectedAction).toBe(decision.selectedAction.action);
    });

    it('records input summary in audit record', () => {
      const state = mkState({
        operationalState: 'failed',
        overallScore: 20,
        activeImpacts: [criticalImpact],
        layerHealth: [unhealthyLayer('provider')],
      });
      const audit = engine.evaluate(state).auditRecord;
      expect(audit.inputs.operationalState).toBe('failed');
      expect(audit.inputs.activeImpacts).toBe(1);
      expect(audit.inputs.layerHealthCount).toBe(1);
    });

    it('records evaluated rules', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.auditRecord.evaluatedRules.length).toBeGreaterThan(0);
      expect(decision.auditRecord.evaluatedRules).toContain('state_transition_rules');
    });

    it('records rejected alternatives', () => {
      const state = mkState({ operationalState: 'failed', overallScore: 20 });
      const audit = engine.evaluate(state).auditRecord;
      expect(audit.rejectedAlternatives.length).toBeGreaterThan(0);
    });

    it('records policy references', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.auditRecord.policyReferences).toContain('G-044');
      expect(decision.policyReferences).toContain('G-044');
    });
  });

  // ── G-044 — Explainable Autonomous Decisions ──

  describe('G-044 — Explainable Autonomous Decisions', () => {
    it('produces identical decisions for identical state', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60, layerHealth: [degradedLayer('provider')] });

      const e1 = new AutonomousDecisionEngineImpl();
      const e2 = new AutonomousDecisionEngineImpl();
      const d1 = e1.evaluate(state);
      const d2 = e2.evaluate(state);

      expect(d1.selectedAction.action).toBe(d2.selectedAction.action);
      expect(d1.selectedAction.confidence).toBe(d2.selectedAction.confidence);
      expect(d1.selectedAction.riskScore).toBe(d2.selectedAction.riskScore);
      expect(d1.selectedAction.rationale).toBe(d2.selectedAction.rationale);
    });

    it('produces identical risk assessments across instances', () => {
      const state = mkState({
        operationalState: 'failed', overallScore: 20,
        activeImpacts: [criticalImpact],
        layerHealth: [unhealthyLayer('provider')],
      });

      const e1 = new AutonomousDecisionEngineImpl();
      const e2 = new AutonomousDecisionEngineImpl();
      expect(e1.evaluate(state).riskAssessment.overallRisk)
        .toBe(e2.evaluate(state).riskAssessment.overallRisk);
    });

    it('produces identical audit records for identical inputs', () => {
      const state = mkState({ operationalState: 'degraded', overallScore: 60 });

      const e1 = new AutonomousDecisionEngineImpl();
      const e2 = new AutonomousDecisionEngineImpl();
      const a1 = e1.evaluate(state).auditRecord;
      const a2 = e2.evaluate(state).auditRecord;

      expect(a1.selectedAction).toBe(a2.selectedAction);
      expect(a1.evaluatedRules).toEqual(a2.evaluatedRules);
      expect(a1.inputs).toEqual(a2.inputs);
    });
  });

  // ── Architectural Boundary ──

  describe('Architectural Boundary', () => {
    it('recommends actions without executing them', () => {
      const decision = engine.evaluate(mkState({ operationalState: 'failed' }));
      expect(decision.selectedAction.action).toBe('initiate_recovery');
      expect((engine as any).executeRecovery).toBeUndefined();
      expect((engine as any).reroute).toBeUndefined();
    });

    it('recommends without modifying plans', () => {
      const decision = engine.evaluate(mkState());
      expect(decision.selectedAction).toBeDefined();
      expect((engine as any).modifyPlan).toBeUndefined();
    });

    it('recommends without reprioritizing scheduling', () => {
      engine.evaluate(mkState());
      expect((engine as any).reprioritize).toBeUndefined();
    });

    it('recommends without invoking provider APIs', () => {
      engine.evaluate(mkState());
      expect((engine as any).invokeProvider).toBeUndefined();
    });
  });
});
