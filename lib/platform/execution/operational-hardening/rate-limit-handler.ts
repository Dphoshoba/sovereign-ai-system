import { ProviderResponse } from '../provider-contracts/provider-response';
import { BackoffStrategy, BackoffConfig } from './backoff-strategy';

export interface RateLimitInfo {
  isRateLimited: boolean;
  retryAfterMs: number | null;
  limit: number | null;
  remaining: number | null;
  resetAt: string | null;
}

export interface RateLimitDecision {
  shouldWait: boolean;
  waitMs: number;
  reason: string;
}

export const RATE_LIMIT_STATUS_CODES = [429, 403];

export class RateLimitHandler {
  private backoff: BackoffStrategy;

  constructor(backoffConfig?: Partial<BackoffConfig>) {
    this.backoff = new BackoffStrategy({
      algorithm: 'EXPONENTIAL',
      baseDelayMs: 2000,
      maxDelayMs: 120000,
      jitterFactor: 0.2,
      multiplier: 2,
      ...backoffConfig,
    });
  }

  detectRateLimit(response: ProviderResponse): RateLimitInfo {
    const isRateLimited = RATE_LIMIT_STATUS_CODES.includes(response.statusCode);
    if (!isRateLimited) {
      return { isRateLimited: false, retryAfterMs: null, limit: null, remaining: null, resetAt: null };
    }

    const headers = response.headers ?? {};
    const retryAfter = this.parseRetryAfter(headers['Retry-After'] ?? headers['retry-after'] ?? null);
    const rateLimit = headers['X-RateLimit-Limit'] ?? headers['x-ratelimit-limit'] ?? null;
    const rateRemaining = headers['X-RateLimit-Remaining'] ?? headers['x-ratelimit-remaining'] ?? null;
    const rateReset = headers['X-RateLimit-Reset'] ?? headers['x-ratelimit-reset'] ?? null;

    return {
      isRateLimited: true,
      retryAfterMs: retryAfter,
      limit: rateLimit ? parseInt(String(rateLimit), 10) : null,
      remaining: rateRemaining ? parseInt(String(rateRemaining), 10) : null,
      resetAt: rateReset || null,
    };
  }

  computeWaitTime(rateLimitInfo: RateLimitInfo, attempt: number): RateLimitDecision {
    if (!rateLimitInfo.isRateLimited) {
      return { shouldWait: false, waitMs: 0, reason: 'NOT_RATE_LIMITED' };
    }

    if (rateLimitInfo.retryAfterMs !== null) {
      const waitMs = rateLimitInfo.retryAfterMs + Math.round(rateLimitInfo.retryAfterMs * 0.1);
      return { shouldWait: true, waitMs, reason: `RETRY_AFTER: waiting ${waitMs}ms` };
    }

    if (rateLimitInfo.remaining !== null && rateLimitInfo.remaining <= 0) {
      const waitMs = this.backoff.computeDelay(attempt) * 2;
      return { shouldWait: true, waitMs, reason: `QUOTA_EXCEEDED: waiting ${waitMs}ms` };
    }

    const waitMs = this.backoff.computeDelay(attempt);
    return { shouldWait: true, waitMs, reason: `RATE_LIMITED: waiting ${waitMs}ms` };
  }

  private parseRetryAfter(value: string | null): number | null {
    if (!value) return null;
    const asInt = parseInt(value, 10);
    if (!isNaN(asInt)) return asInt * 1000;
    const asDate = Date.parse(value);
    if (!isNaN(asDate)) return Math.max(0, asDate - Date.now());
    return null;
  }
}
