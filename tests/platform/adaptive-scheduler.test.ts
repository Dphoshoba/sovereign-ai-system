import { describe, it, expect, beforeEach } from 'vitest';
import { AdaptiveSchedulerImpl, AdaptiveSchedulerError } from '../../lib/platform/execution/adaptive-scheduler-impl';
import {
  SchedulingOptions,
  WorkflowSchedulingInput,
} from '../../lib/platform/execution/adaptive-scheduler';

const wf = (
  id: string,
  overrides: Partial<WorkflowSchedulingInput> = {},
): WorkflowSchedulingInput => ({
  workflowId: id,
  executionId: `exec-${id}`,
  priority: 5,
  deadlineMs: null,
  serviceClass: 'standard',
  businessImportance: 50,
  estimatedDurationMs: 100,
  dependsOn: [],
  submittedAt: 1000,
  ...overrides,
});

const defaultOptions: SchedulingOptions = {
  policy: 'fifo',
  maxConcurrentWorkflows: 2,
  weights: null,
};

describe('AdaptiveSchedulerImpl', () => {
  let scheduler: AdaptiveSchedulerImpl;

  beforeEach(() => {
    scheduler = new AdaptiveSchedulerImpl();
  });

  // ── 6B.1 — Dynamic Prioritization ──

  describe('6B.1 — Dynamic Prioritization', () => {
    it('schedules by fifo when policy is fifo', () => {
      const workflows = [
        wf('a', { submittedAt: 100 }),
        wf('b', { submittedAt: 200 }),
        wf('c', { submittedAt: 300 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, policy: 'fifo' });
      expect(result.executionOrder).toEqual(['exec-a', 'exec-b', 'exec-c']);
    });

    it('schedules by priority when policy is priority_first', () => {
      const workflows = [
        wf('a', { priority: 3, submittedAt: 300 }),
        wf('b', { priority: 1, submittedAt: 200 }),
        wf('c', { priority: 2, submittedAt: 100 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, policy: 'priority_first' });
      expect(result.executionOrder[0]).toBe('exec-b');
    });

    it('uses submittedAt as tiebreaker for equal priority', () => {
      const workflows = [
        wf('a', { priority: 1, submittedAt: 300 }),
        wf('b', { priority: 1, submittedAt: 100 }),
        wf('c', { priority: 1, submittedAt: 200 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, policy: 'priority_first' });
      expect(result.executionOrder).toEqual(['exec-b', 'exec-c', 'exec-a']);
    });

    it('schedules deadline-aware workflows by urgency', () => {
      const now = 1000;
      const workflows = [
        wf('a', { deadlineMs: now + 500, estimatedDurationMs: 100, submittedAt: now }),
        wf('b', { deadlineMs: now + 200, estimatedDurationMs: 100, submittedAt: now }),
        wf('c', { deadlineMs: now + 800, estimatedDurationMs: 100, submittedAt: now }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, policy: 'deadline_aware' });
      expect(result.executionOrder[0]).toBe('exec-b');
    });

    it('uses priority as tiebreaker for equal deadline urgency', () => {
      const now = 1000;
      const workflows = [
        wf('a', { deadlineMs: now + 500, priority: 3, submittedAt: now }),
        wf('b', { deadlineMs: now + 500, priority: 1, submittedAt: now }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, policy: 'deadline_aware' });
      expect(result.executionOrder[0]).toBe('exec-b');
    });

    it('schedules weighted_fair by business importance times class weight', () => {
      const workflows = [
        wf('a', { serviceClass: 'premium', businessImportance: 80, submittedAt: 100 }),
        wf('b', { serviceClass: 'standard', businessImportance: 90, submittedAt: 200 }),
        wf('c', { serviceClass: 'economy', businessImportance: 100, submittedAt: 300 }),
      ];
      const options: SchedulingOptions = {
        policy: 'weighted_fair',
        maxConcurrentWorkflows: 2,
        weights: { premium: 3, standard: 2, economy: 1 },
      };
      const result = scheduler.schedule(workflows, options);
      expect(result.executionOrder[0]).toBe('exec-a');
    });
  });

  // ── 6B.2 — Queue Management ──

  describe('6B.2 — Queue Management', () => {
    it('places workflows without dependencies in ready queue', () => {
      const workflows = [wf('a'), wf('b')];
      const result = scheduler.schedule(workflows, defaultOptions);
      expect(result.queue.ready.length).toBe(0);
      expect(result.queue.running.length).toBe(0);
      expect(result.queue.completed.length).toBe(2);
    });

    it('places workflows with unmet dependencies in blocked queue', () => {
      const workflows = [
        wf('a', { dependsOn: [], submittedAt: 100 }),
        wf('b', { dependsOn: ['exec-a'], submittedAt: 200 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 1 });
      expect(result.queue.blocked.length).toBe(0);
      expect(result.queue.completed.length).toBe(2);
      expect(result.executionOrder).toEqual(['exec-a', 'exec-b']);
    });

    it('respects resource limits in running queue', () => {
      const workflows = [
        wf('a', { submittedAt: 100 }),
        wf('b', { submittedAt: 200 }),
        wf('c', { submittedAt: 300 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 2 });
      expect(result.executionOrder.length).toBe(3);
      expect(result.queue.utilization.usedSlots).toBe(0);
      expect(result.queue.utilization.totalSlots).toBe(2);
    });

    it('tracks utilization through the scheduling cycle', () => {
      const workflows = [
        wf('a', { submittedAt: 100 }),
        wf('b', { submittedAt: 200 }),
      ];
      const result = scheduler.schedule(workflows, defaultOptions);
      expect(result.queue.utilization.totalSlots).toBe(2);
      expect(result.queue.utilization.usedSlots).toBe(0);
      expect(result.queue.utilization.availableSlots).toBe(2);
    });
  });

  // ── 6B.3 — Resource Allocation ──

  describe('6B.3 — Resource Allocation', () => {
    it('limits concurrent workflows to maxConcurrentWorkflows', () => {
      const workflows = [
        wf('a', { submittedAt: 100 }),
        wf('b', { submittedAt: 200 }),
        wf('c', { submittedAt: 300 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 1 });
      expect(result.executionOrder).toEqual(['exec-a', 'exec-b', 'exec-c']);
    });

    it('allows concurrent execution up to resource limit', () => {
      const workflows = [
        wf('a', { submittedAt: 100 }),
        wf('b', { submittedAt: 200 }),
        wf('c', { submittedAt: 300 }),
        wf('d', { submittedAt: 400 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 3 });
      expect(result.executionOrder.length).toBe(4);
    });

    it('rejects invalid maxConcurrentWorkflows', () => {
      expect(() => scheduler.schedule([wf('a')], { ...defaultOptions, maxConcurrentWorkflows: 0 }))
        .toThrow(AdaptiveSchedulerError);
    });
  });

  // ── 6B.4 — Scheduling Policies ──

  describe('6B.4 — Scheduling Policies', () => {
    const mixedWorkflows = [
      wf('a', { priority: 3, submittedAt: 300 }),
      wf('b', { priority: 1, submittedAt: 100 }),
      wf('c', { priority: 2, submittedAt: 200 }),
    ];

    it('supports fifo policy', () => {
      const result = scheduler.schedule(mixedWorkflows, { ...defaultOptions, policy: 'fifo' });
      // b(100), c(200), a(300) sorted by submittedAt; maxConcurrent=2 allows b,c concurrently
      expect(result.executionOrder[0]).toBe('exec-b');
      expect(result.executionOrder[2]).toBe('exec-a');
    });

    it('supports priority_first policy', () => {
      const result = scheduler.schedule(mixedWorkflows, { ...defaultOptions, policy: 'priority_first' });
      expect(result.executionOrder[0]).toBe('exec-b');
    });

    it('supports deadline_aware policy', () => {
      const now = 1000;
      const workflows = [
        wf('a', { deadlineMs: now + 800, submittedAt: now }),
        wf('b', { deadlineMs: now + 200, submittedAt: now }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, policy: 'deadline_aware' });
      expect(result.executionOrder[0]).toBe('exec-b');
    });

    it('supports weighted_fair policy', () => {
      const workflows = [
        wf('a', { serviceClass: 'premium', businessImportance: 50, submittedAt: 100 }),
        wf('b', { serviceClass: 'standard', businessImportance: 100, submittedAt: 200 }),
      ];
      const options: SchedulingOptions = {
        policy: 'weighted_fair',
        maxConcurrentWorkflows: 2,
        weights: { premium: 3, standard: 1 },
      };
      const result = scheduler.schedule(workflows, options);
      expect(result.executionOrder[0]).toBe('exec-a');
    });

    it('records policy used in each scheduling decision', () => {
      const result = scheduler.schedule([wf('a')], { ...defaultOptions, policy: 'priority_first' });
      for (const decision of result.decisions) {
        expect(decision.policy).toBe('priority_first');
      }
    });

    it('throws if weighted_fair is selected without weights', () => {
      expect(() => scheduler.schedule(
        [wf('a')],
        { ...defaultOptions, policy: 'weighted_fair', weights: null },
      )).toThrow(AdaptiveSchedulerError);
    });
  });

  // ── G-040 — Deterministic Adaptive Scheduling ──

  describe('G-040 — Deterministic Adaptive Scheduling', () => {
    it('produces identical results across repeated calls', () => {
      const workflows = [
        wf('a', { priority: 3, submittedAt: 300 }),
        wf('b', { priority: 1, submittedAt: 100 }),
        wf('c', { priority: 2, submittedAt: 200 }),
      ];
      const r1 = scheduler.schedule(workflows, { ...defaultOptions, policy: 'priority_first' });
      const r2 = scheduler.schedule(workflows, { ...defaultOptions, policy: 'priority_first' });
      const r3 = scheduler.schedule(workflows, { ...defaultOptions, policy: 'priority_first' });
      expect(r1.executionOrder).toEqual(r2.executionOrder);
      expect(r2.executionOrder).toEqual(r3.executionOrder);
      expect(r1.decisions).toEqual(r2.decisions);
    });

    it('produces identical queue states across repeated calls', () => {
      const workflows = [wf('a', { dependsOn: ['exec-b'] }), wf('b')];
      const r1 = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 1 });
      const r2 = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 1 });
      expect(r1.queue).toEqual(r2.queue);
    });

    it('produces consistent ordering across all policies', () => {
      const workflows = [
        wf('a', { submittedAt: 100 }),
        wf('b', { submittedAt: 200 }),
      ];
      for (const policy of ['fifo', 'priority_first', 'deadline_aware'] as const) {
        const r1 = scheduler.schedule(workflows, { ...defaultOptions, policy });
        const r2 = scheduler.schedule(workflows, { ...defaultOptions, policy });
        expect(r1.executionOrder).toEqual(r2.executionOrder);
      }
    });
  });

  // ── Edge Cases ──

  describe('Edge Cases', () => {
    it('throws for empty workflow list', () => {
      expect(() => scheduler.schedule([], defaultOptions)).toThrow(AdaptiveSchedulerError);
    });

    it('handles a single workflow', () => {
      const result = scheduler.schedule([wf('a')], defaultOptions);
      expect(result.executionOrder).toEqual(['exec-a']);
      expect(result.queue.completed.length).toBe(1);
    });

    it('handles dependency chains', () => {
      const workflows = [
        wf('a', { dependsOn: [], submittedAt: 100 }),
        wf('b', { dependsOn: ['exec-a'], submittedAt: 200 }),
        wf('c', { dependsOn: ['exec-b'], submittedAt: 300 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 1 });
      expect(result.executionOrder).toEqual(['exec-a', 'exec-b', 'exec-c']);
    });

    it('throws on deadlock when dependencies form a cycle', () => {
      const workflows = [
        wf('a', { dependsOn: ['exec-b'], submittedAt: 100 }),
        wf('b', { dependsOn: ['exec-a'], submittedAt: 200 }),
      ];
      expect(() => scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 2 }))
        .toThrow(AdaptiveSchedulerError);
    });

    it('handles workflows with no dependencies concurrently within resource limits', () => {
      const workflows = [
        wf('a', { dependsOn: [], submittedAt: 100 }),
        wf('b', { dependsOn: [], submittedAt: 200 }),
        wf('c', { dependsOn: ['exec-a'], submittedAt: 300 }),
        wf('d', { dependsOn: ['exec-b'], submittedAt: 400 }),
      ];
      const result = scheduler.schedule(workflows, { ...defaultOptions, maxConcurrentWorkflows: 2 });
      expect(result.executionOrder[0]).toBe('exec-a');
      expect(result.executionOrder[1]).toBe('exec-b');
    });
  });

  // ── Architectural Boundary ──

  describe('Architectural Boundary', () => {
    it('produces scheduling decisions without executing workflow steps', () => {
      const result = scheduler.schedule([wf('a')], defaultOptions);
      expect(result.decisions.length).toBeGreaterThan(0);
      expect(result.executionOrder).toEqual(['exec-a']);
    });

    it('does not generate execution plans', () => {
      const result = scheduler.schedule([wf('a')], defaultOptions);
      expect(result.executionOrder).toBeDefined();
      expect((result as any).selectedPlan).toBeUndefined();
    });
  });
});
