import { describe, it, expect, beforeEach } from 'vitest';
import { WorkflowGraphEngineImpl, WorkflowGraphError } from '../../lib/platform/execution/workflow-graph-impl';
import { WorkflowDefinition } from '../../lib/platform/execution/workflow-graph';

describe('WorkflowGraphEngineImpl', () => {
  let engine: WorkflowGraphEngineImpl;

  beforeEach(() => {
    engine = new WorkflowGraphEngineImpl();
  });

  // ── Stage 5A — DAG Validation ──

  describe('validate', () => {
    it('accepts a valid linear workflow', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-1',
        name: 'Linear',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'delete', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(engine.validate(def).valid).toBe(true);
    });

    it('accepts a workflow with parallel branches', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-2',
        name: 'Parallel',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'write', input: {}, dependsOn: ['a', 'b'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(engine.validate(def).valid).toBe(true);
    });

    it('rejects a cyclic workflow', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-cycle',
        name: 'Cycle',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['c'], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'delete', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const result = engine.validate(def);
      expect(result.valid).toBe(false);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('rejects a self-referencing step', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-self',
        name: 'SelfCycle',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const result = engine.validate(def);
      expect(result.valid).toBe(false);
      expect(result.cycles.length).toBeGreaterThan(0);
    });

    it('reports missing dependencies', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-missing',
        name: 'Missing',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['nonexistent'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const result = engine.validate(def);
      expect(result.valid).toBe(false);
      expect(result.missingDependencies).toContain('nonexistent');
    });

    it('reports duplicate step IDs', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-dup',
        name: 'Duplicate',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'a', providerId: 'p2', operation: 'write', input: {}, dependsOn: [], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const result = engine.validate(def);
      expect(result.valid).toBe(false);
      expect(result.duplicateSteps).toContain('a');
    });

    it('rejects an empty workflow', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-empty',
        name: 'Empty',
        version: '1.0.0',
        steps: [],
        metadata: {},
      };
      const result = engine.validate(def);
      expect(result.valid).toBe(false);
      expect(result.emptyWorkflow).toBe(true);
    });

    it('accepts a single-step workflow', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-single',
        name: 'Single',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(engine.validate(def).valid).toBe(true);
    });

    it('accepts a diamond-shaped DAG', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-diamond',
        name: 'Diamond',
        version: '1.0.0',
        steps: [
          { stepId: 'start', providerId: 'p1', operation: 'init', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'left', providerId: 'p2', operation: 'process', input: {}, dependsOn: ['start'], timeoutMs: 5000 },
          { stepId: 'right', providerId: 'p3', operation: 'process', input: {}, dependsOn: ['start'], timeoutMs: 5000 },
          { stepId: 'end', providerId: 'p4', operation: 'finalize', input: {}, dependsOn: ['left', 'right'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(engine.validate(def).valid).toBe(true);
    });

    it('detects multiple cycles', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-multi-cycle',
        name: 'MultiCycle',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'delete', input: {}, dependsOn: ['d'], timeoutMs: 5000 },
          { stepId: 'd', providerId: 'p4', operation: 'create', input: {}, dependsOn: ['c'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const result = engine.validate(def);
      expect(result.valid).toBe(false);
      expect(result.cycles.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── Stage 5A — Execution Planning ──

  describe('plan', () => {
    it('produces a topological ordering for linear workflow', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-linear',
        name: 'Linear',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'delete', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const plan = engine.plan(def);
      expect(plan.workflowId).toBe('wf-linear');
      expect(plan.totalSteps).toBe(3);
      expect(plan.orderedSteps.map((s) => s.stepId)).toEqual(['a', 'b', 'c']);
    });

    it('assigns topological levels correctly', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-levels',
        name: 'Levels',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'write', input: {}, dependsOn: ['a', 'b'], timeoutMs: 5000 },
          { stepId: 'd', providerId: 'p4', operation: 'finalize', input: {}, dependsOn: ['c'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const plan = engine.plan(def);
      expect(plan.levels).toBe(3);
      const levels = new Map(plan.orderedSteps.map((s) => [s.stepId, s.level]));
      expect(levels.get('a')).toBe(0);
      expect(levels.get('b')).toBe(0);
      expect(levels.get('c')).toBe(1);
      expect(levels.get('d')).toBe(2);
    });

    it('throws for invalid workflow with cycle', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-cycle',
        name: 'Cycle',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['b'], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'write', input: {}, dependsOn: ['a'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(() => engine.plan(def)).toThrow(WorkflowGraphError);
      expect(() => engine.plan(def)).toThrow('cycle detected');
    });

    it('throws for missing dependencies', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-missing',
        name: 'Missing',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: ['nonexistent'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(() => engine.plan(def)).toThrow(WorkflowGraphError);
      expect(() => engine.plan(def)).toThrow('missing dependencies');
    });

    it('throws for empty workflow', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-empty',
        name: 'Empty',
        version: '1.0.0',
        steps: [],
        metadata: {},
      };
      expect(() => engine.plan(def)).toThrow(WorkflowGraphError);
      expect(() => engine.plan(def)).toThrow('empty workflow');
    });

    it('orders parallel steps within the same level', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-parallel',
        name: 'Parallel',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'b', providerId: 'p2', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'c', providerId: 'p3', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const plan = engine.plan(def);
      expect(plan.orderedSteps).toHaveLength(3);
      expect(plan.levels).toBe(1);
      for (const s of plan.orderedSteps) {
        expect(s.level).toBe(0);
      }
    });

    it('preserves step metadata in execution plan', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-preserve',
        name: 'Preserve',
        version: '2.0.0',
        steps: [
          { stepId: 'a', providerId: 'google-calendar', operation: 'events.get', input: { eventId: '123' }, dependsOn: [], timeoutMs: 3000 },
        ],
        metadata: { author: 'gamma' },
      };
      const plan = engine.plan(def);
      expect(plan.orderedSteps[0].providerId).toBe('google-calendar');
      expect(plan.orderedSteps[0].operation).toBe('events.get');
      expect(plan.orderedSteps[0].input).toEqual({ eventId: '123' });
      expect(plan.orderedSteps[0].timeoutMs).toBe(3000);
    });

    it('handles a diamond DAG correctly', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-diamond',
        name: 'Diamond',
        version: '1.0.0',
        steps: [
          { stepId: 'start', providerId: 'p1', operation: 'init', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'left', providerId: 'p2', operation: 'process', input: {}, dependsOn: ['start'], timeoutMs: 5000 },
          { stepId: 'right', providerId: 'p3', operation: 'process', input: {}, dependsOn: ['start'], timeoutMs: 5000 },
          { stepId: 'end', providerId: 'p4', operation: 'finalize', input: {}, dependsOn: ['left', 'right'], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      const plan = engine.plan(def);
      expect(plan.totalSteps).toBe(4);
      expect(plan.levels).toBe(3);
      const levelMap = new Map(plan.orderedSteps.map((s) => [s.stepId, s.level]));
      expect(levelMap.get('start')).toBe(0);
      expect(levelMap.get('left')).toBe(1);
      expect(levelMap.get('right')).toBe(1);
      expect(levelMap.get('end')).toBe(2);
    });

    it('throws for duplicate step IDs', () => {
      const def: WorkflowDefinition = {
        workflowId: 'wf-dup',
        name: 'Duplicate',
        version: '1.0.0',
        steps: [
          { stepId: 'a', providerId: 'p1', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
          { stepId: 'a', providerId: 'p2', operation: 'write', input: {}, dependsOn: [], timeoutMs: 5000 },
        ],
        metadata: {},
      };
      expect(() => engine.plan(def)).toThrow(WorkflowGraphError);
      expect(() => engine.plan(def)).toThrow('duplicate steps');
    });
  });
});
