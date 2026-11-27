import {
  CheckResult,
  CircuitBreakerOptions,
  CircuitState,
  ManualOverride,
  ProviderCircuitBreaker,
  ProviderCircuitState,
} from "./circuit-breaker";

export class CircuitBreakerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CircuitBreakerError';
  }
}

const DEFAULT_FAILURE_THRESHOLD = 5;
const DEFAULT_COOLDOWN_MS = 30000;

export class ProviderCircuitBreakerImpl implements ProviderCircuitBreaker {
  private readonly entries = new Map<string, ProviderCircuitState>();

  register(
    providerId: string,
    options?: CircuitBreakerOptions,
  ): ProviderCircuitState {
    if (this.entries.has(providerId)) {
      const existing = this.entries.get(providerId)!;
      existing as ProviderCircuitState;
    }

    const entry: ProviderCircuitState = {
      providerId,
      state: 'CLOSED',
      failureCount: 0,
      lastFailureAt: null,
      lastSuccessAt: null,
      trippedAt: null,
      cooldownMs: options?.cooldownMs ?? DEFAULT_COOLDOWN_MS,
      failureThreshold: options?.failureThreshold ?? DEFAULT_FAILURE_THRESHOLD,
      manualOverride: null,
    };

    this.entries.set(providerId, entry);
    return { ...entry };
  }

  getState(providerId: string): ProviderCircuitState | undefined {
    const entry = this.entries.get(providerId);
    return entry ? { ...entry } : undefined;
  }

  recordSuccess(providerId: string): ProviderCircuitState {
    const entry = this.getOrThrow(providerId);
    const updated: ProviderCircuitState = {
      ...entry,
      failureCount: 0,
      lastSuccessAt: new Date().toISOString(),
      state: entry.state === 'HALF_OPEN' ? 'CLOSED' : entry.state,
      trippedAt: entry.state === 'HALF_OPEN' ? null : entry.trippedAt,
    };
    this.entries.set(providerId, updated);
    return { ...updated };
  }

  recordFailure(providerId: string): ProviderCircuitState {
    const entry = this.getOrThrow(providerId);

    const newFailureCount = entry.failureCount + 1;
    const now = new Date().toISOString();

    let newState: CircuitState = entry.state;

    if (entry.state === 'HALF_OPEN') {
      newState = 'OPEN';
    } else if (
      entry.state === 'CLOSED' &&
      newFailureCount >= entry.failureThreshold
    ) {
      newState = 'OPEN';
    }

    const updated: ProviderCircuitState = {
      ...entry,
      failureCount: newFailureCount,
      lastFailureAt: now,
      state: newState,
      trippedAt: newState === 'OPEN' && entry.state !== 'OPEN' ? now : entry.trippedAt,
    };

    this.entries.set(providerId, updated);
    return { ...updated };
  }

  forceState(
    providerId: string,
    state: CircuitState,
    reason: string,
    setBy: string,
  ): ProviderCircuitState {
    const entry = this.getOrThrow(providerId);
    const override: ManualOverride = {
      state,
      reason,
      setBy,
      setAt: new Date().toISOString(),
    };

    const updated: ProviderCircuitState = {
      ...entry,
      state,
      manualOverride: override,
      trippedAt: state === 'OPEN' ? entry.trippedAt ?? new Date().toISOString() : null,
    };

    this.entries.set(providerId, updated);
    return { ...updated };
  }

  releaseOverride(providerId: string): ProviderCircuitState {
    const entry = this.getOrThrow(providerId);
    if (!entry.manualOverride) {
      throw new CircuitBreakerError(
        `No override to release for provider '${providerId}'`,
      );
    }

    const updated: ProviderCircuitState = {
      ...entry,
      state: 'CLOSED',
      manualOverride: null,
    };
    this.entries.set(providerId, updated);
    return { ...updated };
  }

  check(providerId: string): CheckResult {
    const entry = this.entries.get(providerId);
    if (!entry) {
      return { allowed: false, state: 'OPEN' };
    }

    let effectiveState = entry.state;

    if (entry.manualOverride) {
      effectiveState = entry.manualOverride.state;
    } else if (entry.state === 'OPEN' && entry.trippedAt) {
      const trippedTime = new Date(entry.trippedAt).getTime();
      const elapsed = Date.now() - trippedTime;
      if (elapsed >= entry.cooldownMs) {
        effectiveState = 'HALF_OPEN';
        this.entries.set(providerId, { ...entry, state: 'HALF_OPEN' });
      }
    }

    return {
      allowed: effectiveState !== 'OPEN',
      state: effectiveState,
    };
  }

  private getOrThrow(providerId: string): ProviderCircuitState {
    const entry = this.entries.get(providerId);
    if (!entry) {
      throw new CircuitBreakerError(
        `Provider '${providerId}' not registered with circuit breaker`,
      );
    }
    return entry;
  }
}
