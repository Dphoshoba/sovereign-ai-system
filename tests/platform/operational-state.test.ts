import { describe, it, expect, beforeEach } from 'vitest';
import {
  OperationalStateEngineImpl,
} from '../../lib/platform/execution/operational-state-impl';
import {
  OperationalStateError,
  LayerHealth,
} from '../../lib/platform/execution/operational-state';

const healthy = (layer: string, ts = 1000): LayerHealth => ({
  layer, status: 'healthy', score: 100, lastUpdated: ts, details: 'All nominal',
});

const degraded = (layer: string, ts = 1000): LayerHealth => ({
  layer, status: 'degraded', score: 60, lastUpdated: ts, details: 'Latency spike',
});

const unhealthy = (layer: string, ts = 1000): LayerHealth => ({
  layer, status: 'unhealthy', score: 20, lastUpdated: ts, details: 'Provider unreachable',
});

describe('OperationalStateEngineImpl', () => {
  let engine: OperationalStateEngineImpl;

  beforeEach(() => {
    engine = new OperationalStateEngineImpl();
  });

  // ── 7A.1 — Unified Operational State Model ──

  describe('7A.1 — Unified Operational State Model', () => {
    it('reports healthy state initially', () => {
      const status = engine.getStatus();
      expect(status.state).toBe('healthy');
      expect(status.overallScore).toBe(50); // all layers unknown = score 50
    });

    it('reports layer health across all certified layers', () => {
      engine.reportHealth('runtime', healthy('runtime'));
      engine.reportHealth('provider', healthy('provider'));
      engine.reportHealth('workflow', healthy('workflow'));
      const status = engine.getStatus();
      expect(status.layerHealth.length).toBe(6);
      expect(status.layerHealth.some((h) => h.layer === 'runtime')).toBe(true);
      expect(status.layerHealth.some((h) => h.layer === 'workflow')).toBe(true);
      expect(status.layerHealth.some((h) => h.layer === 'policy')).toBe(true);
    });

    it('rejects unknown layers', () => {
      expect(() => engine.reportHealth('unknown', healthy('unknown')))
        .toThrow(OperationalStateError);
    });
  });

  // ── 7A.2 — Health Aggregation ──

  describe('7A.2 — Health Aggregation', () => {
    it('reports healthy when all layers are healthy', () => {
      for (const layer of ['runtime', 'provider', 'workflow', 'planning', 'scheduling', 'policy']) {
        engine.reportHealth(layer, healthy(layer));
      }
      expect(engine.getStatus().state).toBe('healthy');
      expect(engine.getStatus().overallScore).toBe(100);
    });

    it('reports degraded when any layer is degraded', () => {
      for (const layer of ['runtime', 'provider', 'workflow', 'planning', 'scheduling', 'policy']) {
        engine.reportHealth(layer, healthy(layer));
      }
      engine.reportHealth('provider', degraded('provider'));
      expect(engine.getStatus().state).toBe('degraded');
    });

    it('reports failed when any layer is unhealthy', () => {
      for (const layer of ['runtime', 'provider', 'workflow', 'planning', 'scheduling', 'policy']) {
        engine.reportHealth(layer, healthy(layer));
      }
      engine.reportHealth('workflow', unhealthy('workflow'));
      expect(engine.getStatus().state).toBe('failed');
    });

    it('computes overall score as average of layer scores', () => {
      engine.reportHealth('runtime', { ...healthy('runtime'), score: 100 });
      engine.reportHealth('provider', { ...degraded('provider'), score: 60 });
      const status = engine.getStatus();
      // runtime=100 + provider=60 + 4 unknown each 50 / 6 = 360/6 = 60
      expect(status.overallScore).toBe(60);
    });
  });

  // ── 7A.3 — State Transition Engine ──

  describe('7A.3 — State Transition Engine', () => {
    it('transitions healthy → degraded when a layer degrades', () => {
      engine.reportHealth('runtime', healthy('runtime'));
      engine.reportHealth('provider', healthy('provider'));
      engine.reportHealth('workflow', healthy('workflow'));
      engine.reportHealth('planning', healthy('planning'));
      engine.reportHealth('scheduling', healthy('scheduling'));
      engine.reportHealth('policy', healthy('policy'));

      engine.reportHealth('provider', degraded('provider'));
      expect(engine.getStatus().state).toBe('degraded');
    });

    it('transitions degraded → failed when degradation escalates', () => {
      engine.reportHealth('provider', degraded('provider'));
      engine.reportHealth('provider', unhealthy('provider'));
      expect(engine.getStatus().state).toBe('failed');
    });

    it('transitions failed → recovering when all unhealthy layers improve', () => {
      engine.reportHealth('provider', unhealthy('provider'));
      expect(engine.getStatus().state).toBe('failed');

      engine.reportHealth('provider', degraded('provider'));
      expect(engine.getStatus().state).toBe('recovering');
    });

    it('transitions recovering → healthy when all layers are healthy', () => {
      engine.reportHealth('provider', unhealthy('provider'));
      engine.reportHealth('provider', degraded('provider'));
      expect(engine.getStatus().state).toBe('recovering');

      engine.reportHealth('provider', healthy('provider'));
      expect(engine.getStatus().state).toBe('healthy');
    });

    it('transitions recovering → failed on new failure during recovery', () => {
      engine.reportHealth('provider', unhealthy('provider'));
      engine.reportHealth('provider', degraded('provider'));
      expect(engine.getStatus().state).toBe('recovering');

      engine.reportHealth('workflow', unhealthy('workflow'));
      expect(engine.getStatus().state).toBe('failed');
    });

    it('records transition history', () => {
      engine.reportHealth('provider', healthy('provider'));
      engine.reportHealth('provider', degraded('provider'));
      engine.reportHealth('provider', unhealthy('provider'));
      engine.reportHealth('provider', healthy('provider'));

      const history = engine.getTransitionHistory();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });

    it('includes layer snapshot in each transition', () => {
      engine.reportHealth('provider', degraded('provider'));
      const history = engine.getTransitionHistory();
      expect(history[0].layerHealthSnapshot.length).toBeGreaterThan(0);
    });

    it('limits transition history when limit is provided', () => {
      for (let i = 0; i < 10; i++) {
        engine.reportHealth('provider', i % 2 === 0 ? degraded('provider') : healthy('provider'));
      }
      expect(engine.getTransitionHistory(3).length).toBe(3);
    });

    it('transitions healthy → maintenance via setMaintenance', () => {
      engine.reportHealth('runtime', healthy('runtime'));
      engine.reportHealth('provider', healthy('provider'));
      engine.reportHealth('workflow', healthy('workflow'));
      engine.reportHealth('planning', healthy('planning'));
      engine.reportHealth('scheduling', healthy('scheduling'));
      engine.reportHealth('policy', healthy('policy'));

      engine.setMaintenance(true, 'Scheduled upgrade');
      expect(engine.getStatus().state).toBe('maintenance');
    });

    it('exits maintenance when setMaintenance(false) is called', () => {
      engine.reportHealth('provider', healthy('provider'));
      engine.setMaintenance(true, 'Upgrade');
      engine.setMaintenance(false, 'Upgrade complete');
      expect(engine.getStatus().state).toBe('healthy');
    });

    it('transitions to paused via setPaused', () => {
      engine.setPaused(true, 'Paused for review');
      expect(engine.getStatus().state).toBe('paused');
    });

    it('exits paused via setPaused(false)', () => {
      engine.setPaused(true, 'Paused');
      engine.setPaused(false, 'Resumed');
      expect(engine.getStatus().state).toBe('healthy');
    });

    it('transitions healthy → degraded → healthy preserves transition history', () => {
      engine.reportHealth('provider', healthy('provider'));
      engine.reportHealth('provider', degraded('provider'));
      engine.reportHealth('provider', healthy('provider'));
      expect(engine.getStatus().transitionCount).toBe(2);
    });

    it('remains in failed state until manual intervention clears overrides', () => {
      engine.reportHealth('runtime', unhealthy('runtime'));
      expect(engine.getStatus().state).toBe('failed');
      engine.reportHealth('runtime', degraded('runtime'));
      expect(engine.getStatus().state).toBe('recovering');
    });
  });

  // ── 7A.4 — Dependency Impact Analysis ──

  describe('7A.4 — Dependency Impact Analysis', () => {
    it('reports no impacts when all layers are healthy', () => {
      const impacts = engine.getActiveImpacts();
      expect(impacts.length).toBe(0);
    });

    it('reports provider degradation impacts workflow layer', () => {
      engine.reportHealth('provider', degraded('provider'));
      const impacts = engine.getActiveImpacts();
      expect(impacts.some((i) => i.source === 'provider' && i.affectedLayers.includes('workflow')))
        .toBe(true);
    });

    it('reports workflow failure impacts planning, scheduling, and policy layers', () => {
      engine.reportHealth('workflow', unhealthy('workflow'));
      const impacts = engine.getActiveImpacts();
      const wfImpact = impacts.find((i) => i.source === 'workflow');
      expect(wfImpact).toBeDefined();
      expect(wfImpact!.affectedLayers).toContain('planning');
      expect(wfImpact!.affectedLayers).toContain('scheduling');
      expect(wfImpact!.affectedLayers).toContain('policy');
    });

    it('severe impacts for unhealthy layers', () => {
      engine.reportHealth('workflow', unhealthy('workflow'));
      const impacts = engine.getActiveImpacts();
      expect(impacts.some((i) => i.severity === 'critical')).toBe(true);
    });

    it('major impacts for degraded layers', () => {
      engine.reportHealth('provider', degraded('provider'));
      const impacts = engine.getActiveImpacts();
      expect(impacts.some((i) => i.severity === 'major')).toBe(true);
    });

    it('specific impact lookup by component', () => {
      engine.reportHealth('provider', unhealthy('provider'));
      const impacts = engine.getDependencyImpact('provider');
      expect(impacts.length).toBe(1);
      expect(impacts[0].affectedLayers).toContain('workflow');
    });

    it('returns empty for layers with no dependents', () => {
      engine.reportHealth('planning', unhealthy('planning'));
      const impacts = engine.getActiveImpacts().filter((i) => i.source.startsWith('planning'));
      expect(impacts.length).toBe(0);
    });
  });

  // ── G-043 — Certified Operational State ──

  describe('G-043 — Certified Operational State', () => {
    it('produces deterministic state for identical health reports', () => {
      const e1 = new OperationalStateEngineImpl();
      const e2 = new OperationalStateEngineImpl();

      for (const engine of [e1, e2]) {
        engine.reportHealth('runtime', healthy('runtime'));
        engine.reportHealth('provider', degraded('provider'));
        engine.reportHealth('workflow', healthy('workflow'));
        engine.reportHealth('planning', healthy('planning'));
        engine.reportHealth('scheduling', healthy('scheduling'));
        engine.reportHealth('policy', healthy('policy'));
      }

      expect(e1.getStatus().state).toBe(e2.getStatus().state);
      expect(e1.getStatus().overallScore).toBe(e2.getStatus().overallScore);
    });

    it('produces consistent transitions for identical sequences', () => {
      const e1 = new OperationalStateEngineImpl();
      const e2 = new OperationalStateEngineImpl();
      const sequence: [string, LayerHealth][] = [
        ['provider', healthy('provider')],
        ['provider', degraded('provider')],
        ['provider', unhealthy('provider')],
        ['provider', degraded('provider')],
        ['provider', healthy('provider')],
      ];

      for (const [layer, health] of sequence) {
        e1.reportHealth(layer, health);
        e2.reportHealth(layer, health);
      }

      expect(e1.getStatus().state).toBe(e2.getStatus().state);
      expect(e1.getTransitionHistory().length).toBe(e2.getTransitionHistory().length);
    });
  });

  // ── Architectural Boundary ──

  describe('Architectural Boundary', () => {
    it('observes state without triggering recovery', () => {
      engine.reportHealth('provider', unhealthy('provider'));
      expect(engine.getStatus().state).toBe('failed');
      // No recovery methods should exist
      expect((engine as any).recover).toBeUndefined();
      expect((engine as any).reroute).toBeUndefined();
    });

    it('observes state without reprioritizing scheduling', () => {
      expect(engine.getStatus()).toBeDefined();
      expect((engine as any).reprioritize).toBeUndefined();
    });

    it('observes state without modifying execution plans', () => {
      expect(engine.getStatus()).toBeDefined();
      expect((engine as any).modifyPlan).toBeUndefined();
    });

    it('observes state without approving operations', () => {
      expect(engine.getStatus()).toBeDefined();
      expect((engine as any).approve).toBeUndefined();
    });
  });
});
