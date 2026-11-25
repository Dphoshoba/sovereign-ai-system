import { ProviderCircuitBreaker } from "./circuit-breaker";
import {
  AttemptFn,
  AttemptOutcome,
  BackoffStrategy,
  FailureClassification,
  ProviderRetryConfig,
  RetryAttemptTelemetry,
  RetryExecutionTelemetry,
  RetryExecutor,
} from "./retry-policy";

export class RetryExecutorError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RetryExecutorError';
  }
}

export class RetryExecutorImpl implements RetryExecutor {
  execute(
    providerId: string,
    operation: string,
    attempt: AttemptFn,
    config: ProviderRetryConfig,
    circuitBreaker?: ProviderCircuitBreaker,
  ): RetryExecutionTelemetry {
    const telemetry: RetryAttemptTelemetry[] = [];
    const startTime = Date.now();
    let totalDurationMs = 0;

    // Circuit Breaker Check
    if (circuitBreaker) {
      const check = circuitBreaker.check(providerId);
      if (!check.allowed || check.state === 'OPEN') {
        totalDurationMs = Date.now() - startTime;
        const skipped: RetryAttemptTelemetry = {
          attemptNumber: 1,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: 0,
          outcome: 'SKIPPED',
          errorCode: 'CIRCUIT_OPEN',
          errorMessage: `Circuit breaker is ${check.state} for provider '${providerId}'`,
          delayBeforeAttemptMs: 0,
        };
        telemetry.push(skipped);
        return {
          providerId,
          operation,
          totalAttempts: 0,
          successful: false,
          finalErrorCode: 'CIRCUIT_OPEN',
          finalErrorMessage: `Circuit breaker is ${check.state} for provider '${providerId}'`,
          totalDurationMs,
          attempts: telemetry,
        };
      }
    }

    const policy = config.retryPolicy;
    let lastAttemptOutcome: AttemptOutcome = 'FAILURE';
    let lastErrorCode: string | null = null;
    let lastErrorMessage: string | null = null;

    for (let attemptNum = 1; attemptNum <= policy.maxAttempts; attemptNum++) {
      const delayMs = computeBackoffMs(attemptNum, policy.backoff);

      // For deterministic testing, report the delay but don't actually wait
      // In production the caller would enforce timing

      const attemptStartTime = Date.now();
      const result = attempt(config.timeoutPolicy.operationTimeoutMs);
      const attemptEndTime = Date.now();
      const durationMs = attemptEndTime - attemptStartTime;

      lastAttemptOutcome = result.outcome;
      lastErrorCode = result.errorCode;
      lastErrorMessage = result.errorMessage;

      const telemetryEntry: RetryAttemptTelemetry = {
        attemptNumber: attemptNum,
        startedAt: new Date(attemptStartTime).toISOString(),
        completedAt: new Date(attemptEndTime).toISOString(),
        durationMs,
        outcome: result.outcome,
        errorCode: result.errorCode,
        errorMessage: result.errorMessage,
        delayBeforeAttemptMs: delayMs,
      };
      telemetry.push(telemetryEntry);

      if (result.outcome === 'SUCCESS') {
        // Record success on circuit breaker
        if (circuitBreaker) {
          try {
            circuitBreaker.recordSuccess(providerId);
          } catch {
            // Best effort
          }
        }
        totalDurationMs = attemptEndTime - startTime;
        return {
          providerId,
          operation,
          totalAttempts: attemptNum,
          successful: true,
          finalErrorCode: null,
          finalErrorMessage: null,
          totalDurationMs,
          attempts: telemetry,
        };
      }

      // Failure — classify
      const classification = classify(
        result.errorCode ?? '',
        policy.retryableErrors,
      );

      if (classification === 'non-retryable') {
        // Record failure on circuit breaker
        if (circuitBreaker) {
          try {
            circuitBreaker.recordFailure(providerId);
          } catch {
            // Best effort
          }
        }
        totalDurationMs = attemptEndTime - startTime;
        return {
          providerId,
          operation,
          totalAttempts: attemptNum,
          successful: false,
          finalErrorCode: result.errorCode,
          finalErrorMessage: result.errorMessage,
          totalDurationMs,
          attempts: telemetry,
        };
      }

      // Retryable failure — update circuit breaker and continue
      if (circuitBreaker) {
        try {
          circuitBreaker.recordFailure(providerId);
        } catch {
          // Best effort
        }
      }

      // Check if this was the last attempt
      if (attemptNum === policy.maxAttempts) {
        totalDurationMs = attemptEndTime - startTime;
        return {
          providerId,
          operation,
          totalAttempts: attemptNum,
          successful: false,
          finalErrorCode: result.errorCode,
          finalErrorMessage: result.errorMessage,
          totalDurationMs,
          attempts: telemetry,
        };
      }
    }

    totalDurationMs = Date.now() - startTime;
    return {
      providerId,
      operation,
      totalAttempts: policy.maxAttempts,
      successful: false,
      finalErrorCode: lastErrorCode,
      finalErrorMessage: lastErrorMessage,
      totalDurationMs,
      attempts: telemetry,
    };
  }
}

// ── Pure functions ──

export function computeBackoffMs(
  attemptNumber: number,
  strategy: BackoffStrategy,
): number {
  if (attemptNumber <= 1) return 0;

  let delayMs: number;

  switch (strategy.type) {
    case 'fixed':
      delayMs = strategy.baseDelayMs;
      break;
    case 'linear':
      delayMs = strategy.baseDelayMs + strategy.multiplier * (attemptNumber - 2);
      break;
    case 'exponential':
      delayMs = strategy.baseDelayMs * Math.pow(strategy.multiplier, attemptNumber - 2);
      break;
  }

  return Math.min(delayMs, strategy.maxDelayMs);
}

export function classify(
  errorCode: string,
  retryableErrors: readonly string[],
): FailureClassification {
  if (retryableErrors.length === 0) return 'retryable';
  return retryableErrors.includes(errorCode) ? 'retryable' : 'non-retryable';
}
