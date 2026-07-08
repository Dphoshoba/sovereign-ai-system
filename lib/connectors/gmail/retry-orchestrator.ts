/**
 * Retry Orchestrator
 * 
 * Manages deterministic retry scheduling and execution.
 * Provides strict retry eligibility checks with time-based scheduling.
 */

import type {
  RetryPolicy,
  ExecutionFailure,
  FailureMetadata,
} from '../../../src/lib/gmail-resilience/types';

export class RetryOrchestrator {
  /**
   * Default retry policy: exponential backoff
   */
  private readonly DEFAULT_POLICY: RetryPolicy = {
    maxAttempts: 3,
    retryIntervals: [5000, 10000, 20000], // 5s, 10s, 20s (milliseconds)
    retryableClasses: [
      'transient',
      'rate_limited',
      'auth_expired',
      'network_error',
      'gmail_unavailable',
      'quota_exceeded',
    ],
  };

  /**
   * Check if failure is retryable
   */
  public isRetryable(
    failure: FailureMetadata,
    policy: RetryPolicy = this.DEFAULT_POLICY
  ): boolean {
    return (
      failure.retryable &&
      policy.retryableClasses.includes(failure.classification)
    );
  }

  /**
   * Check if retry attempt is eligible
   */
  public canRetry(
    executionFailure: ExecutionFailure,
    policy: RetryPolicy = this.DEFAULT_POLICY,
    context?: {
      approvalValid?: boolean;
      oauthValid?: boolean;
      idempotencyValid?: boolean;
      safetyPassed?: boolean;
      currentTime?: Date;
    }
  ): {
    canRetry: boolean;
    reason?: string;
    nextRetryTime?: Date;
  } {
    const currentTime = context?.currentTime || new Date();

    // Check failure is retryable
    if (!this.isRetryable(executionFailure.failureClassification, policy)) {
      return {
        canRetry: false,
        reason: `Failure class '${executionFailure.failureClassification.classification}' is not retryable`,
      };
    }

    // Check attempt count
    if (executionFailure.attemptCount >= policy.maxAttempts) {
      return {
        canRetry: false,
        reason: `Max retry attempts (${policy.maxAttempts}) exceeded`,
      };
    }

    // Check approval still valid
    if (context?.approvalValid === false) {
      return {
        canRetry: false,
        reason: 'Approval is no longer valid',
      };
    }

    // Check OAuth is valid (or can be refreshed)
    if (context?.oauthValid === false) {
      return {
        canRetry: false,
        reason: 'OAuth token is invalid and cannot be refreshed',
      };
    }

    // Check idempotency key is still valid
    if (context?.idempotencyValid === false) {
      return {
        canRetry: false,
        reason: 'Idempotency key is no longer valid',
      };
    }

    // Check safety policy still passes
    if (context?.safetyPassed === false) {
      return {
        canRetry: false,
        reason: 'Safety policy check failed',
      };
    }

    // Check if next retry is scheduled
    if (
      executionFailure.nextRetryScheduled &&
      currentTime.getTime() < executionFailure.nextRetryScheduled.getTime()
    ) {
      return {
        canRetry: false,
        reason: `Retry not yet scheduled (scheduled for ${executionFailure.nextRetryScheduled.toISOString()})`,
        nextRetryTime: executionFailure.nextRetryScheduled,
      };
    }

    return {
      canRetry: true,
      nextRetryTime: this.getNextRetryTime(
        executionFailure.attemptCount,
        policy,
        currentTime
      ),
    };
  }

  /**
   * Calculate next retry time (deterministic)
   */
  public getNextRetryTime(
    attemptCount: number,
    policy: RetryPolicy = this.DEFAULT_POLICY,
    currentTime: Date = new Date()
  ): Date {
    if (attemptCount >= policy.maxAttempts) {
      return new Date(currentTime.getTime() + Infinity); // No more retries
    }

    const nextAttemptIndex = attemptCount;
    const delayMs =
      policy.retryIntervals[nextAttemptIndex] ||
      policy.retryIntervals[policy.retryIntervals.length - 1];

    return new Date(currentTime.getTime() + delayMs);
  }

  /**
   * Schedule retry attempt (deterministic)
   */
  public scheduleRetry(
    executionFailure: ExecutionFailure,
    policy: RetryPolicy = this.DEFAULT_POLICY,
    currentTime: Date = new Date()
  ): {
    scheduled: boolean;
    nextRetryTime: Date;
    reason?: string;
  } {
    const eligibility = this.canRetry(executionFailure, policy, {
      currentTime,
    });

    if (!eligibility.canRetry) {
      return {
        scheduled: false,
        nextRetryTime: eligibility.nextRetryTime || currentTime,
        reason: eligibility.reason,
      };
    }

    const nextRetryTime = this.getNextRetryTime(
      executionFailure.attemptCount,
      policy,
      currentTime
    );

    return {
      scheduled: true,
      nextRetryTime,
    };
  }

  /**
   * Get retry statistics
   */
  public getRetryStats(failures: ExecutionFailure[]): {
    totalFailures: number;
    retryableFailures: number;
    scheduledRetries: number;
    deadLetteredFailures: number;
    maxAttemptsExceeded: number;
  } {
    const policy = this.DEFAULT_POLICY;

    return {
      totalFailures: failures.length,
      retryableFailures: failures.filter(f =>
        this.isRetryable(f.failureClassification, policy)
      ).length,
      scheduledRetries: failures.filter(
        f =>
          !f.isDead &&
          f.attemptCount < policy.maxAttempts &&
          this.isRetryable(f.failureClassification, policy)
      ).length,
      deadLetteredFailures: failures.filter(f => f.isDead).length,
      maxAttemptsExceeded: failures.filter(f => f.attemptCount >= policy.maxAttempts).length,
    };
  }

  /**
   * Get default policy
   */
  public getDefaultPolicy(): RetryPolicy {
    return this.DEFAULT_POLICY;
  }
}
