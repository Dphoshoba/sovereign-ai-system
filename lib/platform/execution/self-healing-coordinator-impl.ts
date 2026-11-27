import { OperationalDecision } from "./autonomous-decision";
import { OperationalStateEngine } from "./operational-state";
import { ProviderHealthMonitor, ProviderHealthStatus } from "./provider-health-monitor";
import { ProviderCircuitBreaker, ProviderCircuitState } from "./circuit-breaker";
import { RollbackExecutor, RollbackPlan, RollbackResult } from "./rollback-contract";
import { SagaCompensator, SagaPlan } from "./saga-compensation";
import { ReconciliationEngine } from "./operational-hardening/reconciliation-engine";
import { CredentialRotationManager, RotationResult } from "./operational-hardening/credential-rotation-manager";
import {
  HealingAction,
  HealingReport,
  HealingStatus,
  RecoveryStrategy,
  SelfHealingCoordinator,
  SelfHealingCoordinatorError,
} from "./self-healing-coordinator";

export interface SelfHealingCoordinatorDependencies {
  readonly operationalState: OperationalStateEngine;
  readonly healthMonitor: ProviderHealthMonitor;
  readonly circuitBreaker: ProviderCircuitBreaker | null;
  readonly rollbackExecutor: RollbackExecutor | null;
  readonly credentialRotation: CredentialRotationManager | null;
  readonly reconciliation: ReconciliationEngine | null;
  readonly sagaCompensator: SagaCompensator | null;
}

export class SelfHealingCoordinatorImpl implements SelfHealingCoordinator {
  private _status: HealingStatus = 'idle';

  constructor(private readonly deps: SelfHealingCoordinatorDependencies) {}

  getStatus(): HealingStatus {
    return this._status;
  }

  async heal(decision: OperationalDecision): Promise<HealingReport> {
    this._status = 'healing';
    const startedAt = Date.now();
    const reportId = `heal-${decision.id}`;
    const actionType = decision.selectedAction.action;

    let actions: HealingAction[];
    let state: HealingReport['state'];

    switch (actionType) {
      case 'no_action':
      case 'monitor':
        actions = [];
        state = 'completed';
        break;

      case 'notify':
        actions = [this.buildAction('notify', 'platform', true, 0, `Notification recorded for state ${decision.triggeringState.operationalState}`, null)];
        state = 'completed';
        break;

      case 'pause_workflows':
        actions = this.pauseWorkflows();
        state = actions.every(a => a.success) ? 'completed' : 'failed';
        break;

      case 'initiate_recovery':
        actions = await this.executeRecovery(decision);
        state = this.deriveState(actions);
        break;

      case 'request_human_approval':
        actions = [this.buildAction('rollback', 'escalation', true, 0, `Escalated: ${decision.selectedAction.rationale}`, null)];
        state = 'escalated';
        break;

      default:
        throw new SelfHealingCoordinatorError(`Unknown action: ${actionType}`);
    }

    this._status = state === 'failed' ? 'failed' : state === 'escalated' ? 'escalated' : 'completed';

    return {
      reportId,
      decisionId: decision.id,
      state,
      actions,
      summary: buildSummary(actionType, state, actions),
      startedAt,
      completedAt: Date.now(),
    };
  }

  // ── Recovery execution ──

  private async executeRecovery(decision: OperationalDecision): Promise<HealingAction[]> {
    const actions: HealingAction[] = [];
    const allHealth = await this.deps.healthMonitor.checkAll();
    const unhealthyProviders = allHealth.filter(h => !h.available || h.successiveFailures > 0);

    if (unhealthyProviders.length === 0) {
      const layerRecovery = this.handleLayerDegradation(decision);
      if (layerRecovery) actions.push(layerRecovery);
      if (actions.length === 0) {
        actions.push(this.buildAction(
          'rollback', 'platform', false, 0,
          'No specific failure context found; recommending escalation',
          'UNKNOWN_FAILURE',
        ));
      }
      return actions;
    }

    for (const ph of unhealthyProviders) {
      actions.push(...this.buildProviderStrategyChain(ph, decision));
    }

    return actions;
  }

  private buildProviderStrategyChain(ph: ProviderHealthStatus, decision: OperationalDecision): HealingAction[] {
    const chain: HealingAction[] = [];
    const providerId = ph.providerId;

    // 1. Check circuit breaker
    if (this.deps.circuitBreaker) {
      const cbAction = this.handleCircuitBreaker(providerId);
      if (cbAction) chain.push(cbAction);
    }

    // 2. Check credential health
    if (this.deps.credentialRotation) {
      const credAction = this.handleCredentialRotation(providerId);
      if (credAction) chain.push(credAction);
    }

    // 3. Rollback as primary recovery (most certified path)
    if (this.deps.rollbackExecutor) {
      chain.push(this.buildAction(
        'rollback', providerId, true, 0,
        `Rollback queued for ${providerId} (${ph.successiveFailures} failures)`,
        null,
      ));
    } else {
      chain.push(this.buildAction(
        'rollback', providerId, false, 0,
        `Rollback needed for ${providerId} but no executor available`,
        'MISSING_ROLLBACK_EXECUTOR',
      ));
    }

    // 4. Reconcile state after rollback
    if (this.deps.reconciliation) {
      chain.push(this.buildAction(
        'reconcile', providerId, false, 0,
        `Reconciliation pending for ${providerId}`,
        null,
      ));
    }

    return chain;
  }

  private handleLayerDegradation(decision: OperationalDecision): HealingAction | null {
    const unhealthy = decision.triggeringState.layerHealth.filter(l => l.status !== 'healthy');
    if (unhealthy.length === 0) return null;

    const layers = unhealthy.map(l => l.layer).join(', ');
    return this.buildAction(
      'workflow_recovery', 'platform', false, 0,
      `Layer degradation detected: ${layers}; recovery requires multi-layer coordination`,
      'LAYER_DEGRADATION',
    );
  }

  private handleCircuitBreaker(providerId: string): HealingAction | null {
    const state = this.deps.circuitBreaker!.getState(providerId);
    if (!state) return null;

    if (state.state === 'OPEN') {
      this.deps.circuitBreaker!.forceState(providerId, 'HALF_OPEN', 'Self-healing: attempting recovery probe', 'self-healing-coordinator');
      return this.buildAction(
        'circuit_breaker_reset', providerId, true, 0,
        `Circuit breaker transitioned from OPEN to HALF_OPEN for ${providerId}`,
        null,
      );
    }

    if (state.state === 'HALF_OPEN') {
      return this.buildAction(
        'circuit_breaker_reset', providerId, false, 0,
        `Circuit breaker HALF_OPEN for ${providerId}, awaiting probe result`,
        null,
      );
    }

    return null;
  }

  private handleCredentialRotation(providerId: string): HealingAction | null {
    return this.buildAction(
      'credential_rotation', providerId, false, 0,
      `Credential rotation candidate for ${providerId}`,
      null,
    );
  }

  // ── Workflow pause ──

  private pauseWorkflows(): HealingAction[] {
    const prevPaused = this.deps.operationalState.getStatus().state;
    if (prevPaused === 'paused') {
      return [this.buildAction('workflow_recovery', 'workflows', true, 0, 'Workflows already paused', null)];
    }
    try {
      this.deps.operationalState.setPaused(true, 'Autonomous decision: pause_workflows');
      return [this.buildAction('workflow_recovery', 'workflows', true, 0, 'Workflows paused', null)];
    } catch (e) {
      return [this.buildAction('workflow_recovery', 'workflows', false, 0, `Failed to pause: ${(e as Error).message}`, 'PAUSE_FAILED')];
    }
  }

  // ── Helpers ──

  private deriveState(actions: readonly HealingAction[]): HealingReport['state'] {
    if (actions.length === 0) return 'completed';
    const allSuccess = actions.every(a => a.success);
    if (allSuccess) return 'completed';

    const hasRollbackFailure = actions.some(a => !a.success && a.strategy === 'rollback');
    if (hasRollbackFailure) return 'failed';

    return 'partial';
  }

  private buildAction(
    strategy: RecoveryStrategy,
    target: string,
    success: boolean,
    durationMs: number,
    detail: string,
    error: string | null,
  ): HealingAction {
    const id = `${strategy}-${target}-${Date.now()}`;
    return { id, strategy, target, success, durationMs, detail, error };
  }
}

function buildSummary(
  action: string,
  state: HealingReport['state'],
  actions: readonly HealingAction[],
): string {
  if (state === 'completed' && actions.length === 0) {
    return `Action '${action}' completed — no recovery needed`;
  }
  if (state === 'escalated') {
    return `Action escalated for human approval`;
  }
  const successCount = actions.filter(a => a.success).length;
  const failCount = actions.filter(a => !a.success).length;
  return `Recovery ${state}: ${successCount} succeeded, ${failCount} failed (${actions.length} total)`;
}
