/**
 * Quota Monitor
 *
 * Tracks Gmail API quotas for different operations.
 * Provides operator recommendations for quota management.
 */

import type { QuotaHealth } from '../../../src/lib/gmail-hardening/types';

export class QuotaMonitor {
  /**
   * Calculate quota health for all quota types
   */
  public calculateQuotaHealth(context: {
    readLimit?: number;
    readUsed?: number;
    draftLimit?: number;
    draftUsed?: number;
    executionLimit?: number;
    executionUsed?: number;
    retryLimit?: number;
    retryUsed?: number;
    currentTime?: Date;
  }): QuotaHealth {
    const currentTime = context.currentTime || new Date();

    // Set defaults (Gmail API standard quotas)
    const readLimit = context.readLimit || 1000;
    const readUsed = context.readUsed || 0;
    const draftLimit = context.draftLimit || 500;
    const draftUsed = context.draftUsed || 0;
    const executionLimit = context.executionLimit || 250;
    const executionUsed = context.executionUsed || 0;
    const retryLimit = context.retryLimit || 100;
    const retryUsed = context.retryUsed || 0;

    // Calculate remaining
    const readRemaining = Math.max(0, readLimit - readUsed);
    const draftRemaining = Math.max(0, draftLimit - draftUsed);
    const executionRemaining = Math.max(0, executionLimit - executionUsed);
    const retryRemaining = Math.max(0, retryLimit - retryUsed);

    // Calculate utilizations
    const readUtilization = readUsed / readLimit;
    const draftUtilization = draftUsed / draftLimit;
    const executionUtilization = executionUsed / executionLimit;
    const retryUtilization = retryUsed / retryLimit;

    // Determine if any quota is exceeded
    const readExceeded = readRemaining <= 0;
    const draftExceeded = draftRemaining <= 0;
    const executionExceeded = executionRemaining <= 0;
    const retryExceeded = retryRemaining <= 0;

    // Calculate overall score (0-100)
    const avgUtilization = (readUtilization + draftUtilization + executionUtilization + retryUtilization) / 4;
    let quotaScore = Math.round(100 * (1 - avgUtilization));

    // Determine status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let recommendation = '';
    let quotaWarning = false;
    let quotaExceeded = false;

    if (readExceeded || draftExceeded || executionExceeded || retryExceeded) {
      // Critical: quota exceeded
      quotaScore = 0;
      status = 'critical';
      severity = 'critical';
      quotaExceeded = true;
      quotaWarning = true;

      const exceeded = [];
      if (readExceeded) exceeded.push('read');
      if (draftExceeded) exceeded.push('draft');
      if (executionExceeded) exceeded.push('execution');
      if (retryExceeded) exceeded.push('retry');

      recommendation =
        exceeded.join(', ').charAt(0).toUpperCase() + exceeded.join(', ').slice(1) +
        ' quota exceeded. All operations blocked. Wait for quota reset or request emergency quota increase.';
    } else if (avgUtilization >= 0.9 || readUtilization >= 0.95) {
      // High utilization
      quotaScore = Math.round(quotaScore * 0.3);
      status = 'degraded';
      severity = 'high';
      quotaWarning = true;

      const critical = [];
      if (readUtilization >= 0.95) critical.push('Read quota is critically high');
      if (draftUtilization >= 0.95) critical.push('Draft quota is critically high');
      if (executionUtilization >= 0.95) critical.push('Execution quota is critically high');

      if (critical.length > 0) {
        recommendation = critical.join('. ') + '. Reduce API calls immediately.';
      } else {
        recommendation = 'Quota usage is high (90%+). Reduce API call rate.';
      }
    } else if (avgUtilization >= 0.75 || readUtilization >= 0.9) {
      // Moderate warning
      quotaScore = Math.round(quotaScore * 0.6);
      status = 'degraded';
      severity = 'medium';
      quotaWarning = true;

      if (readUtilization >= 0.9) {
        recommendation = `Read quota at ${Math.round(readUtilization * 100)}%. Consider reducing API calls or increasing quota.`;
      } else {
        recommendation = `Average quota usage at ${Math.round(avgUtilization * 100)}%. Monitor for potential issues.`;
      }
    } else {
      // Healthy
      quotaScore = Math.round(quotaScore);
      status = 'healthy';
      severity = 'low';
      quotaWarning = false;

      if (avgUtilization >= 0.5) {
        recommendation = `Average quota usage at ${Math.round(avgUtilization * 100)}%. All quotas have >50% remaining.`;
      } else {
        recommendation = `All quotas healthy. Average usage ${Math.round(avgUtilization * 100)}%. No quota concerns.`;
      }
    }

    return {
      readQuota: { limit: readLimit, remaining: readRemaining },
      draftQuota: { limit: draftLimit, remaining: draftRemaining },
      executionQuota: { limit: executionLimit, remaining: executionRemaining },
      retryQuota: { limit: retryLimit, remaining: retryRemaining },
      quotaScore,
      quotaWarning,
      quotaExceeded,
      status,
      severity,
      recommendation,
      lastValidated: currentTime,
      healthTrend: 'steady',
    };
  }

  /**
   * Get quota utilization percentages
   */
  public getUtilizationPercent(quota: QuotaHealth): {
    read: number;
    draft: number;
    execution: number;
    retry: number;
    average: number;
  } {
    const readUsed = quota.readQuota.limit - quota.readQuota.remaining;
    const draftUsed = quota.draftQuota.limit - quota.draftQuota.remaining;
    const executionUsed = quota.executionQuota.limit - quota.executionQuota.remaining;
    const retryUsed = quota.retryQuota.limit - quota.retryQuota.remaining;

    const read = Math.round((readUsed / quota.readQuota.limit) * 100);
    const draft = Math.round((draftUsed / quota.draftQuota.limit) * 100);
    const execution = Math.round((executionUsed / quota.executionQuota.limit) * 100);
    const retry = Math.round((retryUsed / quota.retryQuota.limit) * 100);

    return {
      read,
      draft,
      execution,
      retry,
      average: Math.round((read + draft + execution + retry) / 4),
    };
  }

  /**
   * Check if any quota is critically low
   */
  public isCritical(quota: QuotaHealth): boolean {
    return quota.quotaExceeded || (quota.status === 'critical' && quota.severity === 'critical');
  }

  /**
   * Check if quota is warning level
   */
  public isWarning(quota: QuotaHealth): boolean {
    return quota.quotaWarning && !quota.quotaExceeded;
  }
}
