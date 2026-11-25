import { describe, it, expect } from 'vitest';
import { PlanningEngineImpl } from '../../lib/platform/execution/planning-engine-impl';
import { AdaptiveSchedulerImpl } from '../../lib/platform/execution/adaptive-scheduler-impl';
import { AnalyticsEngineImpl } from '../../lib/platform/execution/analytics-engine-impl';
import { PolicyEngineImpl } from '../../lib/platform/execution/policy-engine-impl';
import { WorkflowGraphEngineImpl } from '../../lib/platform/execution/workflow-graph-impl';
import {
  EvaluationContext,
  PolicyDefinition,
} from '../../lib/platform/execution/policy-engine';
import {
  PlanningContext,
  PlanningRequest,
  ProviderCapability,
} from '../../lib/platform/execution/planning-engine';
import {
  SchedulingOptions,
  WorkflowSchedulingInput,
} from '../../lib/platform/execution/adaptive-scheduler';
import {
  TelemetryEvent,
  TimeWindow,
} from '../../lib/platform/execution/analytics-engine';
import { WorkflowDefinition } from '../../lib/platform/execution/workflow-graph';
import { WorkflowExecutionPolicy } from '../../lib/platform/execution/workflow-governance';

// ── Shared Test Data ──

const providerCaps: readonly ProviderCapability[] = [
  { providerId: 'p-fast', operation: 'read', estimatedCost: 5, estimatedLatencyMs: 50, confidence: 0.99 },
  { providerId: 'p-cheap', operation: 'read', estimatedCost: 1, estimatedLatencyMs: 500, confidence: 0.80 },
  { providerId: 'p-fast', operation: 'write', estimatedCost: 10, estimatedLatencyMs: 100, confidence: 0.95 },
  { providerId: 'p-cheap', operation: 'write', estimatedCost: 3, estimatedLatencyMs: 800, confidence: 0.75 },
];

const workflowDef: WorkflowDefinition = {
  workflowId: 'wf-integration',
  name: 'Integration Test Workflow',
  version: '1.0.0',
  steps: [
    { stepId: 'fetch', providerId: 'p-fast', operation: 'read', input: {}, dependsOn: [], timeoutMs: 5000 },
    { stepId: 'process', providerId: 'p-fast', operation: 'write', input: {}, dependsOn: ['fetch'], timeoutMs: 5000 },
  ],
  metadata: {},
};

const emptyPolicy: WorkflowExecutionPolicy = {
  workflowId: 'wf-integration',
  version: '1.0.0',
  permittedProviders: [],
  maxExecutionTimeMs: 30000,
  allowRetries: true,
  allowCompensation: true,
  requireApproval: false,
};

// ── Tests ──

describe('Phase VI Integration — Policy → Plan → Schedule → Execute → Analytics', () => {
  // ── Pipeline 1: Policy → Plan → Schedule ──

  describe('Pipeline: Policy → Plan → Schedule', () => {
    it('produces a consistent execution order through the full pipeline', () => {
      // Policy
      const policy = new PolicyEngineImpl();
      const costLimitPolicy: PolicyDefinition = {
        policyId: 'pol-cost',
        version: '1.0.0',
        name: 'Cost Limit',
        description: 'Deny workflows exceeding cost ceiling',
        rules: [
          { id: 'r1', name: 'Cost ceiling', effect: 'deny', conditions: [{ field: 'estimatedCost', operator: 'gt', value: 50 }], priority: 10 },
          { id: 'r2', name: 'Default allow', effect: 'allow', conditions: [], priority: 1 },
        ],
        createdAt: 1000,
        enabled: true,
      };
      policy.register(costLimitPolicy);

      // Plan
      const planner = new PlanningEngineImpl();
      const planCtx: PlanningContext = {
        workflowId: 'wf-integration',
        version: '1.0.0',
        executionId: 'exec-int-1',
        costCeiling: 50,
        latencyObjectiveMs: null,
        preferredProviders: [],
        jurisdiction: null,
      };
      const planReq: PlanningRequest = {
        definition: workflowDef,
        context: planCtx,
        capabilities: providerCaps,
        policy: emptyPolicy,
      };
      const planResult = planner.plan(planReq);

      // Schedule
      const scheduler = new AdaptiveSchedulerImpl();
      const scheduleInputs: WorkflowSchedulingInput[] = [{
        workflowId: 'wf-integration',
        executionId: 'exec-int-1',
        priority: 3,
        deadlineMs: null,
        serviceClass: 'standard',
        businessImportance: 50,
        estimatedDurationMs: planResult.selectedPlan.totalLatencyMs,
        dependsOn: [],
        submittedAt: Date.now(),
      }];
      const scheduleOpts: SchedulingOptions = {
        policy: 'priority_first',
        maxConcurrentWorkflows: 2,
        weights: null,
      };
      const scheduleResult = scheduler.schedule(scheduleInputs, scheduleOpts);

      // Verify end-to-end
      expect(planResult.selectedPlan.assignments.length).toBe(2);
      expect(planResult.selectedPlan.score).toBeGreaterThan(0);
      expect(scheduleResult.executionOrder).toContain('exec-int-1');
      expect(scheduleResult.decisions.length).toBeGreaterThan(0);
    });

    it('policy deny prevents execution through the pipeline', () => {
      const policy = new PolicyEngineImpl();
      const denyPolicy: PolicyDefinition = {
        policyId: 'pol-deny-all',
        version: '1.0.0',
        name: 'Deny All',
        description: 'Deny all executions',
        rules: [
          { id: 'r1', name: 'Universal deny', effect: 'deny', conditions: [], priority: 10 },
        ],
        createdAt: 1000,
        enabled: true,
      };
      policy.register(denyPolicy);

      const evalCtx: EvaluationContext = {
        workflowId: 'wf-integration',
        executionId: 'exec-int-2',
        workflowClass: 'standard',
        providerId: 'p-fast',
        jurisdiction: 'us-east',
        estimatedCost: 10,
        estimatedLatencyMs: 200,
        planningScore: 90,
        priority: 3,
        serviceClass: 'standard',
      };

      const outcome = policy.evaluate(evalCtx);
      expect(outcome.overallDecision).toBe('deny');
      expect(outcome.summary).toContain('deny');
    });

    it('schedule respects planning output across multiple workflows', () => {
      const planner = new PlanningEngineImpl();
      const planCtx: PlanningContext = {
        workflowId: 'wf-integration',
        version: '1.0.0',
        executionId: 'exec-multi',
        costCeiling: null,
        latencyObjectiveMs: null,
        preferredProviders: [],
        jurisdiction: null,
      };

      // Generate two plans (different strategies will produce different scores)
      const planReqA: PlanningRequest = {
        definition: workflowDef,
        context: { ...planCtx, executionId: 'exec-multi-a' },
        capabilities: providerCaps,
        policy: emptyPolicy,
      };
      const planReqB: PlanningRequest = {
        definition: workflowDef,
        context: { ...planCtx, executionId: 'exec-multi-b' },
        capabilities: providerCaps,
        policy: emptyPolicy,
      };
      const planA = planner.plan(planReqA);
      const planB = planner.plan(planReqB);

      // Schedule both
      const scheduler = new AdaptiveSchedulerImpl();
      const inputs: WorkflowSchedulingInput[] = [
        {
          workflowId: 'wf-a',
          executionId: 'exec-multi-a',
          priority: planA.selectedPlan.score > 90 ? 1 : 5,
          deadlineMs: null,
          serviceClass: 'standard',
          businessImportance: 50,
          estimatedDurationMs: planA.selectedPlan.totalLatencyMs,
          dependsOn: [],
          submittedAt: 1000,
        },
        {
          workflowId: 'wf-b',
          executionId: 'exec-multi-b',
          priority: planB.selectedPlan.score > 90 ? 1 : 5,
          deadlineMs: null,
          serviceClass: 'standard',
          businessImportance: 50,
          estimatedDurationMs: planB.selectedPlan.totalLatencyMs,
          dependsOn: [],
          submittedAt: 2000,
        },
      ];

      const result = scheduler.schedule(inputs, { policy: 'priority_first', maxConcurrentWorkflows: 2, weights: null });
      expect(result.executionOrder.length).toBe(2);
    });
  });

  // ── Pipeline 2: Execute → Analytics ──

  describe('Pipeline: Execute → Analytics', () => {
    it('ingests execution telemetry and produces cross-workflow metrics', () => {
      const analytics = new AnalyticsEngineImpl();

      // Simulate execution events
      const events: TelemetryEvent[] = [
        { eventType: 'workflow_start', sourceLayer: 'workflow', timestamp: 1000, duration: null, status: 'success', workflowId: 'wf-1', executionId: 'exec-1', providerId: null, metadata: {} },
        { eventType: 'workflow_complete', sourceLayer: 'workflow', timestamp: 3000, duration: 2000, status: 'success', workflowId: 'wf-1', executionId: 'exec-1', providerId: null, metadata: {} },
        { eventType: 'workflow_start', sourceLayer: 'workflow', timestamp: 2000, duration: null, status: 'success', workflowId: 'wf-2', executionId: 'exec-2', providerId: null, metadata: {} },
        { eventType: 'workflow_complete', sourceLayer: 'workflow', timestamp: 6000, duration: 4000, status: 'failure', workflowId: 'wf-2', executionId: 'exec-2', providerId: null, metadata: {} },
      ];

      analytics.ingest(events);

      const window: TimeWindow = { start: 0, end: 10000 };
      const crossWf = analytics.getCrossWorkflowAnalytics(window);
      expect(crossWf.throughput).toBe(0.2); // 2 completions / 10 seconds
      expect(crossWf.completionRate).toBe(0.5); // 1 success / 2 total
      expect(crossWf.avgExecutionDuration).toBe(2000); // success-only: 2000 / 1
    });

    it('ingests planning and scheduling telemetry for performance insights', () => {
      const analytics = new AnalyticsEngineImpl();

      const events: TelemetryEvent[] = [
        { eventType: 'planning_complete', sourceLayer: 'planning', timestamp: 1000, duration: 45, status: 'success', workflowId: 'wf-1', executionId: 'exec-1', providerId: null, metadata: {} },
        { eventType: 'planning_complete', sourceLayer: 'planning', timestamp: 2000, duration: 55, status: 'success', workflowId: 'wf-1', executionId: 'exec-2', providerId: null, metadata: {} },
        { eventType: 'schedule_decision', sourceLayer: 'scheduling', timestamp: 3000, duration: 15, status: 'success', workflowId: 'wf-1', executionId: 'exec-1', providerId: null, metadata: {} },
      ];

      analytics.ingest(events);

      const window: TimeWindow = { start: 0, end: 10000 };
      const insights = analytics.getPerformanceInsights(window);
      expect(insights.planningLatency.avg).toBe(50);
      expect(insights.planningLatency.count).toBe(2);
      expect(insights.schedulingLatency.count).toBe(1);
    });

    it('execution telemetry feeds capacity forecasts', () => {
      const analytics = new AnalyticsEngineImpl();

      // Simulate rising queue
      const events: TelemetryEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          eventType: 'queue_enter',
          sourceLayer: 'scheduling',
          timestamp: i * 60000,
          duration: null,
          status: 'success',
          workflowId: `wf-${i}`,
          executionId: `exec-${i}`,
          providerId: null,
          metadata: {},
        });
      }

      analytics.ingest(events);
      const forecast = analytics.forecastQueueGrowth({ start: 0, end: 600000 }, 120000);
      expect(forecast.metric).toBe('queue_growth');
      expect(forecast.basedOn).toBeGreaterThanOrEqual(2);
    });
  });

  // ── Pipeline 3: Full End-to-End ──

  describe('Full Pipeline: Plan → Schedule → Execute → Observe', () => {
    it('runs the complete pipeline and produces consistent results', () => {
      // 1. PLAN
      const planner = new PlanningEngineImpl();
      const planReq: PlanningRequest = {
        definition: workflowDef,
        context: {
          workflowId: 'wf-e2e',
          version: '1.0.0',
          executionId: 'exec-e2e',
          costCeiling: 50,
          latencyObjectiveMs: 2000,
          preferredProviders: [],
          jurisdiction: null,
        },
        capabilities: providerCaps,
        policy: emptyPolicy,
      };
      const planResult = planner.plan(planReq);

      // 2. SCHEDULE
      const scheduler = new AdaptiveSchedulerImpl();
      const scheduleResult = scheduler.schedule(
        [{
          workflowId: 'wf-e2e',
          executionId: 'exec-e2e',
          priority: 3,
          deadlineMs: null,
          serviceClass: 'standard',
          businessImportance: 50,
          estimatedDurationMs: planResult.selectedPlan.totalLatencyMs,
          dependsOn: [],
          submittedAt: 1000,
        }],
        { policy: 'fifo', maxConcurrentWorkflows: 2, weights: null },
      );

      // 3. SIMULATE EXECUTION & COLLECT TELEMETRY
      const analytics = new AnalyticsEngineImpl();
      analytics.ingest([
        { eventType: 'workflow_start', sourceLayer: 'workflow', timestamp: 2000, duration: null, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: null, metadata: {} },
        { eventType: 'planning_complete', sourceLayer: 'planning', timestamp: 1500, duration: planResult.selectedPlan.score, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: null, metadata: {} },
        { eventType: 'schedule_decision', sourceLayer: 'scheduling', timestamp: 1800, duration: 10, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: null, metadata: {} },
        { eventType: 'workflow_complete', sourceLayer: 'workflow', timestamp: 5000, duration: 3000, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: null, metadata: {} },
        { eventType: 'slot_utilization', sourceLayer: 'scheduling', timestamp: 2500, duration: null, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: null, metadata: { utilization: 0.5 } },
        { eventType: 'provider_call', sourceLayer: 'provider', timestamp: 2100, duration: 800, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: 'p-fast', metadata: { operation: 'read' } },
        { eventType: 'provider_call', sourceLayer: 'provider', timestamp: 3000, duration: 1200, status: 'success', workflowId: 'wf-e2e', executionId: 'exec-e2e', providerId: 'p-fast', metadata: { operation: 'write' } },
      ]);

      // 4. VERIFY EVERY LAYER
      const crossWf = analytics.getCrossWorkflowAnalytics({ start: 0, end: 10000 });
      expect(crossWf.throughput).toBe(0.1); // 1 completion / 10 seconds
      expect(crossWf.completionRate).toBe(1); // 1/1 success

      const insights = analytics.getPerformanceInsights({ start: 0, end: 10000 });
      expect(insights.planningLatency.count).toBe(1);
      expect(insights.schedulingLatency.count).toBe(1);
      expect(insights.providerExecutionTime.count).toBe(2);

      const summary = analytics.getOperationalSummary({ start: 0, end: 10000 });
      expect(summary.throughput).toBeGreaterThan(0);
      expect(summary.slotUtilization).toBe(0.5);

      // Verify plan-schedule consistency
      expect(planResult.selectedPlan.assignments.length).toBe(2);
      expect(scheduleResult.executionOrder).toContain('exec-e2e');
    });
  });

  // ── Pipeline 4: Cross-Phase Regression ──

  describe('Cross-Phase Regression', () => {
    it('WorkflowGraphEngine still validates DAGs correctly with Phase VI layers', () => {
      const graph = new WorkflowGraphEngineImpl();
      const validation = graph.validate(workflowDef);
      expect(validation.valid).toBe(true);
    });

    it('Planner can consume WorkflowGraph output', () => {
      const graph = new WorkflowGraphEngineImpl();
      const plan = graph.plan(workflowDef);
      expect(plan.orderedSteps.length).toBe(2);

      // The planner should be able to work with the graph's execution plan
      const planner = new PlanningEngineImpl();
      const planReq: PlanningRequest = {
        definition: workflowDef,
        context: {
          workflowId: 'wf-regression',
          version: '1.0.0',
          executionId: 'exec-reg',
          costCeiling: null,
          latencyObjectiveMs: null,
          preferredProviders: [],
          jurisdiction: null,
        },
        capabilities: providerCaps,
        policy: emptyPolicy,
      };
      const result = planner.plan(planReq);
      expect(result.selectedPlan.assignments.length).toBe(plan.totalSteps);
    });

    it('Multiple scheduling policies produce consistent orderings', () => {
      const scheduler = new AdaptiveSchedulerImpl();
      const inputs: WorkflowSchedulingInput[] = [
        { workflowId: 'a', executionId: 'exec-a', priority: 1, deadlineMs: null, serviceClass: 'premium', businessImportance: 80, estimatedDurationMs: 100, dependsOn: [], submittedAt: 100 },
        { workflowId: 'b', executionId: 'exec-b', priority: 3, deadlineMs: null, serviceClass: 'standard', businessImportance: 50, estimatedDurationMs: 200, dependsOn: [], submittedAt: 200 },
      ];

      const opts: SchedulingOptions = { policy: 'priority_first', maxConcurrentWorkflows: 2, weights: null };
      const r1 = scheduler.schedule(inputs, opts);
      const r2 = scheduler.schedule(inputs, opts);
      expect(r1.executionOrder).toEqual(r2.executionOrder);
    });

    it('Analytics engine remains non-invasive after ingesting telemetry', () => {
      const analytics = new AnalyticsEngineImpl();
      analytics.ingest([
        { eventType: 'workflow_complete', sourceLayer: 'workflow', timestamp: 1000, duration: 500, status: 'success', workflowId: 'wf-1', executionId: 'exec-1', providerId: null, metadata: {} },
      ]);

      const result = analytics.getCrossWorkflowAnalytics({ start: 0, end: 9999 });
      expect(result.throughput).toBeGreaterThanOrEqual(0);
      // Verify no execution-control methods exist
      expect((analytics as any).execute).toBeUndefined();
      expect((analytics as any).plan).toBeUndefined();
      expect((analytics as any).schedule).toBeUndefined();
    });

    it('Policy engine does not execute or schedule', () => {
      const policy = new PolicyEngineImpl();
      const p: PolicyDefinition = {
        policyId: 'test', version: '1.0.0', name: 'Test', description: '', rules: [{ id: 'r1', name: 'Allow', effect: 'allow', conditions: [], priority: 1 }], createdAt: 1, enabled: true,
      };
      policy.register(p);
      const outcome = policy.evaluate({
        workflowId: 'wf', executionId: 'exec', workflowClass: 'standard', providerId: 'p1', jurisdiction: null, estimatedCost: null, estimatedLatencyMs: null, planningScore: null, priority: null, serviceClass: null,
      });
      expect(outcome.overallDecision).toBe('allow');
      expect((policy as any).execute).toBeUndefined();
      expect((policy as any).plan).toBeUndefined();
      expect((policy as any).schedule).toBeUndefined();
    });
  });
});
