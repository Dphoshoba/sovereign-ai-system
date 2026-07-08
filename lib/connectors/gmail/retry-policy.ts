/**
 * Retry Policy
 * Deterministic exponential-style schedule with fixed intervals
 * No Date.now, no Math.random
 */

export interface RetryScheduleItem {
  attemptNumber: number;
  delaySeconds: number;
  description: string;
}

/**
 * Deterministic retry schedule
 * Fixed intervals: 5s, 10s, 20s (no randomization)
 */
export class RetryPolicy {
  private readonly maxRetries: number;
  private readonly baseDelaySeconds: number;
  private readonly delayMultiplier: number;
  private readonly maxDelaySeconds: number;

  /**
   * @param maxRetries Maximum number of retry attempts
   * @param baseDelaySeconds Initial delay in seconds
   * @param delayMultiplier Multiplier for exponential growth
   * @param maxDelaySeconds Maximum delay between retries
   */
  constructor(
    maxRetries: number = 3,
    baseDelaySeconds: number = 5,
    delayMultiplier: number = 2,
    maxDelaySeconds: number = 60
  ) {
    this.maxRetries = maxRetries;
    this.baseDelaySeconds = baseDelaySeconds;
    this.delayMultiplier = delayMultiplier;
    this.maxDelaySeconds = maxDelaySeconds;
  }

  /**
   * Get delay for specific attempt (deterministic, no randomization)
   * Attempt 1 (first failure) → 5s
   * Attempt 2 (second failure) → 10s
   * Attempt 3 (third failure) → 20s (capped)
   */
  getDelaySeconds(attemptNumber: number): number {
    if (attemptNumber < 1 || attemptNumber > this.maxRetries) {
      return 0;
    }

    // Exponential: base * (multiplier ^ (attempt - 1))
    const delay = this.baseDelaySeconds * Math.pow(this.delayMultiplier, attemptNumber - 1);
    return Math.min(Math.floor(delay), this.maxDelaySeconds);
  }

  /**
   * Get full schedule for all retries
   */
  getFullSchedule(): RetryScheduleItem[] {
    const schedule: RetryScheduleItem[] = [];

    for (let i = 1; i <= this.maxRetries; i++) {
      const delaySeconds = this.getDelaySeconds(i);
      schedule.push({
        attemptNumber: i,
        delaySeconds,
        description: `Retry ${i}: ${delaySeconds}s delay`,
      });
    }

    return schedule;
  }

  /**
   * Calculate next retry time (requires currentTime for determinism)
   * @param failureTime Time when execution failed
   * @param attemptNumber Which attempt failed
   * @param currentTime Current time (for deterministic calculation)
   */
  getNextRetryTime(failureTime: Date, attemptNumber: number, currentTime: Date): Date {
    if (attemptNumber >= this.maxRetries) {
      return new Date(0); // No retry
    }

    const delaySeconds = this.getDelaySeconds(attemptNumber + 1);
    const nextRetryMs = failureTime.getTime() + delaySeconds * 1000;
    return new Date(nextRetryMs);
  }

  /**
   * Check if should retry (deterministic)
   */
  shouldRetry(attemptNumber: number): boolean {
    return attemptNumber < this.maxRetries;
  }

  /**
   * Get cumulative delay for all retries up to attempt N
   */
  getCumulativeDelaySeconds(upToAttempt: number): number {
    let total = 0;
    for (let i = 1; i <= upToAttempt && i <= this.maxRetries; i++) {
      total += this.getDelaySeconds(i);
    }
    return total;
  }
}

/**
 * Standard Gmail retry policy (5s, 10s, 20s)
 */
export const GMAIL_RETRY_POLICY = new RetryPolicy(3, 5, 2, 60);

/**
 * Aggressive retry policy for time-sensitive operations (1s, 2s, 5s)
 */
export const AGGRESSIVE_RETRY_POLICY = new RetryPolicy(3, 1, 2, 10);

/**
 * Conservative retry policy for rate-limited operations (30s, 60s, 120s)
 */
export const CONSERVATIVE_RETRY_POLICY = new RetryPolicy(3, 30, 2, 180);
