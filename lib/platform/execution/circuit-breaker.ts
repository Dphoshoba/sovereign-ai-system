export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface ManualOverride {
  readonly state: CircuitState;
  readonly reason: string;
  readonly setBy: string;
  readonly setAt: string;
}

export interface ProviderCircuitState {
  readonly providerId: string;
  readonly state: CircuitState;
  readonly failureCount: number;
  readonly lastFailureAt: string | null;
  readonly lastSuccessAt: string | null;
  readonly trippedAt: string | null;
  readonly cooldownMs: number;
  readonly failureThreshold: number;
  readonly manualOverride: ManualOverride | null;
}

export interface CheckResult {
  readonly allowed: boolean;
  readonly state: CircuitState;
}

export interface CircuitBreakerOptions {
  readonly failureThreshold?: number;
  readonly cooldownMs?: number;
}

export interface ProviderCircuitBreaker {
  register(
    providerId: string,
    options?: CircuitBreakerOptions,
  ): ProviderCircuitState;
  getState(providerId: string): ProviderCircuitState | undefined;
  recordSuccess(providerId: string): ProviderCircuitState;
  recordFailure(providerId: string): ProviderCircuitState;
  forceState(
    providerId: string,
    state: CircuitState,
    reason: string,
    setBy: string,
  ): ProviderCircuitState;
  check(providerId: string): CheckResult;
  releaseOverride(providerId: string): ProviderCircuitState;
}
