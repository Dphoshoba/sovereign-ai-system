import { ProviderCircuitBreaker } from "./circuit-breaker";

// ── Timeout ──

export interface TimeoutPolicy {
  readonly operationTimeoutMs: number;
}

// ── Backoff ──

export type BackoffStrategyType = 'fixed' | 'exponential' | 'linear';

export interface BackoffStrategy {
  readonly type: BackoffStrategyType;
  readonly baseDelayMs: number;
  readonly maxDelayMs: number;
  readonly multiplier: number;
}

export const DEFAULT_BACKOFF: BackoffStrategy = {
  type: 'exponential',
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  multiplier: 2,
};

// ── Retry Policy ──

export interface RetryPolicy {
  readonly maxAttempts: number;
  readonly backoff: BackoffStrategy;
  readonly retryableErrors: readonly string[];
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  backoff: DEFAULT_BACKOFF,
  retryableErrors: [],
};

// ── Provider Config ──

export interface ProviderRetryConfig {
  readonly providerId: string;
  readonly retryPolicy: RetryPolicy;
  readonly timeoutPolicy: TimeoutPolicy;
}

// ── Attempt Result ──

export type AttemptOutcome = 'SUCCESS' | 'FAILURE' | 'TIMEOUT' | 'SKIPPED';

export interface AttemptResult {
  readonly outcome: AttemptOutcome;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
}

// ── Telemetry ──

export interface RetryAttemptTelemetry {
  readonly attemptNumber: number;
  readonly startedAt: string;
  readonly completedAt: string;
  readonly durationMs: number;
  readonly outcome: AttemptOutcome;
  readonly errorCode: string | null;
  readonly errorMessage: string | null;
  readonly delayBeforeAttemptMs: number;
}

export interface RetryExecutionTelemetry {
  readonly providerId: string;
  readonly operation: string;
  readonly totalAttempts: number;
  readonly successful: boolean;
  readonly finalErrorCode: string | null;
  readonly finalErrorMessage: string | null;
  readonly totalDurationMs: number;
  readonly attempts: readonly RetryAttemptTelemetry[];
}

// ── Classification ──

export type FailureClassification = 'retryable' | 'non-retryable';

// ── Execute Attempt ──

export interface AttemptFn {
  (timeoutMs: number): AttemptResult;
}

// ── Retry Executor ──

export interface RetryExecutor {
  execute(
    providerId: string,
    operation: string,
    attempt: AttemptFn,
    config: ProviderRetryConfig,
    circuitBreaker?: ProviderCircuitBreaker,
  ): RetryExecutionTelemetry;
}
