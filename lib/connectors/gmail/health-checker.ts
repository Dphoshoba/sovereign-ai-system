/**
 * Health Checker
 *
 * Aggregates all health components into a production readiness assessment.
 * Provides operator-ready recommendations and warnings.
 * Never exposes sensitive data.
 */

import type { GmailHardeningAggregateHealth, OperatorWarning } from '../../../src/lib/gmail-hardening/types';
import { RateLimitGuard } from './rate-limit-guard';
import { TokenHealthMonitor } from './token-health-monitor';
import { QuotaMonitor } from './quota-monitor';
import { PermissionScopeValidator } from './permission-scope-validator';

export class HealthChecker {
  private rateLimitGuard = new RateLimitGuard();
  private tokenMonitor = new TokenHealthMonitor();
  private quotaMonitor = new QuotaMonitor();
  private scopeValidator = new PermissionScopeValidator();

  /**
   * Perform comprehensive health check
   */
  public checkHealth(context: {
    hasAccessToken?: boolean;
    hasRefreshToken?: boolean;
    tokenExpiresAt?: Date;
    tokenValid?: boolean;
    tokenRevoked?: boolean;
    grantedScopes?: string[];
    readQuotaUsed?: number;
    draftQuotaUsed?: number;
    executionQuotaUsed?: number;
    retryQuotaUsed?: number;
    currentRequests?: number;
    windowRemainingSeconds?: number;
    complianceScore?: number;
    resilienceScore?: number;
    queueHealth?: number;
    approvalHealth?: number;
    previewHealth?: number;
    executionHealth?: number;
    currentTime?: Date;
  }): GmailHardeningAggregateHealth {
    const currentTime = context.currentTime || new Date();

    // Get individual health components
    const tokenHealth = this.tokenMonitor.monitorTokenHealth({
      hasAccessToken: context.hasAccessToken,
      hasRefreshToken: context.hasRefreshToken,
      expiresAt: context.tokenExpiresAt,
      isValid: context.tokenValid ?? true,
      isRevoked: context.tokenRevoked,
      currentTime,
    }).health;

    const quotaHealth = this.quotaMonitor.calculateQuotaHealth({
      readUsed: context.readQuotaUsed,
      draftUsed: context.draftQuotaUsed,
      executionUsed: context.executionQuotaUsed,
      retryUsed: context.retryQuotaUsed,
      currentTime,
    });

    const scopeHealth = this.scopeValidator.validateScopes({
      grantedScopes: context.grantedScopes || [],
      currentTime,
    }).health;

    const rateLimitHealth = this.rateLimitGuard.calculateRateLimit({
      currentRequests: context.currentRequests || 0,
      windowRemainingSeconds: context.windowRemainingSeconds || 3600,
      currentTime,
    });

    const connectionHealth = {
      score: Math.round((tokenHealth.score + rateLimitHealth.score + quotaHealth.quotaScore) / 3),
      status:
        tokenHealth.status === 'critical' || quotaHealth.status === 'critical' || rateLimitHealth.status === 'critical'
          ? ('critical' as const)
          : tokenHealth.status === 'degraded' || quotaHealth.status === 'degraded' || rateLimitHealth.status === 'degraded'
            ? ('degraded' as const)
            : ('healthy' as const),
      severity:
        tokenHealth.severity === 'critical' || quotaHealth.severity === 'critical' || rateLimitHealth.severity === 'critical'
          ? ('critical' as const)
          : tokenHealth.severity === 'high' || quotaHealth.severity === 'high' || rateLimitHealth.severity === 'high'
            ? ('high' as const)
            : tokenHealth.severity === 'medium' || quotaHealth.severity === 'medium' || rateLimitHealth.severity === 'medium'
              ? ('medium' as const)
              : ('low' as const),
      recommendation: 'Check individual component health for details.',
      lastValidated: currentTime,
      healthTrend: 'steady' as const,
      connectionReadiness: Math.round((tokenHealth.score + rateLimitHealth.score + quotaHealth.quotaScore) / 3),
    };

    // Compile operator warnings
    const operatorWarnings: OperatorWarning[] = [];

    if (tokenHealth.status === 'critical') {
      operatorWarnings.push({
        id: 'warning_token_critical',
        severity: 'critical',
        message: tokenHealth.recommendation,
        recommendedAction: 'Refresh or re-authenticate immediately.',
        createdAt: currentTime,
      });
    }

    if (quotaHealth.quotaExceeded) {
      operatorWarnings.push({
        id: 'warning_quota_exceeded',
        severity: 'critical',
        message: quotaHealth.recommendation,
        recommendedAction: 'Wait for quota reset or request emergency quota increase.',
        createdAt: currentTime,
      });
    }

    if (scopeHealth.missingScopes.length > 0) {
      operatorWarnings.push({
        id: 'warning_scope_missing',
        severity: 'critical',
        message: `Missing required scope(s): ${scopeHealth.missingScopes.join(', ')}`,
        recommendedAction: 'Re-authenticate with proper scopes.',
        createdAt: currentTime,
      });
    }

    if (rateLimitHealth.tier === 'Limited' || rateLimitHealth.tier === 'Cooldown') {
      operatorWarnings.push({
        id: 'warning_rate_limit_critical',
        severity: 'critical',
        message: rateLimitHealth.recommendation,
        recommendedAction: 'Pause all operations until rate limit resets.',
        createdAt: currentTime,
      });
    }

    if (tokenHealth.status === 'degraded') {
      operatorWarnings.push({
        id: 'warning_token_degraded',
        severity: 'high',
        message: tokenHealth.recommendation,
        recommendedAction: 'Refresh token within the next few minutes.',
        createdAt: currentTime,
      });
    }

    if (quotaHealth.quotaWarning && !quotaHealth.quotaExceeded) {
      operatorWarnings.push({
        id: 'warning_quota_high',
        severity: 'medium',
        message: quotaHealth.recommendation,
        recommendedAction: 'Monitor quota usage. Consider reducing API call rate.',
        createdAt: currentTime,
      });
    }

    if (scopeHealth.highRiskScopes.length > 0) {
      operatorWarnings.push({
        id: 'warning_scope_high_risk',
        severity: 'high',
        message: `High-risk scope(s) granted: ${scopeHealth.highRiskScopes.join(', ')}`,
        recommendedAction: 'Review and remove high-risk scopes. Do not use until Build 140 certification.',
        createdAt: currentTime,
      });
    }

    if (rateLimitHealth.tier === 'Warning' || rateLimitHealth.tier === 'Elevated') {
      operatorWarnings.push({
        id: 'warning_rate_limit_elevated',
        severity: 'medium',
        message: rateLimitHealth.recommendation,
        recommendedAction: 'Reduce request frequency.',
        createdAt: currentTime,
      });
    }

    // Calculate overall health
    const componentScores = [
      tokenHealth.score,
      quotaHealth.quotaScore,
      scopeHealth.score,
      rateLimitHealth.score,
      context.complianceScore ?? 80,
      context.resilienceScore ?? 80,
      context.queueHealth ?? 80,
      context.approvalHealth ?? 80,
      context.previewHealth ?? 80,
      context.executionHealth ?? 80,
    ];

    const overallHealth = Math.round(componentScores.reduce((a, b) => a + b, 0) / componentScores.length);

    // Determine production readiness
    const productionReadiness = {
      score: overallHealth,
      status:
        operatorWarnings.filter((w) => w.severity === 'critical').length > 0
          ? ('critical' as const)
          : operatorWarnings.filter((w) => w.severity === 'high').length > 0
            ? ('degraded' as const)
            : ('healthy' as const),
      severity:
        operatorWarnings.filter((w) => w.severity === 'critical').length > 0
          ? ('critical' as const)
          : operatorWarnings.filter((w) => w.severity === 'high').length > 0
            ? ('high' as const)
            : operatorWarnings.length > 0
              ? ('medium' as const)
              : ('low' as const),
      recommendation: this.getProductionRecommendation(operatorWarnings, overallHealth),
      lastValidated: currentTime,
      healthTrend: 'steady' as const,
      productionReadiness: overallHealth,
    };

    // Compile recommended actions
    const recommendedActions = operatorWarnings
      .sort((a, b) => {
        const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .slice(0, 5)
      .map((w) => w.recommendedAction);

    if (overallHealth >= 90) {
      recommendedActions.unshift('All systems nominal. No immediate action required.');
      recommendedActions.push('Continue monitoring rate limits and quotas.');
    } else if (overallHealth >= 70) {
      recommendedActions.unshift('Monitor for issues. Consider addressing warnings.');
    } else {
      recommendedActions.unshift('ATTENTION: Critical issues must be resolved before production deployment.');
    }

    return {
      overallHealth,
      productionReadiness,
      connectorHealth: {
        compliance: context.complianceScore ?? 80,
        resilience: context.resilienceScore ?? 80,
        oauth: tokenHealth.score,
        queue: context.queueHealth ?? 80,
        approval: context.approvalHealth ?? 80,
        preview: context.previewHealth ?? 80,
        execution: context.executionHealth ?? 80,
      },
      operatorWarnings,
      recommendedActions,
      tokenHealth,
      quotaHealth,
      scopeHealth,
      rateLimitHealth,
      connectionHealth,
    };
  }

  /**
   * Get production readiness recommendation
   */
  private getProductionRecommendation(warnings: OperatorWarning[], overallHealth: number): string {
    const criticalCount = warnings.filter((w) => w.severity === 'critical').length;

    if (criticalCount > 0) {
      return `Connector is not production-ready. ${criticalCount} critical issue(s) must be resolved.`;
    }

    const highCount = warnings.filter((w) => w.severity === 'high').length;
    if (highCount > 0) {
      return `Connector has issues affecting production readiness. Review ${highCount} warning(s) before deployment.`;
    }

    if (overallHealth < 70) {
      return 'Connector health is below recommended threshold. Address warnings before production deployment.';
    }

    if (overallHealth < 85) {
      return 'Connector is production-ready but monitor closely for emerging issues.';
    }

    return 'Connector is production-ready. Safe to deploy.';
  }
}
