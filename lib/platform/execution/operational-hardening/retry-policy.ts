import { ProviderErrorInfo, ProviderErrorCode, RETRYABLE_ERROR_CODES } from '../provider-contracts/provider-error';
import { BackoffStrategy, BackoffConfig } from './backoff-strategy';

export interface RetryBudget {
  totalRetries: number;
  remainingRetries: number;
  budgetResetAt: string;
}

export interface RetryDecision {
  shouldRetry: boolean;
  delayMs: number;
  reason: string;
  attempt: number;
  budgetExhausted: boolean;
}

export interface RetryPolicyConfig {
  maxRetries: number;
  retryableCodes: ProviderErrorCode[];
  backoff?: Partial<BackoffConfig>;
  retryBudget?: {
    maxRetryBudget: number;
    budgetWindowMs: number;
  };
}

export const DEFAULT_RETRY_CONFIG: RetryPolicyConfig = {
  maxRetries: 3,
  retryableCodes: [...RETRYABLE_ERROR_CODES],
  backoff: {},
};

export class RetryPolicy {
  private config: RetryPolicyConfig;
  private backoff: BackoffStrategy;
  private budget: { total: number; remaining: number; resetAt: number };

  constructor(config: Partial<RetryPolicyConfig> = {}) {
    this.config = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.backoff = new BackoffStrategy(this.config.backoff);
    const budgetTotal = this.config.retryBudget?.maxRetryBudget ?? this.config.maxRetries;
    this.budget = {
      total: budgetTotal,
      remaining: budgetTotal,
      resetAt: Date.now() + (this.config.retryBudget?.budgetWindowMs ?? 60000),
    };
  }

  evaluate(error: ProviderErrorInfo, attempt: number): RetryDecision {
    const isRetryable = this.config.retryableCodes.includes(error.code);
    const withinBudget = this.budget.remaining > 0;
    const withinAttemptLimit = attempt < this.config.maxRetries;
    const delayMs = this.backoff.computeDelay(attempt);

    if (!isRetryable) {
      return { shouldRetry: false, delayMs: 0, reason: `NON_RETRYABLE: ${error.code}`, attempt, budgetExhausted: false };
    }

    if (!withinBudget) {
      return { shouldRetry: false, delayMs: 0, reason: 'BUDGET_EXHAUSTED', attempt, budgetExhausted: true };
    }

    if (!withinAttemptLimit) {
      return { shouldRetry: false, delayMs: 0, reason: `MAX_ATTEMPTS_REACHED: ${attempt}`, attempt, budgetExhausted: false };
    }

    this.budget.remaining--;
    return { shouldRetry: true, delayMs, reason: `RETRYING: ${error.code} attempt=${attempt + 1}`, attempt, budgetExhausted: false };
  }

  getRemainingBudget(): number {
    return this.budget.remaining;
  }

  resetBudget(): void {
    this.budget.remaining = this.budget.total;
    this.budget.resetAt = Date.now() + 60000;
  }

  getBackoffDelay(attempt: number): number {
    return this.backoff.computeDelay(attempt);
  }

  getConfig(): RetryPolicyConfig {
    return { ...this.config };
  }

  recordFailure(): void {
    this.budget.remaining = Math.max(0, this.budget.remaining - 1);
  }
}
