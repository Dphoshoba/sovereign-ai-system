// ── Operational State ──

export type OperationalState =
  | 'healthy'
  | 'degraded'
  | 'recovering'
  | 'maintenance'
  | 'paused'
  | 'failed';

// ── Layer Health ──

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

export interface LayerHealth {
  readonly layer: string;
  readonly status: HealthStatus;
  readonly score: number;
  readonly lastUpdated: number;
  readonly details: string;
}

// ── State Transition ──

export interface StateTransition {
  readonly from: OperationalState;
  readonly to: OperationalState;
  readonly timestamp: number;
  readonly reason: string;
  readonly triggeredBy: string;
  readonly layerHealthSnapshot: readonly LayerHealth[];
}

// ── Operational Status ──

export interface OperationalStatus {
  readonly state: OperationalState;
  readonly overallScore: number;
  readonly layerHealth: readonly LayerHealth[];
  readonly lastTransition: number;
  readonly transitionCount: number;
}

// ── Dependency Impact ──

export type ImpactSeverity = 'critical' | 'major' | 'minor' | 'info';

export interface DependencyImpact {
  readonly source: string;
  readonly type: string;
  readonly affectedLayers: readonly string[];
  readonly severity: ImpactSeverity;
  readonly description: string;
  readonly downstreamEffects: readonly string[];
}

// ── Operational State Engine ──

export interface OperationalStateEngine {
  reportHealth(layer: string, health: LayerHealth): void;
  getStatus(): OperationalStatus;
  getTransitionHistory(limit?: number): readonly StateTransition[];
  getDependencyImpact(component: string): readonly DependencyImpact[];
  getActiveImpacts(): readonly DependencyImpact[];
  setMaintenance(enabled: boolean, reason: string): void;
  setPaused(enabled: boolean, reason: string): void;
}

export class OperationalStateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OperationalStateError';
  }
}
