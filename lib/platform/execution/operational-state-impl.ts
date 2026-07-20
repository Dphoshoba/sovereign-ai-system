import {
  DependencyImpact,
  HealthStatus,
  ImpactSeverity,
  LayerHealth,
  OperationalState,
  OperationalStateEngine,
  OperationalStateError,
  OperationalStatus,
  StateTransition,
} from "./operational-state";

// ── Layer dependency graph ──

const LAYER_DEPENDENCIES: Record<string, ReadonlyArray<string>> = {
  runtime: [],
  provider: ['workflow'],
  workflow: ['planning', 'scheduling', 'policy'],
  planning: [],
  scheduling: [],
  policy: [],
};

const ALL_LAYERS = Object.keys(LAYER_DEPENDENCIES);

// ── Implementation ──

export class OperationalStateEngineImpl implements OperationalStateEngine {
  private layerHealth = new Map<string, LayerHealth>();
  private state: OperationalState = 'healthy';
  private transitions: StateTransition[] = [];
  private manualOverride: { state: OperationalState; reason: string } | null = null;

  // ── 7A.2 — Health Aggregation ──

  reportHealth(layer: string, health: LayerHealth): void {
    if (!ALL_LAYERS.includes(layer)) {
      throw new OperationalStateError(`Unknown layer: '${layer}'`);
    }
    this.layerHealth.set(layer, health);
    this.recomputeState();
  }

  getStatus(): OperationalStatus {
    const health = this.getLayerHealthSnapshot();
    const score = this.computeOverallScore(health);
    const now = Date.now();
    const lastTransition = this.transitions.length > 0
      ? this.transitions[this.transitions.length - 1].timestamp
      : now;

    return {
      state: this.state,
      overallScore: score,
      layerHealth: health,
      lastTransition,
      transitionCount: this.transitions.length,
    };
  }

  // ── 7A.3 — State Transition Engine ──

  getTransitionHistory(limit?: number): readonly StateTransition[] {
    const history = [...this.transitions];
    if (limit && limit > 0) {
      return history.slice(-limit);
    }
    return history;
  }

  // ── 7A.4 — Dependency Impact Analysis ──

  getDependencyImpact(component: string): readonly DependencyImpact[] {
    const [layer] = component.split(':');
    const dependents = LAYER_DEPENDENCIES[layer];
    if (!dependents || dependents.length === 0) return [];

    const health = this.layerHealth.get(layer);
    if (!health || health.status === 'healthy' || health.status === 'unknown') return [];

    const severity = this.severityFromStatus(health.status);
    return [{
      source: component,
      type: `${health.status}_${layer}`,
      affectedLayers: [...dependents],
      severity,
      description: `${layer} is ${health.status}: ${health.details}`,
      downstreamEffects: dependents.map((d) =>
        `${d} may be affected by ${layer} ${health.status}`,
      ),
    }];
  }

  getActiveImpacts(): readonly DependencyImpact[] {
    const impacts: DependencyImpact[] = [];
    for (const layer of ALL_LAYERS) {
      impacts.push(...this.getDependencyImpact(layer));
    }
    return impacts;
  }

  // ── Manual Overrides ──

  setMaintenance(enabled: boolean, reason: string): void {
    if (enabled) {
      if (this.state === 'failed' || this.state === 'paused') {
        throw new OperationalStateError(
          `Cannot enter maintenance from ${this.state}`,
        );
      }
      this.recordTransition('maintenance', `Manual: ${reason}`);
      this.manualOverride = { state: 'maintenance', reason };
      this.state = 'maintenance';
    } else {
      this.manualOverride = null;
      this.recomputeState();
    }
  }

  setPaused(enabled: boolean, reason: string): void {
    if (enabled) {
      this.recordTransition('paused', `Manual: ${reason}`);
      this.manualOverride = { state: 'paused', reason };
      this.state = 'paused';
    } else {
      this.manualOverride = null;
      this.recomputeState();
    }
  }

  // ── Internal ──

  private recomputeState(): void {
    if (this.manualOverride) return;

    const health = this.getLayerHealthSnapshot();
    const newState = this.determineTargetState(health);

    if (newState !== this.state) {
      this.recordTransition(newState, this.buildTransitionReason(this.state, newState, health));
      this.state = newState;
    }
  }

  private determineTargetState(health: readonly LayerHealth[]): OperationalState {
    const hasUnhealthy = health.some((h) => h.status === 'unhealthy');
    const hasDegraded = health.some((h) => h.status === 'degraded');
    const allHealthy = health.every((h) => h.status === 'healthy' || h.status === 'unknown');

    if (hasUnhealthy) return 'failed';
    if (hasDegraded) {
      if (this.state === 'failed') return 'recovering';
      return 'degraded';
    }
    if (allHealthy) {
      if (this.state === 'failed' || this.state === 'degraded') return 'recovering';
      if (this.state === 'recovering') return 'healthy';
      return 'healthy';
    }
    return this.state;
  }

  private computeOverallScore(health: readonly LayerHealth[]): number {
    if (health.length === 0) return 0;
    const total = health.reduce((s, h) => {
      if (h.status === 'healthy') return s + 100;
      if (h.status === 'degraded') return s + 60;
      if (h.status === 'unhealthy') return s + 20;
      return s + 50;
    }, 0);
    return Math.round(total / health.length);
  }

  private getLayerHealthSnapshot(): LayerHealth[] {
    return ALL_LAYERS.map((layer) => {
      const existing = this.layerHealth.get(layer);
      return existing ?? { layer, status: 'unknown', score: 50, lastUpdated: 0, details: 'No data' };
    });
  }

  private recordTransition(to: OperationalState, reason: string): void {
    this.transitions.push({
      from: this.state,
      to,
      timestamp: Date.now(),
      reason,
      triggeredBy: 'health_aggregation',
      layerHealthSnapshot: this.getLayerHealthSnapshot(),
    });
  }

  private buildTransitionReason(
    from: OperationalState,
    to: OperationalState,
    health: readonly LayerHealth[],
  ): string {
    const unhealthy = health.filter((h) => h.status !== 'healthy' && h.status !== 'unknown');
    if (unhealthy.length === 0) return 'All layers healthy';
    return `${to}: ${unhealthy.map((h) => `${h.layer}=${h.status}`).join(', ')}`;
  }

  private severityFromStatus(status: HealthStatus): ImpactSeverity {
    switch (status) {
      case 'unhealthy': return 'critical';
      case 'degraded': return 'major';
      case 'unknown': return 'minor';
      default: return 'info';
    }
  }
}
