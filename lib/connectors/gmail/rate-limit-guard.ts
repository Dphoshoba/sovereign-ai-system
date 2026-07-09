/**
 * Rate Limit Guard
 *
 * Monitors and enforces Gmail API rate limits.
 * Provides early warning and graceful degradation.
 * Never reveals raw rate limit state; always translates to operator recommendations.
 */

import type { RateLimitHealth } from '../../../src/lib/gmail-hardening/types';

export class RateLimitGuard {
  /**
   * Calculate rate limit health based on current request state
   */
  public calculateRateLimit(context: {
    currentRequests: number;
    requestLimit?: number;
    windowRemainingSeconds?: number;
    currentTime?: Date;
  }): RateLimitHealth {
    const limit = context.requestLimit || 600;
    const windowRemaining = context.windowRemainingSeconds || 3600;
    const requestsRemaining = Math.max(0, limit - context.currentRequests);
    const utilization = context.currentRequests / limit;

    let tier: 'Normal' | 'Elevated' | 'Warning' | 'Limited' | 'Cooldown';
    let score: number;
    let status: 'healthy' | 'degraded' | 'critical';
    let severity: 'low' | 'medium' | 'high' | 'critical';
    let recommendation: string;
    let cooldownSeconds = 0;

    if (context.currentRequests >= limit) {
      // Rate limited
      tier = 'Limited';
      score = 10;
      status = 'critical';
      severity = 'critical';
      recommendation =
        'Rate limit reached. All requests blocked for 5 minutes. No new operations possible.';
      cooldownSeconds = 300;
    } else if (utilization >= 0.95) {
      // Cooldown/warning
      tier = 'Cooldown';
      score = 20;
      status = 'critical';
      severity = 'critical';
      recommendation =
        'Rate limit critically high. Requests will be throttled. Pause operations immediately.';
      cooldownSeconds = 60;
    } else if (utilization >= 0.85) {
      // Warning
      tier = 'Warning';
      score = 40;
      status = 'degraded';
      severity = 'high';
      recommendation =
        'Rate limit critically high. Requests will be throttled. Pause operations immediately.';
      cooldownSeconds = 30;
    } else if (utilization >= 0.7) {
      // Elevated
      tier = 'Elevated';
      score = 70;
      status = 'degraded';
      severity = 'medium';
      recommendation =
        'Rate limit elevated. Reduce request frequency. Limit will reset in ' +
        windowRemaining +
        ' seconds.';
      cooldownSeconds = 0;
    } else {
      // Normal
      tier = 'Normal';
      score = 100;
      status = 'healthy';
      severity = 'low';
      recommendation = 'Rate limit status normal. No throttling in effect.';
      cooldownSeconds = 0;
    }

    return {
      score,
      status,
      severity,
      recommendation,
      lastValidated: context.currentTime || new Date(),
      healthTrend: 'steady',
      currentRequests: context.currentRequests,
      remainingRequests: requestsRemaining,
      windowRemaining: windowRemaining,
      cooldownSeconds,
      rateLimitScore: score,
      tier,
    };
  }

  /**
   * Check if operation can proceed given current rate limit
   */
  public canProceed(rateLimit: RateLimitHealth): boolean {
    return rateLimit.tier !== 'Limited' && rateLimit.tier !== 'Cooldown';
  }

  /**
   * Get wait time in seconds before retry is safe
   */
  public getBackoffSeconds(rateLimit: RateLimitHealth): number {
    if (rateLimit.tier === 'Limited') return 300; // 5 minutes
    if (rateLimit.tier === 'Cooldown') return 60; // 1 minute
    if (rateLimit.tier === 'Warning') return 30; // 30 seconds
    if (rateLimit.tier === 'Elevated') return 10; // 10 seconds
    return 0; // Normal - no backoff needed
  }

  /**
   * Get stats for monitoring
   */
  public getStats(rateLimit: RateLimitHealth): {
    utilizationPercent: number;
    requestsRemaining: number;
    tier: string;
    canProceed: boolean;
  } {
    const utilizationPercent = Math.round((rateLimit.currentRequests / 600) * 100);
    return {
      utilizationPercent,
      requestsRemaining: rateLimit.remainingRequests,
      tier: rateLimit.tier,
      canProceed: this.canProceed(rateLimit),
    };
  }
}
