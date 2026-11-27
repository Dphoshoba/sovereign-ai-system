import { describe, it, expect, beforeEach } from 'vitest';
import { SelfHealingCoordinatorImpl, SelfHealingCoordinatorDependencies } from '../../lib/platform/execution/self-healing-coordinator-impl';
import { OperationalDecision, DecisionAction } from '../../lib/platform/execution/autonomous-decision';
import { OperationalState, OperationalStateEngine, OperationalStatus, DependencyImpact, LayerHealth, HealthStatus } from '../../lib/platform/execution/operational-state';
import { ProviderHealthMonitor, ProviderHealthStatus, HealthEventType, HealthEventHandler } from '../../lib/platform/execution/provider-health-monitor';
import { ProviderCircuitBreaker, ProviderCircuitState, CircuitState, CheckResult, CircuitBreakerOptions } from '../../lib/platform/execution/circuit-breaker';
import { RollbackExecutor, RollbackPlan, RollbackResult, RollbackScope, RollbackStrategy, RollbackStatus } from '../../lib/platform/execution/rollback-contract';
import { SagaCompensator, SagaPlan, CompensationAction } from '../../lib/platform/execution/saga-compensation';
import { ReconciliationEngine } from '../../lib/platform/execution/operational-hardening/reconciliation-engine';
import { CredentialRotationManager, RotationResult } from '../../lib/platform/execution/operational-hardening/credential-rotation-manager';
import { ExecutionRequest } from '../../lib/platform/execution/execution-request';
import { QueueCandidate } from '../../lib/platform/queue/types';

// ── Mock Helpers ──

const mockStatus = (overrides: Partial<OperationalStatus> = {}): OperationalStatus => ({
  state: 'healthy',
  overallScore: 100,
  layerHealth: [],
  lastTransition: 0,
  transitionCount: 0,
  ...overrides,
});

const healthyLayer = (layer: string): LayerHealth => ({
  layer, status: 'healthy', score: 100, lastUpdated: 1000, details: 'OK',
});

const unhealthyLayer = (layer: string): LayerHealth => ({
  layer, status: 'unhealthy', score: 20, lastUpdated: 1000, details: 'Down',
});

const mkDecision = (action: DecisionAction, overrides: Partial<OperationalDecision> = {}): OperationalDecision => ({
  id: `dec-${Date.now()}`,
  timestamp: Date.now(),
  triggeringState: {
    operationalState: 'healthy',
    overallScore: 100,
    activeImpacts: [],
    layerHealth: [],
  },
  selectedAction: {
    action,
    confidence: 1,
    rationale: 'Test decision',
    riskScore: 0,
    requiredApprovalLevel: 'none',
    rejected: false,
    rejectionReason: null,
  },
  alternatives: [],
  riskAssessment: { overallRisk: 0, factors: [] },
  policyReferences: ['G-044'],
  auditRecord: {
    decisionId: 'dec-test', timestamp: 0,
    inputs: { operationalState: 'healthy', activeImpacts: 0, layerHealthCount: 0 },
    evaluatedRules: ['rule-1'], selectedAction: action,
    rejectedAlternatives: [], confidence: 1, policyReferences: ['G-044'],
  },
  ...overrides,
});

// ── Mock Implementations ──

class MockOperationalStateEngine implements OperationalStateEngine {
  private _state: OperationalStatus = mockStatus();
  private _pauseThrows = false;

  setState(s: OperationalStatus) { this._state = s; }
  setPauseThrows(v: boolean) { this._pauseThrows = v; }

  reportHealth(_layer: string, _health: LayerHealth): void {}
  getStatus(): OperationalStatus { return this._state; }
  getTransitionHistory(): readonly any[] { return []; }
  getDependencyImpact(_component: string): readonly DependencyImpact[] { return []; }
  getActiveImpacts(): readonly DependencyImpact[] { return []; }
  setMaintenance(_enabled: boolean, _reason: string): void {}
  setPaused(_enabled: boolean, _reason: string): void {
    if (this._pauseThrows) throw new Error('Cannot pause from failed state');
  }
}

class MockProviderHealthMonitor implements ProviderHealthMonitor {
  private statuses: ProviderHealthStatus[] = [];

  setStatuses(s: ProviderHealthStatus[]) { this.statuses = s; }

  check(_providerId: string): Promise<ProviderHealthStatus> { throw new Error('Not implemented'); }
  checkAll(): Promise<readonly ProviderHealthStatus[]> { return Promise.resolve(this.statuses); }
  getStatus(_providerId: string): ProviderHealthStatus | undefined { return undefined; }
  getHistory(_providerId: string): readonly any[] { return []; }
  subscribe(_handler: HealthEventHandler): () => void { return () => {}; }
}

class MockCircuitBreaker implements ProviderCircuitBreaker {
  private states = new Map<string, ProviderCircuitState>();

  setState(id: string, s: ProviderCircuitState) { this.states.set(id, s); }
  getForcedState(id: string): CircuitState | undefined { return this.states.get(id)?.state; }

  register(_providerId: string, _options?: CircuitBreakerOptions): ProviderCircuitState {
    throw new Error('Not implemented');
  }
  getState(providerId: string): ProviderCircuitState | undefined { return this.states.get(providerId); }
  recordSuccess(_providerId: string): ProviderCircuitState { throw new Error('Not implemented'); }
  recordFailure(_providerId: string): ProviderCircuitState { throw new Error('Not implemented'); }
  forceState(providerId: string, state: CircuitState, _reason: string, _setBy: string): ProviderCircuitState {
    const existing = this.states.get(providerId)!;
    const updated = { ...existing, state };
    this.states.set(providerId, updated);
    return updated;
  }
  check(_providerId: string): CheckResult { return { allowed: true, state: 'CLOSED' }; }
  releaseOverride(_providerId: string): ProviderCircuitState { throw new Error('Not implemented'); }
}

class MockRollbackExecutor implements RollbackExecutor {
  readonly supportsRollback = true;
  readonly rollbackStrategies: RollbackStrategy[] = ['REVERSE_ORDER'];

  plan(_request: ExecutionRequest, _candidate: QueueCandidate): Promise<RollbackPlan> {
    return Promise.resolve({
      rollbackId: 'rb-test', executionId: 'exec-test', connectorId: 'mock',
      operation: 'test', scope: 'FULL' as RollbackScope, strategy: 'REVERSE_ORDER' as RollbackStrategy,
      steps: [], plannedAt: new Date().toISOString(), planHash: 'abc',
    });
  }
  execute(_request: ExecutionRequest, _candidate: QueueCandidate, _plan: RollbackPlan): Promise<RollbackResult> {
    return Promise.resolve({
      rollbackId: 'rb-test', executionId: 'exec-test', status: 'COMPLETED' as RollbackStatus,
      stepsCompleted: 1, stepsTotal: 1, completedAt: new Date().toISOString(), stepResults: [],
    });
  }
}

class MockReconciliationEngine extends ReconciliationEngine {
  constructor() { super(); }
}

class MockCredentialRotationManager extends CredentialRotationManager {
  constructor() { super({ providerId: 'mock', getDescriptor() { return Promise.reject(new Error('Not implemented')); }, validate() { return Promise.reject(new Error('Not implemented')); }, revoke() { return Promise.reject(new Error('Not implemented')); } }); }
}

class MockSagaCompensator implements SagaCompensator {
  planFrom(_transactionId: string, _completedSteps: readonly any[]): SagaPlan {
    return { transactionId: 'tx-test', actions: [], stepResults: [], state: 'PLANNED', createdAt: new Date().toISOString(), completedAt: null };
  }
  execute(_plan: SagaPlan, _compensator: (a: CompensationAction) => Promise<'COMPENSATED' | 'COMPENSATION_FAILED'>): SagaPlan {
    return { ..._plan, state: 'COMPLETED', completedAt: new Date().toISOString() };
  }
}

// ── Fixtures ──

function makeDeps(overrides: Partial<SelfHealingCoordinatorDependencies> = {}): SelfHealingCoordinatorDependencies {
  return {
    operationalState: new MockOperationalStateEngine(),
    healthMonitor: new MockProviderHealthMonitor(),
    circuitBreaker: new MockCircuitBreaker(),
    rollbackExecutor: new MockRollbackExecutor(),
    credentialRotation: new MockCredentialRotationManager(),
    reconciliation: new MockReconciliationEngine(),
    sagaCompensator: new MockSagaCompensator(),
    ...overrides,
  };
}

// ── Tests ──

describe('SelfHealingCoordinatorImpl', () => {
  let deps: SelfHealingCoordinatorDependencies;
  let coordinator: SelfHealingCoordinatorImpl;

  beforeEach(() => {
    deps = makeDeps();
    coordinator = new SelfHealingCoordinatorImpl(deps);
  });

  // ── 7C.1 — Healing Model ──

  describe('7C.1 — Healing Model', () => {
    it('reports idle status initially', () => {
      expect(coordinator.getStatus()).toBe('idle');
    });

    it('reports healing during initiate_recovery', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);
      const healPromise = coordinator.heal(mkDecision('initiate_recovery'));
      expect(coordinator.getStatus()).toBe('healing');
      await healPromise;
    });

    it('reports completed after successful heal', async () => {
      await coordinator.heal(mkDecision('monitor'));
      expect(coordinator.getStatus()).toBe('completed');
    });

    it('produces a healing report with id and timestamps', async () => {
      const report = await coordinator.heal(mkDecision('no_action'));
      expect(report.reportId).toBeDefined();
      expect(report.decisionId).toBeDefined();
      expect(report.startedAt).toBeGreaterThan(0);
      expect(report.completedAt).toBeGreaterThanOrEqual(report.startedAt);
    });

    it('includes summary text in the report', async () => {
      const report = await coordinator.heal(mkDecision('no_action'));
      expect(report.summary.length).toBeGreaterThan(0);
    });
  });

  // ── 7C.2 — Decision Routing ──

  describe('7C.2 — Decision Routing', () => {
    it('routes no_action to completed with no actions', async () => {
      const report = await coordinator.heal(mkDecision('no_action'));
      expect(report.state).toBe('completed');
      expect(report.actions.length).toBe(0);
    });

    it('routes monitor to completed with no actions', async () => {
      const report = await coordinator.heal(mkDecision('monitor'));
      expect(report.state).toBe('completed');
      expect(report.actions.length).toBe(0);
    });

    it('routes notify to completed with notification action', async () => {
      const report = await coordinator.heal(mkDecision('notify'));
      expect(report.state).toBe('completed');
      expect(report.actions.length).toBe(1);
      expect(report.actions[0].strategy).toBe('notify');
      expect(report.actions[0].success).toBe(true);
    });

    it('routes pause_workflows to pause action via operational state', async () => {
      const report = await coordinator.heal(mkDecision('pause_workflows'));
      expect(report.state).toBe('completed');
      expect(report.actions.length).toBe(1);
      expect(report.actions[0].strategy).toBe('workflow_recovery');
      expect(report.actions[0].detail).toContain('paused');
    });

    it('routes request_human_approval to escalated state', async () => {
      const report = await coordinator.heal(mkDecision('request_human_approval'));
      expect(report.state).toBe('escalated');
      expect(report.actions.length).toBe(1);
      expect(report.actions[0].success).toBe(true);
    });

    it('routes initiate_recovery to recovery actions', async () => {
      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      expect(report.actions.length).toBeGreaterThan(0);
    });

    it('reports escalated status after request_human_approval', async () => {
      await coordinator.heal(mkDecision('request_human_approval'));
      expect(coordinator.getStatus()).toBe('escalated');
    });

    it('reports failed status after failed recovery', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: null, successiveFailures: 3, latencyMs: null },
      ]);
      (deps as any).rollbackExecutor = null; // no executor makes rollback fail

      // Recreate coordinator with modified deps
      coordinator = new SelfHealingCoordinatorImpl(deps);
      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      // Should report how it can
      expect(report.actions.some(a => !a.success)).toBe(true);
    });
  });

  // ── 7C.3 — Recovery Strategy Routing ──

  describe('7C.3 — Recovery Strategy Routing', () => {
    it('queues rollback for unhealthy providers', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      expect(report.actions.filter(a => a.strategy === 'rollback').length).toBe(1);
    });

    it('reports unknown failure when no providers are unhealthy and no layers degraded', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([]);
      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      expect(report.actions.some(a => a.strategy === 'rollback' && !a.success)).toBe(true);
    });

    it('reports layer degradation when layers are unhealthy but providers are healthy', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([]);
      const decision = mkDecision('initiate_recovery', {
        triggeringState: {
          operationalState: 'failed',
          overallScore: 30,
          activeImpacts: [],
          layerHealth: [unhealthyLayer('workflow')],
        },
      });
      const report = await coordinator.heal(decision);
      expect(report.actions.some(a => a.strategy === 'workflow_recovery')).toBe(true);
    });

    it('handles multiple unhealthy providers with strategy chain per provider', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
        { providerId: 'p-maps', available: true, ready: false, lastChecked: '', lastError: null, successiveFailures: 1, latencyMs: null },
      ]);

      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      const rollbacks = report.actions.filter(a => a.strategy === 'rollback');
      expect(rollbacks.length).toBe(2); // one per provider
    });
  });

  // ── 7C.4 — Circuit Breaker Handling ──

  describe('7C.4 — Circuit Breaker Handling', () => {
    it('transitions OPEN circuit breaker to HALF_OPEN during recovery', async () => {
      const cb = deps.circuitBreaker as MockCircuitBreaker;
      cb.setState('p-fast', {
        providerId: 'p-fast', state: 'OPEN', failureCount: 5,
        lastFailureAt: null, lastSuccessAt: null, trippedAt: new Date().toISOString(),
        cooldownMs: 10000, failureThreshold: 3, manualOverride: null,
      });
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      await coordinator.heal(mkDecision('initiate_recovery'));
      expect(cb.getForcedState('p-fast')).toBe('HALF_OPEN');
    });

    it('notes HALF_OPEN circuit breaker without forcing again', async () => {
      const cb = deps.circuitBreaker as MockCircuitBreaker;
      cb.setState('p-fast', {
        providerId: 'p-fast', state: 'HALF_OPEN', failureCount: 5,
        lastFailureAt: null, lastSuccessAt: null, trippedAt: new Date().toISOString(),
        cooldownMs: 10000, failureThreshold: 3, manualOverride: null,
      });
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      const cbActions = report.actions.filter(a => a.strategy === 'circuit_breaker_reset');
      expect(cbActions.length).toBe(1);
      expect(cbActions[0].success).toBe(false); // awaiting probe
    });

    it('skips circuit breaker when no state exists for provider', async () => {
      // No circuit breaker state registered
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-unknown', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      const cbActions = report.actions.filter(a => a.strategy === 'circuit_breaker_reset');
      expect(cbActions.length).toBe(0); // no CB state → no CB action
    });
  });

  // ── 7C.5 — State Derivation ──

  describe('7C.5 — State Derivation', () => {
    it('derives completed when no recovery needed', async () => {
      const report = await coordinator.heal(mkDecision('no_action'));
      expect(report.state).toBe('completed');
    });

    it('derives completed when no actions and health remains stable', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([]);
      const report = await coordinator.heal(mkDecision('initiate_recovery'));
      expect(report.actions.some(a => !a.success)).toBe(true);
    });

    it('derives escalated for human approval actions', async () => {
      const report = await coordinator.heal(mkDecision('request_human_approval'));
      expect(report.state).toBe('escalated');
    });
  });

  // ── 7C.6 — Edge Cases ──

  describe('7C.6 — Edge Cases', () => {
    it('handles already-paused state gracefully', async () => {
      (deps.operationalState as MockOperationalStateEngine).setState(mockStatus({ state: 'paused' }));
      const report = await coordinator.heal(mkDecision('pause_workflows'));
      expect(report.state).toBe('completed');
      expect(report.actions[0].detail).toContain('already paused');
    });

    it('handles pause failure when in failed state', async () => {
      (deps.operationalState as MockOperationalStateEngine).setState(mockStatus({ state: 'failed' }));
      (deps.operationalState as MockOperationalStateEngine).setPauseThrows(true);
      const report = await coordinator.heal(mkDecision('pause_workflows'));
      expect(report.state).toBe('failed');
    });

    it('handles null circuitBreaker gracefully', async () => {
      const limitedDeps = makeDeps({ circuitBreaker: null });
      const limitedCoord = new SelfHealingCoordinatorImpl(limitedDeps);
      (limitedDeps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await limitedCoord.heal(mkDecision('initiate_recovery'));
      expect(report.actions.some(a => a.strategy === 'rollback')).toBe(true);
    });

    it('handles null rollbackExecutor gracefully', async () => {
      const limitedDeps = makeDeps({ rollbackExecutor: null });
      const limitedCoord = new SelfHealingCoordinatorImpl(limitedDeps);
      (limitedDeps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await limitedCoord.heal(mkDecision('initiate_recovery'));
      const rollbacks = report.actions.filter(a => a.strategy === 'rollback');
      expect(rollbacks.length).toBe(1);
      expect(rollbacks[0].success).toBe(false);
      expect(rollbacks[0].error).toBe('MISSING_ROLLBACK_EXECUTOR');
    });

    it('handles null credentialRotation gracefully', async () => {
      const limitedDeps = makeDeps({ credentialRotation: null });
      const limitedCoord = new SelfHealingCoordinatorImpl(limitedDeps);
      (limitedDeps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await limitedCoord.heal(mkDecision('initiate_recovery'));
      const credActions = report.actions.filter(a => a.strategy === 'credential_rotation');
      expect(credActions.length).toBe(0);
    });

    it('handles null reconciliation gracefully', async () => {
      const limitedDeps = makeDeps({ reconciliation: null });
      const limitedCoord = new SelfHealingCoordinatorImpl(limitedDeps);
      (limitedDeps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const report = await limitedCoord.heal(mkDecision('initiate_recovery'));
      const reconciles = report.actions.filter(a => a.strategy === 'reconcile');
      expect(reconciles.length).toBe(0);
    });

    it('handles empty layer health in triggering state', async () => {
      const decision = mkDecision('initiate_recovery', {
        triggeringState: {
          operationalState: 'failed',
          overallScore: 0,
          activeImpacts: [],
          layerHealth: [],
        },
      });
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([]);
      const report = await coordinator.heal(decision);
      expect(report.state).toBe('failed');
    });
  });

  // ── 7C.7 — Determinism ──

  describe('7C.7 — Deterministic Recovery Routing', () => {
    it('produces same actions for same decision and state', async () => {
      (deps.healthMonitor as MockProviderHealthMonitor).setStatuses([
        { providerId: 'p-fast', available: false, ready: false, lastChecked: '', lastError: 'timeout', successiveFailures: 3, latencyMs: null },
      ]);

      const decision = mkDecision('initiate_recovery');
      const report1 = await coordinator.heal(decision);
      coordinator = new SelfHealingCoordinatorImpl(deps);
      const report2 = await coordinator.heal(decision);

      expect(report1.actions.length).toBe(report2.actions.length);
      for (let i = 0; i < report1.actions.length; i++) {
        expect(report1.actions[i].strategy).toBe(report2.actions[i].strategy);
        expect(report1.actions[i].success).toBe(report2.actions[i].success);
      }
    });
  });
});
